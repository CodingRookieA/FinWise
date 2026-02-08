import express from 'express'
import AccountController from '../controllers/account.js'

const accountRouter = express.Router()

accountRouter.post('/register', AccountController.register)

export default accountRouter
