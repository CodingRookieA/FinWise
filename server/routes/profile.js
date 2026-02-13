import express from 'express'
import profileController  from '../controllers/profile.js'

const profileRouter = express.Router();

profileRouter.get('/', profileController.getProfile)
profileRouter.patch('/', profileController.patchProfile)
profileRouter.get('/questionnaire', profileController.getRandomUnanswered)

export default profileRouter
