import React, { useState } from 'react';
import { Container, Box, CircularProgress, Alert } from '@mui/material';

// Imports
import { usePortfolio } from '../../../hooks/usePortfolio';
import { AddAssetModal } from './AddAssetModal';
import { PortfolioOverview } from './PortfolioOverview';
import { PortfolioTable } from './PortfolioTable';
import styles from './portfolioDashboard.module.css';

export const PortfolioDashboard = () => {
    // 1. Hooks
    const { assets, loading, error, addAsset, updateAsset, deleteAsset } = usePortfolio();

    // 2. UI State
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);

    // 3. Handlers
    const handleOpenAdd = () => {
        setCurrentAsset(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (asset) => {
        setCurrentAsset(asset);
        setModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm('Delete this asset?')) {
            await deleteAsset(id);
        }
    };

    const handleSave = async (formData) => {
        let success = false;
        if (currentAsset) {
            success = await updateAsset(currentAsset._id, formData);
        } else {
            success = await addAsset(formData);
        }
        if (success) setModalOpen(false);
    };

    // Calculations for total assets and shares
    const totalAssets = assets.length;
    const totalShares = assets.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;

    return (
        <section className={styles.section}>
            <Container>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {/* the Overview section */}
                <PortfolioOverview 
                    totalAssets={totalAssets} 
                    totalShares={totalShares} 
                    onAdd={handleOpenAdd} 
                />

                {/* the Table section */}
                <PortfolioTable 
                    assets={assets} 
                    onEdit={handleOpenEdit} 
                    onDelete={handleDeleteClick} 
                />
            </Container>

            <AddAssetModal 
                open={isModalOpen} 
                onClose={() => setModalOpen(false)} 
                onSave={handleSave} 
                initialData={currentAsset}
            />
        </section>
    );
};