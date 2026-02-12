import { Box } from '@mui/material';
import { Navbar } from '../../components/navbar/Navbar';
import { HeroSection } from '../../components/homepageSections/heroSection/HeroSection';
import { ProductSection } from '../../components/homepageSections/productSection/ProductSection';
import { GoalSection } from '../../components/homepageSections/goalSection/GoalSection';
import { AboutSection } from '../../components/homepageSections/aboutSection/AboutSection';

import { BottomSection } from '../../components/homepageSections/BottomSection';

export const HomePage = () => {
  return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar/>
            <HeroSection/>
            <ProductSection/>
            <GoalSection/>
            <AboutSection/>
            <BottomSection/>
        </Box>
    );
};
