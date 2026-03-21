// --- Strategy Pattern: Account Routing Strategy ---
// This router is a concrete strategy for handling all authentication and
// account-related requests (login, signup, logout, auth checks).
// It encapsulates the routing logic for the /api/users namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import AccountController from '../controllers/account.js'

export function createAccountRouter(controller = AccountController) {
	const accountRouter = express.Router()

	accountRouter.get('/checkUserAuth', controller.checkUserAuth)
	accountRouter.post('/googleLogin', controller.googleLogin)
	accountRouter.post('/logout', controller.logout)
	accountRouter.post('/localSignup', controller.localSignup)
	accountRouter.post('/localLogin', controller.localLogin)

	return accountRouter
}

export default createAccountRouter()
