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
    aiGeneralApiKey: process.env.AI_GENERAL_API_KEY,
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.8,
    /** Vector search: max chunks to retrieve (general = articles-only path; narrow = with funds/ETFs) */
    articleChunkLimitGeneral: parseInt(process.env.ARTICLE_CHUNK_LIMIT_GENERAL, 10) || 8,
    articleChunkLimitNarrow: parseInt(process.env.ARTICLE_CHUNK_LIMIT_NARROW, 10) || 3,
    aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS) || 1000,
    aiTemperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    historyTokenBudget: parseInt(process.env.HISTORY_TOKEN_BUDGET) || 750,
    chatResponseMode: process.env.CHAT_RESPONSE_MODE || 'regular',
    /** Shown when the classifier marks the query as outside investing / personal finance scope */
    outOfScopeChatMessage:
        process.env.OUT_OF_SCOPE_CHAT_MESSAGE?.trim() ||
        "I'm FinWise and can only help with investing and personal finance topics related to mutual funds, ETFs, Canadian accounts (RRSP, TFSA, FHSA, etc.), fees, taxes, and related education. Please ask a question in that area.",
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
