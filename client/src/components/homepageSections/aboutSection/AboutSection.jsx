import { Container, Typography } from '@mui/material'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import styles from './aboutSection.module.css'

export const AboutSection = () => {
    return(
        <section id="about-us" className={styles.section}>
            <Container>
                <div className={styles.aboutCard}>
                    <div className={styles.aboutGlow1} />
                    <div className={styles.aboutGlow2} />
                    <div className={styles.aboutContent}>
                    <AutoAwesomeIcon sx={{ fontSize: 48, color: '#0EA5E9', mb: 3 }} />
                    <Typography variant="h3" color="text.primary" sx={{ mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                        About Us
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 640, mx: 'auto' }}>
                        We're a Canadian fintech team passionate about making smart investing
                        accessible to everyone. Built with Canadian regulations in mind, our AI
                        understands the nuances of TFSA and other registered accounts.
                    </Typography>

                    <div className={styles.statsGrid}>
                        <div>
                        <div className={styles.statValue}>4K+</div>
                        <Typography variant="caption" color="text.secondary">Funds Analyzed</Typography>
                        </div>
                        <div>
                        <div className={styles.statValue}>24HR</div>
                        <Typography variant="caption" color="text.secondary">Data cycle refresh</Typography>
                        </div>
                        <div>
                        <div className={styles.statValue}>100%</div>
                        <Typography variant="caption" color="text.secondary">Canadian funds</Typography>
                        </div>
                    </div>
                    </div>
                </div>
            </Container>
        </section>
    )
}