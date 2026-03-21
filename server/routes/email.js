// --- Strategy Pattern: Email Routing Strategy ---
// This router is a concrete strategy for handling all email-related requests
// (sending verification emails, confirmation flows, etc.).
// It encapsulates the routing logic for the /api/email namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import EmailController from '../controllers/email.js'

export function createEmailRouter(controller = EmailController) {
	const emailRouter = express.Router()

	emailRouter.post('/verifyEmail/:token', controller.verifyEmail)
	emailRouter.post('/sendVerificationEmail', controller.sendVerificationEmail)

	return emailRouter
}

export default createEmailRouter()
