import { Box } from '@mui/material';
import { Navbar } from '../../components/navbar/Navbar';
import { PortfolioHero } from '../../components/portfolioSections/portfolioHero/PortfolioHero';
import { PortfolioDashboard } from '../../components/portfolioSections/portfolioDashboard/PortfolioDashboard';

export const PortfolioPage = () => {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <PortfolioHero />
            <PortfolioDashboard />
        </Box>
    );
};