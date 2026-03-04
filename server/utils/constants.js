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
    geminiApiKey: process.env.GEMINI,
    // AI Model Configuration
    aiEmbeddingUrl: process.env.AI_EMBEDDING_URL,
    aiEmbeddingApiKey: process.env.AI_EMBEDDING_API_KEY,
    aiGeneralUrl: process.env.AI_GENERAL_URL,
    aiGeneralApiKey: process.env.AI_GENERAL_API_KEY
}

// Allowed article categories (must match Source model enum)
export const ALLOWED_CATEGORIES = [
    'fundamentals',       // What is a mutual fund, NAV, units etc.
    'canadian_accounts',  // RRSP, TFSA, FHSA, RESP, RRIF
    'strategy',           // Asset allocation, diversification, rebalancing
    'fees',               // MER, TER, DSC, fund series
    'tax',                // Distribution types, ACB, capital gains
]

export const PORT = ENVIRONMENT.port || 9000
export const CLIENTURL = 
    ENVIRONMENT.nodeEnv === 'production'
    ? ENVIRONMENT.clientURLProduction
    : ENVIRONMENT.clientURLDevelopment
