export const ENVIRONMENT = {
    mode: import.meta.env.MODE,
    oauthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    serverURLDevelopment: import.meta.env.VITE_SERVER_URL_DEVELOPMENT,
    serverURLProduction: import.meta.env.VITE_SERVER_URL,
    chatResponseMode: import.meta.env.VITE_CHAT_RESPONSE_MODE || 'streaming',
}

// Prefer VITE_SERVER_URL when set (production / .env.production). Local dev should set only
// VITE_SERVER_URL_DEVELOPMENT in .env so localhost never overrides a production build.
export const SERVERURL =
    import.meta.env.VITE_SERVER_URL ||
    import.meta.env.VITE_SERVER_URL_DEVELOPMENT ||
    ''
console.log(import.meta.env.VITE_SERVER_URL, SERVERURL)