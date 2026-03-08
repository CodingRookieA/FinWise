import { Container, Typography } from '@mui/material';
import styles from './plaidHero.module.css';

export const PlaidHero = () => {
    return (
        <section className={styles.section}>
            <div className={styles.glowEffect} />
            <Container sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                    Connect Your <span className={styles.gradientText}>Bank</span>
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, mx: 'auto', mb: 6 }}>
                    Securely link your investment accounts to sync your mutual funds and ETFs with FinWise.
                </Typography>
            </Container>
        </section>
    );
};
