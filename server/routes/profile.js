import express from 'express'
import profileController  from '../controllers/profile.js'
import { checkAuth } from '../middleware/checkAuth.js';

const profileRouter = express.Router();

profileRouter.get('/', checkAuth, profileController.getProfile)
profileRouter.patch('/', checkAuth, profileController.patchProfile)
profileRouter.get('/questionnaire', checkAuth, profileController.getRandomUnanswered)
profileRouter.get("/meta", checkAuth, profileController.getAllFields);

export default profileRouter
