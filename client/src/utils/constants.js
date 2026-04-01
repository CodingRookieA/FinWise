export const ENVIRONMENT = {
    mode: import.meta.env.MODE,
    oauthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    serverURLDevelopment: import.meta.env.VITE_SERVER_URL_DEVELOPMENT,
    serverURLProduction: import.meta.env.VITE_SERVER_URL,
    chatResponseMode: import.meta.env.VITE_CHAT_RESPONSE_MODE || 'streaming',
}

// Production builds must set VITE_SERVER_URL (browser → API). Fall back to dev URL if missing.
export const SERVERURL =
    ENVIRONMENT.mode === 'production'
        ? ENVIRONMENT.serverURLProduction || ENVIRONMENT.serverURLDevelopment
        : ENVIRONMENT.serverURLDevelopment
