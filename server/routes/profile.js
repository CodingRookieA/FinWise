// --- Strategy Pattern: Profile Routing Strategy ---
// This router is a concrete strategy for handling all user-profile requests
// (fetching/updating profile data, questionnaire, field metadata).
// It encapsulates the routing logic for the /api/profile namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import profileController  from '../controllers/profile.js'
import { checkAuth } from '../middleware/checkAuth.js';

const profileRouter = express.Router();

profileRouter.get('/', checkAuth, profileController.getProfile)
profileRouter.patch('/', checkAuth, profileController.patchProfile)
profileRouter.get('/questionnaire', checkAuth, profileController.getRandomUnanswered)
profileRouter.get("/meta", checkAuth, profileController.getAllFields);

export default profileRouter
