import { config } from "dotenv"
config()

export const ENVIRONMENT = {
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    clientURLProduction: process.env.CLIENT_URL,
    clientURLDevelopment: process.env.CLIENT_URL_DEVELOPMENT,
    mongoURI: process.env.MONGODB_URI,
    sessionSecretKey: process.env.SESSION_SECRET_KEY,
    mailtrapToken: process.env.MAILTRAP_API_TOKEN,
    jwtSecret: process.env.JWT_SECRET,
    oauthClientId: process.env.OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.OAUTH_SECRET_KEY,
}

export const PORT = ENVIRONMENT.port || 9000
export const CLIENTURL = 
    ENVIRONMENT.nodeEnv === 'production'
    ? ENVIRONMENT.clientURLProduction
    : ENVIRONMENT.clientURLDevelopment
