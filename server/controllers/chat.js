import promptengineering from '../helpers/promptengineering.js'
import axios from 'axios'
import Message from '../models/Message.js'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'

const perplexityAPIKey = null // change when we find new API

export default {
    async sendMessage(req, res) {
        try {
            // Receive user prompt
            const { message, userId, sessionId } = req.body

            if (!message) {
                return res.status(400).json({ error: 'Message is required' })
            }

            //Call the classifier to determine if we need to fetch articles or funds data before responding
            //This will help the AI model provide more accurate and relevant responses to user queries
            const classification = await classifyQuery(message)
            console.log('Classification result:', classification)


            //Build the prompts
            const messages = promptengineering.generatePrompt(message, userId, classification)

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
                        'Authorization': `Bearer ${perplexityAPIKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            const aiResponse = response.data.choices[0].message.content
            const citations = response.data.citations || []

            const shouldStore = req.session.userId ? true : false
            let savedUserMessage = null
            let savedAIMessage = null

            if (shouldStore) {
                console.log('Storing messages in database...')

                // Generate sessionId if not provided
                const currentSessionId = sessionId || randomUUID()
                
                //Replace with userId stored in session when merging
                let effectiveUserId = req.session.userId
                
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
                    role: 'AI',
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
            console.error('Error calling AI API:', error.response?.data || error.message)
            return res.status(500).json({
                error: 'Failed to process message',
                details: error.response?.data?.error || error.message
            })
        }
    },

    //Return all sessions for a user
    async getUserChatHistory(req, res) {
        try {
            const userId = req.session.userId

            if(!userId){
                //Guest user, don't return any history but also don't error out - just return empty list
                return res.status(200).json({ })
            }

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

    //Get all messages for a specific session
    async getSessionMessages(req, res) {
        try {
            const { sessionId } = req.params

            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID is required' })
            }

            //Verify is the user owns this session - only if user is logged in
            if (req.session.userId) {
                const userId = req.session.userId

                // Validate userId as ObjectId
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return res.status(400).json({ error: 'Invalid user ID format' })
                }
                const sessionExists = await Message.exists({ sessionId, sender: new mongoose.Types.ObjectId(userId) })
                if (!sessionExists) {
                    return res.status(403).json({ error: 'You do not have access to this session' })
                }
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