import React from 'react';
import { Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import styles from './portfolioDashboard.module.css';

export const PortfolioOverview = ({ totalAssets, totalShares, onAdd, onUploadCSV }) => {
    return (
        <div className={styles.dashboardCard}>
            <div className={styles.cardGlow1} />
            <div className={styles.cardGlow2} />
            
            <div className={styles.cardContent}>
                <div className={styles.headerRow}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <div className={styles.iconBox}>
                            <AutoAwesomeIcon sx={{ color: '#0EA5E9' }} />
                        </div>
                        <Typography variant="h4" color="text.primary" fontWeight={700}>
                            Overview
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<UploadFileIcon />}
                            className={styles.actionBtn}
                        >
                            Upload CSV
                            <input 
                                type="file" 
                                hidden 
                                accept=".csv" 
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        onUploadCSV(e.target.files[0]);
                                    }
                                    e.target.value = null; // reset so same file can be uploaded again
                                }} 
                            />
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            className={styles.actionBtn}
                            onClick={onAdd}
                        >
                            Add Asset
                        </Button>
                    </Box>
                </div>

                <div className={styles.statsGrid}>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{totalAssets}</div>
                        <Typography variant="caption" color="text.secondary">Positions</Typography>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>{totalShares}</div>
                        <Typography variant="caption" color="text.secondary">Total Shares</Typography>
                    </div>
                </div>
            </div>
        </div>
    );
};