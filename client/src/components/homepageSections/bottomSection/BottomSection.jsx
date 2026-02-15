import { Button, Container, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import styles from './bottomSection.module.css'

export const BottomSection = ({ handleModalOpen }) => {
    return(
        <section className={styles.sectionAlt}>
            <Container sx={{ textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                    Ready to Invest <span className={styles.gradientText}>Smarter?</span>
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, mx: 'auto', mb: 5 }}>
                    Join our Canadian investor community and use AI to optimize your mutual fund and ETF portfolios.
                </Typography>
                <Button variant="contained" size="large" className={styles.heroBtn} endIcon={<ArrowForwardIcon />} onClick={handleModalOpen}>
                    Try FinWise Now
                </Button>
            </Container>
        </section>
    )
}
