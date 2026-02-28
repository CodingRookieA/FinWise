import express from 'express'
import EmailController from '../controllers/email.js'

const emailRouter = express.Router()

emailRouter.post('/verifyEmail/:token', EmailController.verifyEmail)
emailRouter.post('/sendVerificationEmail', EmailController.sendVerificationEmail)

export default emailRouter
