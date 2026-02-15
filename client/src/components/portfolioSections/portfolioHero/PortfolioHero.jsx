import { Container, Typography, Box } from '@mui/material';
import styles from './portfolioHero.module.css';

export const PortfolioHero = () => {
    return (
        <section className={styles.heroSmall}>
            <div className={styles.heroGlow} />
            <Container sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                    Your <span className={styles.gradientText}>Portfolio</span>
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, mx: 'auto' }}>
                    Track your performance, analyze your allocation, and let AI optimize your wealth.
                </Typography>
            </Container>
        </section>
    );
};