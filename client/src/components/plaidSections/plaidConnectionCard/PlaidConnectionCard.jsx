import React from 'react';
import { Box, Typography, Button, Paper, Container, Tooltip } from '@mui/material';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import styles from './plaidConnectionCard.module.css';

export const PlaidConnectionCard = ({ onConnect }) => {
    return (
        <Box sx={{ px: { xs: 2, md: 4 }, pb: 8 }}>
            <Container maxWidth="sm">
                <Paper className={styles.paper} elevation={0} sx={{ p: 5, borderRadius: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                        <AccountBalanceRoundedIcon 
                            sx={{ 
                                fontSize: 64, 
                                mb: 3,
                                color: 'primary.main',
                                opacity: 0.8
                            }} 
                        />
                        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
                            Bank Account Connection
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                            Add your investment accounts to FinWise to automatically track your portfolio performance and get AI-powered insights.
                        </Typography>
                        
                        <Button 
                            variant="contained" 
                            size="large"
                            fullWidth
                            onClick={onConnect}
                            sx={{ 
                                py: 1.5, 
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #0EA5E9, #10B981)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #0890C0, #0D9565)',
                                },
                                borderRadius: 2,
                                transition: 'all 0.3s ease',
                            }}
                        >
                            Connect with Plaid
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};
