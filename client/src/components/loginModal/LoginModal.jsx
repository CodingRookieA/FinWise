import { useState } from 'react'
import {
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  IconButton,
  Box,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close';
import googleLogo from '../../assets/google_logo.png'
import toast from 'react-hot-toast';
import { ENVIRONMENT, SERVERURL } from '../../utils/constants';

import styles from './loginModal.module.css'

export const LoginModal = ({ handleModalClose }) => {
    const [tab, setTab] = useState(0);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const clearFields = () => {
        setName('')
        setEmail('')
        setPassword('')
    }

    const handleAuth = (e) => {
        const login = async () => {
            try {
                const res = await fetch(
                    `${SERVERURL}/api/users/localLogin`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ email, password })
                    }
                )

                const result = await res.json()
                if(result.error) {
                    toast.dismiss();
                    toast.error(result.error)
                } else {
                    window.location.href = '/questionnaire'
                }
            } catch (error) {
                console.log(error)
            }
        }

        const signup = async () => {
            try {
                const res = await fetch(
                    `${SERVERURL}/api/users/localSignup`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ name, email, password })
                    }
                )

                const result = await res.json()
                if(result.error) {
                    toast.dismiss();
                    toast.error(result.error)
                } else {
                    window.location.href = '/email-verification'
                }
            } catch (error) {
                console.log(error)
            }
        }

        e.preventDefault();
        if(tab === 0){
            login()
        } else {
            signup()
        }
    };

    const handleGoogleLogin = () => {
        const client = window.google.accounts.oauth2.initCodeClient({
            client_id: ENVIRONMENT.oauthClientId,
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

            <div className={styles.header}>
                <Typography variant="h3" color="text.primary" sx={{ fontSize: { xs: '2.25rem', md: '3rem' }}}>
                    Welcome to Fin<span style={{color: '#10B981'}}>Wise</span>
                </Typography>
                <Typography variant="subtitle1" color="text.subText" gutterBottom sx={{ fontSize: { xs: '0.9rem', md: '1rem' }}}>
                    Sign in to access your personalized AI financial advisor
                </Typography>

                <Tabs
                    value={tab}
                    onChange={(_, v) => {
                        clearFields()
                        setTab(v)
                    }}
                    className={styles.tabs}
                    slotProps={{ indicator: { style: { background: '#0EA5E9' } }}}
                    centered
                >
                    <Tab label="Log In" className={`${styles.tab} ${tab === 0 ? styles.tabSelected : ''}`} />
                    <Tab label="Sign Up" className={`${styles.tab} ${tab === 1 ? styles.tabSelected : ''}`} />
                </Tabs>
            </div>

            <Box className={styles.body}>
                <form className={styles.form} onSubmit={handleAuth}>
                    {tab === 1 &&
                        <TextField
                            label="Name"
                            fullWidth
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={styles.textField}
                            variant="outlined"
                            size="small"
                        />
                    }
                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.textField}
                        variant="outlined"
                        size="small"
                    />
                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={styles.textField}
                        variant="outlined"
                        size="small"
                        slotProps={{
                            htmlInput: {
                                // minLength: 8
                            }
                        }}
                    />
                    <Button type="submit" fullWidth className={styles.submitBtn}>
                        {tab === 0 ? 'Log in' : 'Create Account'}
                    </Button>
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
                    <Typography variant="body2" className={styles.switchText} color="text.secondary">
                        {tab === 0 ? "Don't have an account? " : 'Already have an account? '}
                        <Box component="span" className={styles.switchLink}
                            onClick={() => {
                                clearFields()
                                setTab(tab === 0 ? 1 : 0)
                            }}
                        >
                            {tab === 0 ? 'Sign up' : 'Log in'}
                        </Box>
                    </Typography>
                </form>
            </Box>
        </Box>
    )
}
