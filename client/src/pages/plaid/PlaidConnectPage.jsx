// src/pages/plaid/PlaidConnectPage.jsx
import React from 'react';
import { Box } from '@mui/material';
import Sidebar from '../../components/sidebar/sidebar';
import { PlaidHero } from '../../components/plaidSections/plaidHero/PlaidHero';
import { PlaidConnectionCard } from '../../components/plaidSections/plaidConnectionCard/PlaidConnectionCard';

export const PlaidConnectPage = ({ user, logout }) => {
  const handleConnectPlaid = () => {
    // Placeholder for Plaid connection for now
    console.log('Plaid connect button clicked');
    alert('Plaid integration will be connected here');
  };

  return (
    <Box
        sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            px: { xs: 1, md: 4 },
            py: { xs: 2, md: 3 },
        }}
    >
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 3fr" },
                gap: 3,
                alignItems: "stretch",
                maxWidth: "none",
                mx: 0,
            }}
        >
            <Sidebar user={user} logout={logout} />
            
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <PlaidHero />
                <PlaidConnectionCard onConnect={handleConnectPlaid} />
            </Box>
        </Box>
    </Box>
  );
};