// --- Strategy Pattern: Chat Routing Strategy ---
// This router is a concrete strategy for handling all chat-related requests
// (sending messages, retrieving chat history, fetching session messages).
// It encapsulates the routing logic for the /api/chat namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import ChatController from '../controllers/chatController.js'

export function createChatRouter(controller = ChatController) {
	const chatRouter = express.Router()

	// Define send chat message route
	chatRouter.post('/send', controller.sendMessage)

	//Get chat history for a specific user
	chatRouter.get('/history', controller.getUserChatHistory)

	//Get messages for a specific session
	chatRouter.get('/session/:sessionId', controller.getSessionMessages)

	return chatRouter
}

export default createChatRouter()