import promptengineering from '../helpers/promptengineering.js'
import { classifyQuery } from '../helpers/classifier.js'
import Message from '../models/Message.js'
import { Profile } from '../models/profile.js'
import { randomUUID } from 'crypto'
import mongoose from 'mongoose'
import { ENVIRONMENT } from '../utils/constants.js'

export default {
    async sendMessage(req, res) {
        try {
            // Receive user prompt
            const { message, userId, sessionId } = req.body

            if (!message) {
                return res.status(400).json({ error: 'Message is required' })
            }

            // Call the classifier to determine if we need to fetch articles or funds data before responding
            // This will help the AI model provide more accurate and relevant responses to user queries
            let userProfile = null
            const profileUserId = req.session.userId
            if (profileUserId && mongoose.Types.ObjectId.isValid(profileUserId)) {
                userProfile = await Profile.findOne({ userId: profileUserId }).lean()
            }

            const classification = await classifyQuery(message, userProfile)
            console.log('Classification result:', classification)


            //Build the prompts
            const messages = await promptengineering.generatePrompt(message, userId, classification)

            // Call Gemma 3 27B via Google AI API
            // Note: Gemma models do not support system_instruction — prepend it to the first user turn instead
            const response = await fetch(
                `${ENVIRONMENT.aiGeneralUrl}?key=${ENVIRONMENT.aiGeneralApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: messages[0].content + '\n\n' + messages[1].content }]
                            }
                        ],
                        generationConfig: {
                            maxOutputTokens: ENVIRONMENT.aiMaxTokens,
                            temperature: ENVIRONMENT.aiTemperature
                        }
                    })
                }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(`AI API error: ${JSON.stringify(error)}`)
            }

            const data = await response.json()
            const aiResponse = data.candidates[0].content.parts[0].text

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