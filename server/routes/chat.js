import express from 'express'
import ChatController from '../controllers/chat.js'

const chatRouter = express.Router()

// Define send chat message route
chatRouter.post('/send', ChatController.sendMessage)

//Get chat history for a specific user
chatRouter.get('/history', ChatController.getUserChatHistory)

//Get messages for a specific session
chatRouter.get('/session/:sessionId', ChatController.getSessionMessages)

export default chatRouter