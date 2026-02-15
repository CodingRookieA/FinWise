import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';

export const AddAssetModal = ({ open, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({ symbol: '', quantity: '' });

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

    // Custom styles to match the dark theme inputs
    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            color: '#F1F5F9',
            backgroundColor: '#0B1120',
            '& fieldset': { borderColor: '#2A3A4E' },
            '&:hover fieldset': { borderColor: '#0EA5E9' },
            '&.Mui-focused fieldset': { borderColor: '#0EA5E9' },
        },
        '& .MuiInputLabel-root': { color: '#8B9DC3' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#0EA5E9' },
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            PaperProps={{
                sx: { 
                    borderRadius: 3, 
                    bgcolor: '#1A2332', 
                    border: '1px solid #2A3A4E', 
                    color: '#F1F5F9',
                    minWidth: { xs: '90%', sm: 400 }
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: '1px solid #2A3A4E' }}>
                {initialData ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField 
                        label="Stock Symbol (e.g. VFV)" 
                        name="symbol" 
                        value={formData.symbol} 
                        onChange={handleChange} 
                        sx={inputStyle} 
                        fullWidth 
                    />
                    <TextField 
                        label="Quantity" 
                        name="quantity" 
                        type="number" 
                        value={formData.quantity} 
                        onChange={handleChange} 
                        sx={inputStyle} 
                        fullWidth 
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, borderTop: '1px solid #2A3A4E' }}>
                <Button onClick={onClose} sx={{ color: '#8B9DC3' }}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained" 
                    sx={{ background: 'linear-gradient(135deg, #0EA5E9, #10B981)', color: '#0B1120', fontWeight: 'bold' }}
                >
                    Save Asset
                </Button>
            </DialogActions>
        </Dialog>
    );
};