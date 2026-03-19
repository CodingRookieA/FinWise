import mongoose from 'mongoose'
import { createChatService } from '../services/chat/chatService.js'

const chatService = createChatService()

export default {
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
    }
}
