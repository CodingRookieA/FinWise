import express from 'express'
import AccountController from '../controllers/account.js'

const userRouter = express.Router()

userRouter.post('/register', AccountController.register)

export default userRouter
