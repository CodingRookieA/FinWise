import { Box, Modal, Alert } from '@mui/material';
import { Navbar } from '../../components/navbar/Navbar';
import { HeroSection } from '../../components/homepageSections/heroSection/HeroSection';
import { ProductSection } from '../../components/homepageSections/productSection/ProductSection';
import { GoalSection } from '../../components/homepageSections/goalSection/GoalSection';
import { AboutSection } from '../../components/homepageSections/aboutSection/AboutSection';
import { BottomSection } from '../../components/homepageSections/bottomSection/BottomSection';
import { LoginModal } from '../../components/loginModal/loginModal';
import { useState } from 'react';
import { InfoAlert } from '../../components/alerts/InfoAlert';

export const HomePage = ({ user, logout }) => {
    const [loginModalOpen, setLoginModalOpen] = useState(false)

    const handleGoToChat = () => {
        window.location.href = '/chat'
    }

    const handleModalOpen = () => {
        setLoginModalOpen(true)
    }

    const handleModalClose = () => setLoginModalOpen(false)

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            {
                user.userId && !user.isVerified &&
                <InfoAlert topOffset='5rem'>
                    <a style={{ textDecoration: 'none', color: '#0EA5E9' }} href='/email-verification'>Verify your email</a> to unlock full features
                </InfoAlert>
            }
            <Navbar handleModalOpen={handleModalOpen} user={user} handleGoToChat={handleGoToChat} logout={logout} />
            <HeroSection handleModalOpen={handleModalOpen} />
            <ProductSection />
            <GoalSection />
            <AboutSection />
            <BottomSection handleModalOpen={handleModalOpen} />
            <Modal
                open={loginModalOpen}
                onClose={handleModalClose}
                sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                <LoginModal handleModalClose={handleModalClose} />
            </Modal>
        </Box>
    );
};
