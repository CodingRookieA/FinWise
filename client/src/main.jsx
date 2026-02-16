import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from '@emotion/react'
import theme from './theme.js'
import { CssBaseline } from '@mui/material'
import { GoogleOAuthProvider } from '@react-oauth/google'

const oauthClientID = import.meta.env.VITE_OAUTH_CLIENT_ID

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={oauthClientID}>
      <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
