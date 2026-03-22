import { Account } from '../../models/Account.js'
import jwt from 'jsonwebtoken'
import { sendVerificationEmail } from '../../lib/mailtrap.js'
import { ENVIRONMENT } from '../../utils/constants.js'

function createHttpError(status, message) {
    const error = new Error(message)
    error.status = status
    return error
}

export function createEmailService(deps = {}) {
    const {
        AccountModel = Account,
        jwtLib = jwt,
        sendVerificationEmailFn = sendVerificationEmail,
        environment = ENVIRONMENT,
    } = deps

    function verifyToken(token) {
        return new Promise((resolve, reject) => {
            jwtLib.verify(token, environment.jwtSecret, (error, decoded) => {
                if (error) {
                    return reject(createHttpError(400, `Error: ${error.message}`))
                }
                resolve(decoded)
            })
        })
    }

    async function verifyEmailToken(token) {
        const decoded = await verifyToken(token)
        if (!decoded) {
            throw createHttpError(401, 'Invalid or expired link')
        }

        const user = await AccountModel.findOne({ email: decoded.email })
        if (!user) {
            throw createHttpError(404, 'User does not exist')
        }

        if (user.isVerified) {
            throw createHttpError(400, 'This email is already verified')
        }

        user.isVerified = true
        await user.save()

        return {
            user,
            response: { message: 'Successfully verified email' }
        }
    }

    async function sendVerification(sessionUserId) {
        if (!sessionUserId) {
            throw createHttpError(401, 'Not logged in')
        }

        const user = await AccountModel.findById(sessionUserId)
        if (user.isVerified) {
            throw createHttpError(400, 'The email is already verified')
        }

        const token = jwtLib.sign({ email: user.email }, environment.jwtSecret, { expiresIn: '1h' })
        sendVerificationEmailFn(user.email, token)

        return { message: 'Verification email sent' }
    }

    return {
        verifyEmailToken,
        sendVerification,
    }
}
