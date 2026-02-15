import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, useTheme } from '@mui/material';

export const AddAssetModal = ({ open, onClose, onSave, initialData }) => {
    // 1. Logic: Form State
    const [formData, setFormData] = useState({ symbol: '', quantity: '' });
    const theme = useTheme(); // Access the theme variables programmatically

    useEffect(() => {
        if (initialData) {
            setFormData({ symbol: initialData.symbol, quantity: initialData.quantity });
        } else {
            setFormData({ symbol: '', quantity: '' });
        }
    }, [initialData, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        if (formData.symbol && formData.quantity) {
            onSave(formData);
        }
    };

    // 2. Styles: Organized using Theme Variables
    // Instead of hardcoded colors, we map directly to your Theme.js definitions
    const inputSx = {
        '& .MuiOutlinedInput-root': {
            color: 'text.primary',              // Matches theme.text.primary
            backgroundColor: 'background.default', // Matches theme.background.default (#0B1120)
            '& fieldset': { 
                borderColor: 'divider'          // Matches theme.divider (#2A3A4E)
            },
            '&:hover fieldset': { 
                borderColor: 'primary.main'     // Matches theme.primary.main
            },
            '&.Mui-focused fieldset': { 
                borderColor: 'primary.main' 
            },
        },
        '& .MuiInputLabel-root': { 
            color: 'text.secondary'             // Matches theme.text.secondary
        },
        '& .MuiInputLabel-root.Mui-focused': { 
            color: 'primary.main' 
        },
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: { 
                    borderRadius: 3, 
                    bgcolor: 'background.paper', // <--- Uses your specific Paper color (#1A2332)
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    minWidth: { xs: '90%', sm: 400 },
                    backgroundImage: 'none'      // Disables default MUI lightness overlay
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                {initialData ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
            
            <DialogContent sx={{ mt: 2 }}>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField 
                        label="Stock Symbol (e.g. VFV)" 
                        name="symbol" 
                        value={formData.symbol} 
                        onChange={handleChange} 
                        sx={inputSx} 
                        fullWidth 
                    />
                    <TextField 
                        label="Quantity" 
                        name="quantity" 
                        type="number" 
                        value={formData.quantity} 
                        onChange={handleChange} 
                        sx={inputSx} 
                        fullWidth 
                    />
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
                <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    sx={{ 
                        // We use the theme variables to build the gradient dynamically
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        color: 'primary.contrastText',
                        fontWeight: 'bold' 
                    }}
                >
                    Save Asset
                </Button>
            </DialogActions>
        </Dialog>
    );
};