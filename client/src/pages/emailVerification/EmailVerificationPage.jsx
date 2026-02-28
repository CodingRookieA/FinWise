import { useState, useEffect, useCallback } from 'react';
import { Typography, Button } from '@mui/material';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import styles from './emailVerificationPage.module.css';

const COOLDOWN_SECONDS = 15;
const mode = import.meta.env.MODE
const serverURL = mode === 'production' 
    ? import.meta.env.VITE_SERVER_URL 
    : import.meta.env.VITE_SERVER_URL_DEVELOPMENT

export const EmailVerificationPage = () => {
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleResend = useCallback(() => {
        if (cooldown > 0) return;
        
        const sendVerificationEmail = async () => {
            try {
                await fetch(
                    `${serverURL}/api/email/sendVerificationEmail`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include'
                    }
                )
            } catch (error) {
                console.log(error)
            }
        }

        sendVerificationEmail()
        setCooldown(COOLDOWN_SECONDS);
    }, [cooldown]);

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.content}>
                    <div className={styles.logoRow}>
                        <Typography variant="h4" fontWeight={700} color="text.primary">
                            Fin<span style={{color: '#10B981'}}>Wise</span>
                        </Typography>
                    </div>

                    <div className={styles.iconWrap}>
                        <div className={styles.iconCircle}>
                            <MarkEmailReadIcon sx={{ fontSize: 36 }} />
                        </div>
                    </div>

                    <Typography variant="h5" color="text.primary" gutterBottom fontWeight={600}>
                        Check your email
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        We've sent a verification link to your email address. Please click the link to verify your account.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        Didn't receive the email? Check your spam folder or request a new one.
                    </Typography>

                    <Button
                        variant="contained"
                        onClick={handleResend}
                        disabled={cooldown > 0}
                        className={styles.resendButton}
                    >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
                    </Button>

                    <a href="/" className={styles.link}>
                        Return to Home
                    </a>
                </div>
            </div>
        </div>
    );
};