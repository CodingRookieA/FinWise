import express from 'express'
import AccountController from '../controllers/account.js'

const accountRouter = express.Router()

accountRouter.get('/checkUserAuth', AccountController.checkUserAuth)
accountRouter.post('/googleLogin', AccountController.googleLogin)
accountRouter.post('/logout', AccountController.logout)

export default accountRouter
