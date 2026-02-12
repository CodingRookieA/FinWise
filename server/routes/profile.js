import express from 'express'
import { getProfile, patchProfile, getRandomUnanswered } from '../controllers/profile.js'

const profileRouter = express.Router()

profileRouter.get('/profile', getProfile)
profileRouter.patch('/profile', patchProfile)
profileRouter.get('/questionnaire', getRandomUnanswered)

export default profileRouter
