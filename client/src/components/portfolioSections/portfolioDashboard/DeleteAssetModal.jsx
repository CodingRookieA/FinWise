import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, Box, useTheme } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const DeleteAssetModal = ({ open, onClose, onConfirm }) => {

    const theme = useTheme();

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: { 
                    borderRadius: 3, 
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    minWidth: { xs: '90%', sm: 400 },
                    backgroundImage: 'none'
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 4, px: 3 }}>
                {/* Icon Circle */}
                <Box sx={{ 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    p: 2, 
                    borderRadius: '50%',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <WarningAmberIcon sx={{ fontSize: 40, color: '#ef4444' }} />
                </Box>

                <Typography variant="h5" fontWeight={700} gutterBottom align="center">
                    Delete Asset?
                </Typography>
                
                <DialogContent sx={{ p: 0, textAlign: 'center', mb: 3 }}>
                    <Typography variant="body1" color="text.secondary">
                        Are you sure you want to remove this position? This action cannot be undone.
                    </Typography>
                </DialogContent>
            </Box>

            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider', justifyContent: 'center', gap: 2 }}>
                <Button 
                    onClick={onClose} 
                    fullWidth
                    variant="outlined"
                    sx={{ 
                        color: 'text.secondary',
                        borderColor: 'divider',
                        '&:hover': { 
                            borderColor: 'text.secondary', 
                            bgcolor: 'rgba(255,255,255,0.05)' 
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={onConfirm} 
                    fullWidth
                    variant="contained" 
                    color="error"
                    sx={{ 
                        bgcolor: '#ef4444', 
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#dc2626' }
                    }}
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};