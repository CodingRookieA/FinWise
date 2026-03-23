import { Account } from '../../models/Account.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendVerificationEmail } from '../../lib/mailtrap.js'
import { CLIENTURL, ENVIRONMENT } from '../../utils/constants.js'

function createHttpError(status, message) {
    const error = new Error(message)
    error.status = status
    return error
}

export function createAccountService(deps = {}) {
    const {
        AccountModel = Account,
        bcryptLib = bcrypt,
        jwtLib = jwt,
        sendVerificationEmailFn = sendVerificationEmail,
        environment = ENVIRONMENT,
        clientUrl = CLIENTURL,
        fetchFn = fetch,
    } = deps

    async function googleLogin(code) {
        const tokenRes = await fetchFn('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: environment.oauthClientId,
                client_secret: environment.oauthClientSecret,
                redirect_uri: `${clientUrl}/google-redirect`,
                grant_type: 'authorization_code'
            })
        })

        const tokenData = await tokenRes.json()
        if (tokenData.error) {
            throw createHttpError(400, `Error: ${tokenData.error}`)
        }

        const userInfoRes = await fetchFn('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        })
        const userInfo = await userInfoRes.json()
        if (userInfo.error) {
            throw createHttpError(400, `Error: ${userInfo.error}`)
        }

        const { email, picture, name } = userInfo
        let user = await AccountModel.findOneAndUpdate({ email }, { name, picture })

        if (!user) {
            user = new AccountModel({
                email,
                name,
                picture,
                authType: 'google',
                isVerified: true
            })
            await user.save()
        }

        return {
            user,
            response: { message: 'Login success' }
        }
    }

    async function localSignup({ email, name, password }) {
        const existingUser = await AccountModel.findOne({ email })
        if (existingUser) {
            throw createHttpError(400, 'The email is already registered.')
        }

        const salt = await bcryptLib.genSalt(10)
        const hashedPassword = await bcryptLib.hash(password, salt)

        const user = await AccountModel.create({
            name,
            email,
            password: hashedPassword
        })

        const token = jwtLib.sign({ email }, environment.jwtSecret, { expiresIn: '1h' })
        sendVerificationEmailFn(email, token)

        return {
            user,
            response: {
                message: 'The user has been successfully registered. A verification email should have been sent to your email'
            }
        }
    }

    async function localLogin({ email, password }) {
        const existingUser = await AccountModel.findOne({ email })
        if (!existingUser) {
            throw createHttpError(400, 'This account does not exist')
        }

        if (existingUser.authType === 'google') {
            throw createHttpError(400, 'This account was created using google. Please use google to log in')
        }

        const passwordMatch = await bcryptLib.compare(password, existingUser.password)
        if (!passwordMatch) {
            throw createHttpError(401, 'The password is incorrect')
        }

        return {
            user: existingUser,
            response: { message: 'Logged in successfully' }
        }
    }

    function checkUserAuth(session) {
        if (!session.userId) {
            throw createHttpError(401, 'User not authenticated')
        }

        const { userId, email, name, picture, isVerified } = session
        return { userId, email, name, picture, isVerified }
    }

    return {
        googleLogin,
        localSignup,
        localLogin,
        checkUserAuth,
    }
}
