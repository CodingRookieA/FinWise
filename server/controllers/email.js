import { createEmailService } from '../services/email/emailService.js'
import { saveUserToSession } from '../helpers/saveUserToSession.js';

export function createEmailController(emailService = createEmailService()) {
    return {
        async verifyEmail(req, res) {
            const { token } = req.params

            try {
                const { user, response } = await emailService.verifyEmailToken(token)
                saveUserToSession(req.session, user)
                res.status(200).json(response)
            }
            catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while verifying email'
                })
            }
        },

        async sendVerificationEmail(req, res) {
            try {
                const response = await emailService.sendVerification(req.session.userId)
                res.status(201).json(response)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while sending verification email'
                })
            }
        }
    }
}

export default createEmailController()