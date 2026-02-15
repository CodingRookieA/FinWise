import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import styles from './portfolioDashboard.module.css';

export const PortfolioTable = ({ assets, onEdit, onDelete }) => {
    return (
        <TableContainer component={Paper} className={styles.tableContainer}>
            <Table>
                <TableHead className={styles.tableHead}>
                    <TableRow>
                        <TableCell className={styles.tableHeadCell}>Symbol</TableCell>
                        <TableCell className={styles.tableHeadCell} align="right">Quantity</TableCell>
                        <TableCell className={styles.tableHeadCell} align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {assets.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                No assets found. Add one to get started.
                            </TableCell>
                        </TableRow>
                    ) : (
                        assets.map((asset) => (
                            <TableRow key={asset._id} className={styles.tableRow}>
                                <TableCell className={styles.tableCell} sx={{ fontWeight: 700, color: '#0EA5E9 !important' }}>
                                    {asset.symbol}
                                </TableCell>
                                <TableCell align="right" className={styles.tableCell}>
                                    {asset.quantity}
                                </TableCell>
                                <TableCell align="right" className={styles.tableCell}>
                                    <IconButton size="small" sx={{ color: '#94a3b8' }} onClick={() => onEdit(asset)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }} onClick={() => onDelete(asset._id)}>
                                        <DeleteOutlineIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};