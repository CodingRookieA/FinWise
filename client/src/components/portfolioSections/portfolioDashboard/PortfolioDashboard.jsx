import React, { useState } from 'react';
import { Container, Box, CircularProgress, Alert } from '@mui/material';

// Imports
import { usePortfolio } from '../../../hooks/usePortfolio';
import { AddAssetModal } from './AddAssetModal';
import { PortfolioOverview } from './PortfolioOverview';
import { PortfolioTable } from './PortfolioTable';
import styles from './portfolioDashboard.module.css';
import { DeleteAssetModal } from './DeleteAssetModal';

export const PortfolioDashboard = () => {
    // 1. Hooks
    const { assets, loading, error, addAsset, updateAsset, deleteAsset, uploadCSV } = usePortfolio();

    // 2. UI State
    const [isModalOpen, setModalOpen] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false); 
    const [assetToDelete, setAssetToDelete] = useState(null);

    // 3. Handlers
    const handleOpenAdd = () => {
        setCurrentAsset(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (asset) => {
        setCurrentAsset(asset);
        setModalOpen(true);
    };

    // User clicks trash icon -> Open Modal
    const handleDeleteClick = (id) => {
        setAssetToDelete(id);
        setDeleteModalOpen(true);
    };

    // User clicks "Delete" in Modal -> Call API
    const handleConfirmDelete = async () => {
        if (assetToDelete) {
            await deleteAsset(assetToDelete);
            setDeleteModalOpen(false);
            setAssetToDelete(null);
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

    // Handlers
    const handleFileUpload = async (file) => {
        await uploadCSV(file);
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
                    onUploadCSV={handleFileUpload}
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

            {/* Modal 2: Delete Confirmation */}
            <DeleteAssetModal 
                open={isDeleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
            />
        </section>
    );
};