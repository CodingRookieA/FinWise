import { Account } from '../models/Account.js'
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../lib/mailtrap.js';
import { ENVIRONMENT } from '../utils/constants.js';
import { saveUserToSession } from '../helpers/saveUserToSession.js';

export default {
    async verifyEmail(req, res) {
        const { token } = req.params

        try {
            jwt.verify(token, ENVIRONMENT.jwtSecret, async (error, decoded) => {
                if (error){
                    return res.status(400).json({ error: `Error: ${error.message}` })
                }
                if(!decoded) return res.status(401).json({
                    error: "Invalid or expired link"
                })
    
                const user = await Account.findOne({ email: decoded.email })
                if(!user) return res.status(404).json({
                    error: "User does not exist"
                })
                
                if(user.isVerified) return res.status(400).json({
                    error: "This email is already verified"
                })
    
                // TODO: Find way to expire the jwt after user verifies email ???
    
                // Mark account as verified and log them in
                user.isVerified = true
                user.save()
    
                saveUserToSession(req.session, user)

                res.status(200).json({
                    message: "Successfully verified email"
                })
            })
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while verifying email'
            });
        }
    },
    async sendVerificationEmail(req, res) {
        try {
            const { userId } = req.session

            if(!userId) return res.status(401).json({ error: "Not logged in" })

            const user = await Account.findById(userId)
            
            if(user.isVerified){
                return res.status(400).json({
                    error: "The email is already verified"
                })
            }

            // Create token
            const token = jwt.sign({
                email: user.email
            }, ENVIRONMENT.jwtSecret, { expiresIn: '1h' })

            sendVerificationEmail(user.email, token)

            res.status(201).json({
                message: "Verification email sent"
            })
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while sending verification email'
            });
        }
    }
}