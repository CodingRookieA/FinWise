export const ENVIRONMENT = {
    mode: import.meta.env.MODE,
    oauthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    serverURLDevelopment: import.meta.env.VITE_SERVER_URL_DEVELOPMENT,
    serverURLCanary: import.meta.env.VITE_CANARY_SERVER_URL,
    serverURLProduction: import.meta.env.VITE_SERVER_URL,
    chatResponseMode: import.meta.env.VITE_CHAT_RESPONSE_MODE || 'streaming',
    canaryClientURL: import.meta.env.VITE_CANARY_CLIENT_URL
}

const server = window.location.href.includes(ENVIRONMENT.canaryClientURL) ? 
    ENVIRONMENT.serverURLCanary :
    ENVIRONMENT.serverURLProduction

console.log(server)

export const SERVERURL =
    ENVIRONMENT.mode === 'production' ? 
        server :
        ENVIRONMENT.serverURLDevelopment
