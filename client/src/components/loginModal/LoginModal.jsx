import { Box, Button, IconButton, Typography } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close';
import googleLogo from '../../assets/google_logo.png'

import styles from './loginModal.module.css'

const oauthClientID = import.meta.env.VITE_OAUTH_CLIENT_ID

export const LoginModal = ({ handleModalClose }) => {
    const handleGoogleLogin = () => {
        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: oauthClientID,
            redirect_uri: `${window.location.origin}/google-redirect`,
            scope: 'email profile',
            state: 'login',
            ux_mode: 'redirect'
        })
        client.requestCode()
    }

    return(
        <Box className={styles.modal} bgcolor='background.paper'>
            <IconButton size="large"
                sx={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    backgroundColor: 'divider',
                    '&:hover': {
                        backgroundColor: '#253548'
                    }
                }}
                onClick={handleModalClose}
            >
                <CloseIcon/>
            </IconButton>
            <Typography variant="h3" color="text.primary" gutterBottom sx={{ fontSize: { xs: '2.25rem', md: '3rem' }}}>
                Welcome to Fin<span style={{color: '#10B981'}}>Wise</span>
            </Typography>
            <Typography variant="subtitle1" color="text.subText" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1rem' }}}>
                Sign in to access your personalized AI financial advisor
            </Typography>
            <Button onClick={handleGoogleLogin} variant="contained"
                sx={{
                    backgroundColor: 'white',
                    color: 'black',
                    '&:hover': {
                        backgroundColor: '#e2e2e2',
                    },
                }}>
                <img className={styles.googleLogo} src={googleLogo} /> Continue with Google
            </Button>
        </Box>
    )
}
