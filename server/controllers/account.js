import { config } from 'dotenv'
import { Account } from '../models/Account.js'

config()

const clientId = process.env.OAUTH_CLIENT_ID
const clientSecret = process.env.OAUTH_SECRET_KEY
const nodeEnv = process.env.NODE_ENV
const clientURL = 
    nodeEnv === 'production'
    ? process.env.CLIENT_URL
    : process.env.CLIENT_URL_DEVELOPMENT

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
                    picture
                })
                await user.save()
            }

            // Save to session
            req.session.userId = user._id
            req.session.email = user.email
            req.session.name = user.name
            req.session.picture = user.picture

            return res.status(200).json({
                message: 'Login success'
            })
        } catch (error) {
            console.error(error.message)
            res.status(500).json({
                error: "An error occured while logging in with Google"
            })
        }
    },
    async logout(req, res) {
        try {
            req.session.destroy();
            res.status(200).json({
                message: 'The user has been logged out',
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                error: 'An error occurred while logging out'
            });
        }
    },
    async checkUserAuth(req, res) {
        try {
            console.log(req.session)
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
            console.error(err);
            res.status(500).json({
                error: 'An error occurred while authenticating user'
            });
        }
    }
}
