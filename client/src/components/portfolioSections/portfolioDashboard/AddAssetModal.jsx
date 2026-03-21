import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, useTheme, MenuItem } from '@mui/material';

export const AddAssetModal = ({ open, onClose, onSave, initialData }) => {
    // 1. Logic: Form State
    const [formData, setFormData] = useState({ symbol: '', quantity: '', type: 'ETF' });
    const theme = useTheme();

    useEffect(() => {
        if (initialData) {
            setFormData({ symbol: initialData.symbol, quantity: initialData.quantity, type: initialData.type || 'ETF' });
        } else {
            setFormData({ symbol: '', quantity: '', type: 'ETF' });
        }
    }, [initialData, open]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        if (formData.symbol && formData.quantity && formData.type) {
            onSave(formData);
        }
    };

    const inputSx = {
        '& .MuiOutlinedInput-root': {
            color: 'text.primary',
            backgroundColor: 'background.default',
            '& fieldset': {
                borderColor: 'divider'
            },
            '&:hover fieldset': {
                borderColor: 'primary.main'
            },
            '&.Mui-focused fieldset': {
                borderColor: 'primary.main'
            },
        },
        '& .MuiInputLabel-root': {
            color: 'text.secondary'
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
                    bgcolor: 'background.paper',
                    border: 1,
                    borderColor: 'divider',
                    color: 'text.primary',
                    minWidth: { xs: '90%', sm: 400 },
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
                {initialData ? 'Edit Asset' : 'Add New Asset'}
            </DialogTitle>

            <DialogContent sx={{ mt: 2 }}>
                <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                    <TextField
                        select
                        label="Asset Type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        sx={inputSx}
                        fullWidth
                    >
                        <MenuItem value="ETF">ETF</MenuItem>
                        <MenuItem value="Mutual Fund">Mutual Fund</MenuItem>
                    </TextField>
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
