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
        // Logic to retrieve chat history
    },
    async getUserChatHistory(req, res) {
        // Logic to retrieve chat history for a specific user
    }
}