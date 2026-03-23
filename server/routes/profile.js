// --- Strategy Pattern: Profile Routing Strategy ---
// This router is a concrete strategy for handling all user-profile requests
// (fetching/updating profile data, questionnaire, field metadata).
// It encapsulates the routing logic for the /api/profile namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import profileController  from '../controllers/profile.js'
import { checkAuth } from '../middleware/checkAuth.js';

export function createProfileRouter(controller = profileController) {
	const profileRouter = express.Router();

	profileRouter.get('/', checkAuth, controller.getProfile)
	profileRouter.patch('/', checkAuth, controller.patchProfile)
	profileRouter.get('/questionnaire', checkAuth, controller.getRandomUnanswered)
	profileRouter.get('/meta', checkAuth, controller.getAllFields);

	return profileRouter
}

export default createProfileRouter()
