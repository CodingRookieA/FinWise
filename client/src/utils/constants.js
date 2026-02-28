export const ENVIRONMENT = {
    mode: import.meta.env.MODE,
    oauthClientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    serverURLDevelopment: import.meta.env.VITE_SERVER_URL_DEVELOPMENT,
    serverURLProduction: import.meta.env.VITE_SERVER_URL,
}

export const mode = ENVIRONMENT.mode
export const serverURL = mode === 'production' 
    ? ENVIRONMENT.serverURLProduction
    : ENVIRONMENT.serverURLDevelopment