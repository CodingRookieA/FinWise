import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { createAccountRouter } from './routes/account.js'
import { createAssetRouter } from './routes/assetRoutes.js'
import { createProfileRouter } from './routes/profile.js'
import { createChatRouter } from './routes/chat.js'
import { createEmailRouter } from './routes/email.js'
import { CLIENTURL, ENVIRONMENT } from './utils/constants.js'

export function createApp({
    accountController,
    assetController,
    profileController,
    chatController,
    emailController,
    sessionMiddleware,
} = {}) {
    const app = express()

    const corsConfig = {
        origin: CLIENTURL,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
    }
    app.use(cors(corsConfig))

    if (sessionMiddleware) {
        app.use(sessionMiddleware)
    } else {
        app.use(
            session({
                secret: ENVIRONMENT.sessionSecretKey,
                saveUninitialized: false,
                resave: false,
            })
        )
    }

    app.use(express.json())

    app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'OK ' })
    })

    app.use('/api/users', createAccountRouter(accountController))
    app.use('/api/profile', createProfileRouter(profileController))
    app.use('/api/chat', createChatRouter(chatController))
    app.use('/api/assets', createAssetRouter(assetController))
    app.use('/api/email', createEmailRouter(emailController))

    return app
}
