import promptengineering from '../helpers/promptengineering.js'
import axios from 'axios'
import Message from '../models/Message.js'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'

export default {
    async sendMessage(req, res) {
        try {
            // Receive user prompt
            const { message, userId, sessionId } = req.body

            if (!message) {
                return res.status(400).json({ error: 'Message is required' })
            }

            //Build the prompts
            const messages = promptengineering.generatePrompt(message, userId)

            // Call Perplexity API
            const response = await axios.post(
                'https://api.perplexity.ai/chat/completions',
                {
                    model: 'sonar',
                    messages: messages,
                    max_tokens: 500,
                    temperature: 0.7,
                    return_citations: true
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            const aiResponse = response.data.choices[0].message.content
            const citations = response.data.citations || []

            // Store messages if user has a session (for testing, default to storing)
            // Guest users: no sessionId or userId means don't store
            const shouldStore = userId || sessionId // Default to storing for testing
            let savedUserMessage = null
            let savedAIMessage = null

            if (shouldStore) {
                console.log('Storing messages in database...')

                // Generate sessionId if not provided
                const currentSessionId = sessionId || randomUUID()
                
                //Replace with userId stored in session when merging
                let effectiveUserId = '000000000000000000000000' // Default placeholder ObjectId
                
                // Save user message
                savedUserMessage = await Message.create({
                    sender: effectiveUserId,
                    content: message,
                    sessionId: currentSessionId,
                    role: 'user'
                })

                // Save AI response with reference to user message
                savedAIMessage = await Message.create({
                    sender: effectiveUserId,
                    content: aiResponse,
                    sessionId: currentSessionId,
                    role: 'assistant',
                    reference: savedUserMessage._id.toString()
                })
            }

            // Return the response
            return res.status(200).json({
                success: true,
                response: aiResponse,
                citations: citations,
                usage: response.data.usage,
                stored: shouldStore,
                sessionId: savedUserMessage?.sessionId,
                messageIds: shouldStore ? {
                    userMessage: savedUserMessage._id,
                    aiMessage: savedAIMessage._id
                } : null
            })

        } catch (error) {
            console.error('Error calling Perplexity API:', error.response?.data || error.message)
            return res.status(500).json({
                error: 'Failed to process message',
                details: error.response?.data?.error || error.message
            })
        }
    },
    async getChatHistory(req, res) {
        try {
            //Use the default placeholder userId for testing now
            const userId = '000000000000000000000000'

            // Validate userId as ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid user ID format' })
            }

            // Get all unique sessions for this user with their latest message
            const sessions = await Message.aggregate([
                {
                    $match: { 
                        sender: new mongoose.Types.ObjectId(userId),
                        sessionId: { $exists: true, $ne: null }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $group: {
                        _id: '$sessionId',
                        latestMessage: { $first: '$$ROOT' },
                        messageCount: { $sum: 1 },
                        lastUpdated: { $first: '$createdAt' }
                    }
                },
                {
                    $sort: { lastUpdated: -1 }
                },
                {
                    $limit: 50
                }
            ])

            const formattedSessions = sessions.map(session => ({
                sessionId: session._id,
                title: session.latestMessage.content.substring(0, 50) + (session.latestMessage.content.length > 50 ? '...' : ''),
                date: session.lastUpdated.toLocaleDateString(),
                messageCount: session.messageCount
            }))

            res.status(200).json({
                success: true,
                sessions: formattedSessions
            })

        } catch (error) {
            console.error('Error fetching chat history:', error)
            res.status(500).json({
                error: 'Failed to fetch chat history',
                details: error.message
            })
        }
    },
    async getUserChatHistory(req, res) {
        try {
            const { userId } = req.params

            // Validate userId as ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: 'Invalid user ID format' })
            }

            // Get all unique sessions for this user with their latest message
            const sessions = await Message.aggregate([
                {
                    $match: { 
                        sender: new mongoose.Types.ObjectId(userId),
                        sessionId: { $exists: true, $ne: null }
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $group: {
                        _id: '$sessionId',
                        latestMessage: { $first: '$$ROOT' },
                        messageCount: { $sum: 1 },
                        lastUpdated: { $first: '$createdAt' }
                    }
                },
                {
                    $sort: { lastUpdated: -1 }
                },
                {
                    $limit: 50
                }
            ])

            const formattedSessions = sessions.map(session => ({
                sessionId: session._id,
                title: session.latestMessage.content.substring(0, 50) + (session.latestMessage.content.length > 50 ? '...' : ''),
                date: session.lastUpdated.toLocaleDateString(),
                messageCount: session.messageCount
            }))

            res.status(200).json({
                success: true,
                sessions: formattedSessions
            })

        } catch (error) {
            console.error('Error fetching user chat history:', error)
            res.status(500).json({
                error: 'Failed to fetch user chat history',
                details: error.message
            })
        }
    },
    async getSessionMessages(req, res) {
        try {
            const { sessionId } = req.params

            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' })
            }

            // Get all messages for this session
            const messages = await Message.find({ sessionId })
                .sort({ createdAt: 1 })
                .select('role content createdAt')

            res.status(200).json({
                success: true,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.createdAt
                }))
            })

        } catch (error) {
            console.error('Error fetching session messages:', error)
            res.status(500).json({
                error: 'Failed to fetch session messages',
                details: error.message
            })
        }
    }
}