import express from 'express'
import profileController  from '../controllers/profile.js'

const profileRouter = express.Router();

profileRouter.get('/profile', profileController.getProfile)
profileRouter.patch('/profile', profileController.patchProfile)
profileRouter.get('/questionnaire', profileController.getRandomUnanswered)

export default profileRouter
