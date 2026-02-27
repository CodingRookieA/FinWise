import express from 'express'
import AccountController from '../controllers/account.js'

const accountRouter = express.Router()

accountRouter.get('/checkUserAuth', AccountController.checkUserAuth)
accountRouter.post('/googleLogin', AccountController.googleLogin)
accountRouter.post('/logout', AccountController.logout)
accountRouter.post('/localSignup', AccountController.localSignup)
accountRouter.post('/localLogin', AccountController.localLogin)
accountRouter.post('/verifyEmail/:token', AccountController.verifyEmail)

export default accountRouter
