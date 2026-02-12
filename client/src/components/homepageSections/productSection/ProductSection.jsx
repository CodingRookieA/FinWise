import { Container, Typography } from '@mui/material';
import PsychologyIcon from '@mui/icons-material/Psychology';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShieldIcon from '@mui/icons-material/Shield';
import BarChartIcon from '@mui/icons-material/BarChart';

import styles from './productSection.module.css'

const features = [
    {
        icon: <PsychologyIcon sx={{ color: '#0EA5E9' }} />,
        title: 'AI Analysis',
        description: 'Advanced machine learning algorithms analyze thousands of Canadian funds in real-time.',
    },
    {
        icon: <TrendingUpIcon sx={{ color: '#0EA5E9' }} />,
        title: 'Smart Recommendations',
        description: 'Personalized fund suggestions based on your risk tolerance and investment goals. All based on timely infomation',
    },
    {
        icon: <ShieldIcon sx={{ color: '#0EA5E9' }} />,
        title: 'Risk Assessment',
        description: 'Comprehensive risk profiling and portfolio stress testing for peace of mind.',
    },
    {
        icon: <BarChartIcon sx={{ color: '#0EA5E9' }} />,
        title: 'Performance Tracking',
        description: 'Real-time portfolio monitoring with detailed analytics and insights.',
    },
];

export const ProductSection = () => {
    return(
        <section id="product" className={styles.section}>
            <Container>
                <div className={styles.sectionHeader}>
                    <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' }, mb: 2 }}>
                        Our <span className={styles.gradientText}>Product</span>
                    </Typography>
                    <Typography variant="h6" color="text.secondary" fontWeight={400} sx={{ maxWidth: 640, mx: 'auto' }}>
                        Harness the power of AI to navigate Canada's mutual fund and ETF landscape with confidence.
                    </Typography>
                </div>

                <div className={styles.productGrid}>
                    {features.map((feature, i) => (
                    <div key={i} className={styles.productCard}>
                        <div className={styles.productIconWrap}>{feature.icon}</div>
                        <Typography variant="h6" color="text.primary" gutterBottom>{feature.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
                    </div>
                    ))}
                </div>
            </Container>
        </section>
    )
}