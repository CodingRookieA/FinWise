import express from 'express'
import ChatController from '../controllers/chat.js'

const chatRouter = express.Router()

// Define chat-related routes
chatRouter.post('/send', ChatController.sendMessage)
chatRouter.get('/history', ChatController.getChatHistory)

//Get chat history for a specific user
chatRouter.get('/history/:userId', ChatController.getUserChatHistory)
export default chatRouter