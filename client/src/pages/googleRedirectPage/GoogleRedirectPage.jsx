import { CircularProgress, Typography } from '@mui/material';
import styles from './googleRedirectPage.module.css';
import { useEffect, useState } from 'react';

const mode = import.meta.env.MODE
const serverURL = mode === 'production' 
    ? import.meta.env.VITE_SERVER_URL 
    : import.meta.env.VITE_SERVER_URL_DEVELOPMENT

export const GoogleRedirectPage = () => {

    const [error, setError] = useState(false)
    const [loginTitle, setLoginTitle] = useState("Signing you in with Google")
    const [loginMessage, setLoginMessage] = useState("Please wait while we complete your authentication. You'll be redirected shortly.")

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const error = params.get('error')

        const googleSignIn = async () => {
            try {
                const res = await fetch(
                    `${serverURL}/api/users/googleLogin`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ code })
                    }
                )
                const result = await res.json()
                if(result.error) {
                    setError(true)
                    setLoginTitle('There was a problem signing you in with google')
                    setLoginMessage(result.error)
                } else {
                    window.location.href = '/'
                }
            } catch (error) {
                console.log(error)
                setError(true)
                setLoginTitle('There was a problem signing you in with google')
                setLoginMessage(error.message)
            }
        }
                
        setTimeout(() => {
            if(error) {
                setError(true)
                setLoginTitle('There was a problem signing you in with google')
                setLoginMessage(`Error: ${error}`)
            }
    
            if(code) {
                googleSignIn()
            }
        }, 1000)
    }, [])

    return(
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.content}>
                    <div className={styles.logoRow}>
                        <Typography variant="h4" fontWeight={700} color="text.primary">
                            Fin<span style={{color: '#10B981'}}>Wise</span>
                        </Typography>
                    </div>

                    {!error &&
                        <div className={styles.spinnerWrap}>
                            <CircularProgress size={56} sx={{ color: 'primary.main' }} />
                        </div>
                    }

                    <Typography variant="h5" color="text.primary" gutterBottom fontWeight={600}>
                        {loginTitle}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        {loginMessage}
                    </Typography>

                    <a href="/" className={styles.link}>
                        Return to Home
                    </a>
                </div>
            </div>
        </div>
    )
}
