import mongoose from 'mongoose'
import { createChatService } from '../services/chat/chatService.js'
import { ENVIRONMENT } from '../utils/constants.js'

export function createChatController(chatService = createChatService()) {
    return {
        async sendMessage(req, res) {
            try {
                const { message, userId, sessionId } = req.body

                if (!message) {
                    return res.status(400).json({ error: 'Message is required' })
                }

                const result = await chatService.sendMessage({
                    message,
                    userId,
                    sessionId,
                    sessionUserId: req.session.userId
                })

                return res.status(200).json(result)
            } catch (error) {
                console.error('Error calling AI API:', error.response?.data || error.message)
                return res.status(500).json({
                    error: 'Failed to process message',
                    details: error.response?.data?.error || error.message
                })
            }
        },

        async sendMessageStream(req, res) {
            try {
                if (ENVIRONMENT.chatResponseMode !== 'streaming') {
                    return res.status(400).json({
                        error: 'Streaming mode is disabled. Set CHAT_RESPONSE_MODE=streaming to enable.'
                    })
                }

                const { message, userId, sessionId } = req.body

                if (!message) {
                    return res.status(400).json({ error: 'Message is required' })
                }

                res.setHeader('Content-Type', 'text/event-stream')
                res.setHeader('Cache-Control', 'no-cache, no-transform')
                res.setHeader('Connection', 'keep-alive')
                res.flushHeaders?.()

                const writeEvent = (eventName, payload) => {
                    res.write(`event: ${eventName}\n`)
                    res.write(`data: ${JSON.stringify(payload)}\n\n`)
                }

                const result = await chatService.sendMessageStream({
                    message,
                    userId,
                    sessionId,
                    sessionUserId: req.session.userId,
                    onStatus: async (stage) => {
                        writeEvent('status', { stage })
                    },
                    onVisibleChunk: async (textChunk) => {
                        writeEvent('chunk', { text: textChunk })
                    }
                })

                writeEvent('done', { result })
                res.end()
            } catch (error) {
                console.error('Error calling streaming AI API:', error.response?.data || error.message)

                if (!res.headersSent) {
                    return res.status(500).json({
                        error: 'Failed to process message',
                        details: error.response?.data?.error || error.message
                    })
                }

                res.write(`event: error\n`)
                res.write(`data: ${JSON.stringify({
                    error: 'Failed to process message',
                    details: error.response?.data?.error || error.message
                })}\n\n`)
                res.end()
            }
        },

        async getUserChatHistory(req, res) {
            try {
                const userId = req.session.userId

                if (!userId) {
                    return res.status(200).json({ })
                }

                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return res.status(400).json({ error: 'Invalid user ID format' })
                }

                const sessions = await chatService.getUserChatHistory({ sessionUserId: userId })

                res.status(200).json({
                    success: true,
                    sessions
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

                if (req.session.userId) {
                    const userId = req.session.userId

                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        return res.status(400).json({ error: 'Invalid user ID format' })
                    }
                }

                const result = await chatService.getSessionMessages({
                    sessionId,
                    sessionUserId: req.session.userId
                })

                if (result.forbidden) {
                    return res.status(403).json({ error: 'You do not have access to this session' })
                }

                res.status(200).json({
                    success: true,
                    messages: result.messages
                })

            } catch (error) {
                console.error('Error fetching session messages:', error)
                res.status(500).json({
                    error: 'Failed to fetch session messages',
                    details: error.message
                })
            }
        },

        async deleteSession(req, res) {
            try {
                const { sessionId } = req.params

                if (!sessionId) {
                    return res.status(400).json({ error: 'Session ID is required' })
                }

                const userId = req.session.userId
                if (!userId) {
                    return res.status(401).json({ error: 'Authentication required' })
                }

                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    return res.status(400).json({ error: 'Invalid user ID format' })
                }

                const result = await chatService.deleteSession({
                    sessionId,
                    sessionUserId: userId
                })

                if (result.forbidden) {
                    return res.status(403).json({ error: 'You do not have access to this session' })
                }

                if (result.notFound) {
                    return res.status(404).json({ error: 'Session not found' })
                }

                return res.status(200).json({
                    success: true,
                    sessionId,
                    deletedCount: result.deletedCount
                })
            } catch (error) {
                console.error('Error deleting session:', error)
                return res.status(500).json({
                    error: 'Failed to delete session',
                    details: error.message
                })
            }
        }
    }
}

export default createChatController()
