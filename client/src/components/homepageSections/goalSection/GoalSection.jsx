import { Container, Typography } from '@mui/material';

import styles from './goalSection.module.css'

const goals = [
  { step: '01', title: 'Democratize Investing', description: 'Make professional-grade financial analysis accessible to every Canadian investor.' },
  { step: '02', title: 'Simplify Complexity', description: 'Transform overwhelming market data into clear, actionable insights you can trust.' },
  { step: '03', title: 'Build Financial Futures', description: 'Help Canadians achieve their long-term wealth goals with confidence and clarity.' },
];

export const GoalSection = () => {
    return(
        <section id="our-goal" className={styles.sectionAlt}>
            <Container>
                <div className={styles.sectionHeader}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                    Our <span className={styles.gradientText}>Goal</span>
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, mx: 'auto' }}>
                    Empowering Canadians to build wealth through intelligent, accessible investing.
                </Typography>
                </div>

                <div className={styles.goalGrid}>
                {goals.map((item, i) => (
                    <div key={i} className={styles.goalItem}>
                    <div className={styles.goalNumber}>{item.step}</div>
                    <Typography variant="h6" color="text.primary" gutterBottom>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                    {i < 2 && <div className={styles.goalConnector} />}
                    </div>
                ))}
                </div>
            </Container>
        </section>
    )
}