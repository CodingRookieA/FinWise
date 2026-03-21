import { createAccountService } from '../services/account/accountService.js'
import { saveUserToSession } from '../helpers/saveUserToSession.js';

export function createAccountController(accountService = createAccountService()) {
    return {
        async googleLogin(req, res) {
            const { code } = req.body
            try {
                const { user, response } = await accountService.googleLogin(code)
                saveUserToSession(req.session, user)
                res.status(200).json(response)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error.message)
                res.status(500).json({
                    error: 'An error occured while logging in with Google'
                })
            }
        },

        async localSignup(req, res) {
            try {
                const { email, name, password } = req.body

                if (!email || !name || !password) {
                    return res.status(400).json({
                        error: 'Email, name or password is missing'
                    })
                }

                const { user, response } = await accountService.localSignup({ email, name, password })
                saveUserToSession(req.session, user)
                res.status(201).json(response)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while signing up'
                })
            }
        },

        async localLogin(req, res) {
            try {
                const { email, password } = req.body

                if (!email || !password) {
                    return res.status(400).json({
                        error: 'Email or password is missing'
                    })
                }

                const { user, response } = await accountService.localLogin({ email, password })
                saveUserToSession(req.session, user)
                res.status(201).json(response)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while logging in'
                })
            }
        },

        async logout(req, res) {
            try {
                req.session.destroy()
                res.status(200).json({
                    message: 'The user has been logged out',
                })
            }
            catch (error) {
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while logging out'
                })
            }
        },

        async checkUserAuth(req, res) {
            try {
                const authInfo = accountService.checkUserAuth(req.session)
                res.status(200).json(authInfo)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ error: error.message })
                }
                console.error(error)
                res.status(500).json({
                    error: 'An error occurred while authenticating user'
                })
            }
        }
    }
}

export default createAccountController()
