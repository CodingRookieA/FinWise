// --- Strategy Pattern: Account Routing Strategy ---
// This router is a concrete strategy for handling all authentication and
// account-related requests (login, signup, logout, auth checks).
// It encapsulates the routing logic for the /api/users namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import AccountController from '../controllers/account.js'

const accountRouter = express.Router()

accountRouter.get('/checkUserAuth', AccountController.checkUserAuth)
accountRouter.post('/googleLogin', AccountController.googleLogin)
accountRouter.post('/logout', AccountController.logout)
accountRouter.post('/localSignup', AccountController.localSignup)
accountRouter.post('/localLogin', AccountController.localLogin)

export default accountRouter
