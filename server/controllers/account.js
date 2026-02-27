import { config } from 'dotenv'
import { Account } from '../models/Account.js'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../lib/mailtrap.js';

config()

const clientId = process.env.OAUTH_CLIENT_ID
const clientSecret = process.env.OAUTH_SECRET_KEY
const nodeEnv = process.env.NODE_ENV
const clientURL = 
    nodeEnv === 'production'
    ? process.env.CLIENT_URL
    : process.env.CLIENT_URL_DEVELOPMENT
const jwtSecret = process.env.JWT_SECRET

export default {
    async googleLogin(req, res) {
        const { code } = req.body
        try {
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    code,
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: `${clientURL}/google-redirect`,
                    grant_type: 'authorization_code'
                })
            })

            const tokenData = await tokenRes.json()
            if(tokenData.error) return res.status(400).json({
                error: `Error: ${tokenData.error}`
            })

            // Fetch user info
            const userInfoRes = await fetch(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                {
                    headers: { Authorization: `Bearer ${tokenData.access_token}`}
                }
            )
            const userInfo = await userInfoRes.json()
            if(userInfo.error) return res.status(400).json({
                error: `Error: ${userInfo.error}`
            })

            const { email, picture, name } = userInfo

            // Check if account exists and update profile picture if needed
            let user = await Account.findOneAndUpdate({ email }, { name, picture })

            // Create an account if user does not exist
            if(!user) {
                user = new Account({
                    email,
                    name,
                    picture,
                    authType: 'google',
                    isVerified: true
                })
                await user.save()
            }

            // Save to session
            req.session.userId = user._id
            req.session.email = user.email
            req.session.name = user.name
            req.session.picture = user.picture

            res.status(200).json({
                message: 'Login success'
            })
        } catch (error) {
            console.error(error.message)
            res.status(500).json({
                error: "An error occured while logging in with Google"
            })
        }
    },
    async localSignup(req, res) {
        try {
            const { email, name, password } = req.body

            // Check email, name and password fields are non-empty
            if(!email || !name || !password){
                return res.status(400).json({
                    error: "Email, name or password is missing"
                })
            }

            const existingUser = await Account.findOne({ email })
            
            if(existingUser){
                return res.status(400).json({
                    error: "The email is already registered."
                })
            }

            // Hash password
            const saltRounds = 10
            const salt = await bcrypt.genSalt(saltRounds)
            const hashedPassword = await bcrypt.hash(password, salt)

            const user = await Account.create({
                name,
                email,
                password: hashedPassword
            });

            // Create token
            const token = jwt.sign({
                email
            }, jwtSecret, { expiresIn: '1h' })

            sendVerificationEmail(email, token)

            // Log them in
            req.session.userId = user._id
            req.session.email = user.email
            req.session.name = user.name
            req.session.picture = user.picture

            res.status(201).json({
                message: "The user has been successfully registered. A verification email should have been sent to your email"
            })
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while signing up'
            });
        }
    },
    async localLogin(req, res) {
        try {
            const { email, password } = req.body

            // Check email and password fields are non-empty
            if(!email || !password){
                return res.status(400).json({
                    error: "Email or password is missing"
                })
            }

            const existingUser = await Account.findOne({ email })
            
            if(!existingUser){
                return res.status(400).json({
                    error: "This account does not exist"
                })
            }

            const passwordMatch = bcrypt.compare(password, existingUser.password)

            if(!passwordMatch){
                return res.status(401).json({
                    error: "The password is incorrect"
                })
            }

            req.session.userId = existingUser._id
            req.session.email = existingUser.email
            req.session.name = existingUser.name
            req.session.picture = existingUser.picture

            res.status(201).json({
                message: "Logged in successfully"
            })
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while logging in'
            });
        }
    },
    async verifyEmail(req, res) {
        const { userId } = req.session
        const { token } = req.params

        try {
            if(!userId) return res.status(401).json({ error: "Not logged in" })

            const user = await Account.findById(userId)
            if(!user) return res.status(404).json({
                error: "User not found"
            })
            
            if(user.isVerified) return res.status(400).json({
                error: "This email is already verified"
            })

            const decoded = jwt.verify(token, jwtSecret)

            if(!decoded) return res.status(401).json({
                error: "Invalid or expired link"
            })

            if(decoded.email !== user.email) return res.status(400).json({
                error: "Email mismatch. Please make sure you log in with the email that the verification link was sent to"
            })

            // TODO: Find way to expire the jwt after user verifies email

            user.isVerified = true
            user.save()

            res.status(200).json({
                message: "Successfully verified email"
            })
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while verifying email'
            });
        }
    },
    async logout(req, res) {
        try {
            req.session.destroy();
            res.status(200).json({
                message: 'The user has been logged out',
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while logging out'
            });
        }
    },
    async checkUserAuth(req, res) {
        try {
            if(!req.session.userId){
                return res.status(401).json({
                    error: "User not authenticated"
                })
            }

            const { userId, email, name, picture } = req.session
            
            res.status(200).json({
                userId,
                email,
                name,
                picture
            })
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'An error occurred while authenticating user'
            });
        }
    }
}
