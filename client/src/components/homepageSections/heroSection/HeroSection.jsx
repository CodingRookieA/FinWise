import { Box, Button, Container, Typography } from "@mui/material"
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PlaceIcon from '@mui/icons-material/Place';

import styles from './heroSection.module.css'
import heroBg from '../../../assets/hero-bg.jpg';

export const HeroSection = () => {
    return(
        <section className={styles.hero}>
            <div className={styles.heroBg} style={{ backgroundImage: `url(${heroBg})` }} />
            <div className={styles.heroOverlay} />

            <Container className={styles.heroContent}>
                <div className={styles.badge}>
                    <PlaceIcon sx={{ fontSize: 16, color: '#0EA5E9' }} />
                    <Typography variant="body2" color="text.secondary">
                        Proudly serving Canadian investors
                    </Typography>
                </div>

                <Typography variant="h1" className={styles.heroTitle} sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, mb: 3 }}>
                    Your AI-Powered
                    <Box component="span" display="block" className={styles.gradientText}>
                        Financial Advisor
                    </Box>
                </Typography>

                <Typography variant="h5" color="text.secondary" className={styles.heroSubtitle} sx={{ maxWidth: 640, mx: 'auto', fontWeight: 400, fontSize: { xs: '1.1rem', md: '1.4rem' } }}>
                    Smart insights for Mutual Funds & ETFs. Make data-driven investment decisions with AI that understands the Canadian market.
                </Typography>

                <div className={styles.heroButtons}>
                    <Button variant="contained" size="large" className={styles.heroBtn} endIcon={<ArrowForwardIcon />}>
                        Try FinWise
                    </Button>
                </div>
            </Container>

            <div className={styles.heroFade} />
        </section>
    )
}