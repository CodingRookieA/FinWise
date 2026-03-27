import { useMemo, useState } from 'react'
import { Box, Button, IconButton, Paper, Tooltip, Typography, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import { DataGrid } from '@mui/x-data-grid'

function normalizeNumber(value) {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

function formatPercent(value) {
    const n = normalizeNumber(value)
    return n == null ? 'N/A' : `${n}%`
}

function formatMer(assetType, mer) {
    if (assetType === 'etf' && (mer == null || mer === 'null')) {
        return 'Verify on provider site'
    }
    const n = normalizeNumber(mer)
    return n == null ? 'N/A' : `${n}%`
}

function normalizeSelectionModel(model, rows = []) {
    if (Array.isArray(model)) {
        return model
    }

    if (model && typeof model === 'object' && model.ids instanceof Set) {
        const ids = Array.from(model.ids)

        // MUI may emit exclude-mode selection for "select all".
        // In that case, selected rows are all rows except excluded ids.
        if (model.type === 'exclude') {
            const excluded = new Set(ids)
            return (Array.isArray(rows) ? rows : [])
                .map((row) => row.id)
                .filter((id) => !excluded.has(id))
        }

        return ids
    }

    return []
}

export const RecommendationPanel = ({ funds, onAddSelected, onDismiss, adding = false }) => {
    const theme = useTheme()
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
    const [selectionIds, setSelectionIds] = useState([])

    const rows = useMemo(() => {
        return (Array.isArray(funds) ? funds : []).map((fund, index) => {
            const symbol = fund?.asset_type === 'mutual_fund'
                ? (fund?.fund_code || fund?.symbol || `FUND-${index + 1}`)
                : (fund?.symbol || `ETF-${index + 1}`)

            return {
                id: `${symbol}-${index}`,
                symbol,
                name: fund?.name || 'N/A',
                assetType: fund?.asset_type || 'unknown',
                merDisplay: formatMer(fund?.asset_type, fund?.mer),
                merNumber: normalizeNumber(fund?.mer),
                risk: fund?.risk || 'N/A',
                ytd: fund?.ytd_return,
                oneYear: fund?.asset_type === 'mutual_fund' ? fund?.['1yr'] : fund?.fifty_two_week_return,
                threeYear: fund?.asset_type === 'mutual_fund' ? fund?.['3yr'] : null,
                minInvestment: fund?.asset_type === 'mutual_fund' ? fund?.minimum_investment : null,
                dividendYield: fund?.dividend_yield,
                aiReason: fund?.ai_reason || 'N/A',
            }
        })
    }, [funds])

    const allColumns = useMemo(() => ([
        { field: 'symbol', headerName: 'Symbol', minWidth: 110, flex: 0.7, align: 'left', headerAlign: 'left' },
        {
            field: 'aiReason',
            headerName: 'Reason',
            minWidth: 280,
            flex: 1.5,
            sortable: false,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => (
                <Tooltip title={params.value || 'N/A'}>
                    <Typography
                        variant='body2'
                        sx={{
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            overflowWrap: 'anywhere',
                            lineHeight: 1.4,
                            py: 0.5,
                        }}
                    >
                        {params.value || 'N/A'}
                    </Typography>
                </Tooltip>
            )
        },
        { field: 'name', headerName: 'Name', minWidth: 180, flex: 1.1, align: 'left', headerAlign: 'left' },
        {
            field: 'assetType',
            headerName: 'Type',
            minWidth: 110,
            flex: 0.7,
            align: 'left',
            headerAlign: 'left',
            valueFormatter: (value) => value === 'etf' ? 'ETF' : 'Mutual Fund',
        },
        {
            field: 'merDisplay',
            headerName: 'MER',
            minWidth: 150,
            flex: 0.9,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                const isHighMer = params.row.merNumber != null && params.row.merNumber > 2
                return (
                    <Typography
                        variant='body2'
                        sx={{
                            color: isHighMer ? '#fbbf24' : 'inherit',
                            fontWeight: isHighMer ? 700 : 400,
                        }}
                    >
                        {params.value}
                    </Typography>
                )
            }
        },
        { field: 'risk', headerName: 'Risk', minWidth: 100, flex: 0.7, align: 'left', headerAlign: 'left' },
        { field: 'ytd', headerName: 'YTD', minWidth: 100, flex: 0.7, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatPercent(value) },
        { field: 'oneYear', headerName: '1yr', minWidth: 100, flex: 0.7, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatPercent(value) },
        { field: 'threeYear', headerName: '3yr', minWidth: 100, flex: 0.7, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatPercent(value) },
        { field: 'dividendYield', headerName: 'Yield', minWidth: 110, flex: 0.8, align: 'right', headerAlign: 'right', valueFormatter: (value) => formatPercent(value) },
        {
            field: 'minInvestment',
            headerName: 'Min Investment',
            minWidth: 130,
            flex: 0.9,
            align: 'right',
            headerAlign: 'right',
            valueFormatter: (value) => value == null ? 'N/A' : `$${value}`,
        },
    ]), [])

    const columns = useMemo(() => {
        if (!isSmallScreen) return allColumns
        const mobileFields = new Set(['symbol', 'aiReason', 'oneYear', 'ytd'])
        return allColumns.filter((col) => mobileFields.has(col.field))
    }, [allColumns, isSmallScreen])

    const selectedRows = rows.filter((row) => selectionIds.includes(row.id))

    if (!rows.length) return null

    return (
        <Paper
            sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                bgcolor: '#182333',
                maxWidth: 820,
                mx: 'auto',
                width: '100%'
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>
                    Recommended Funds
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                        size='small'
                        variant='contained'
                        disabled={adding || selectedRows.length === 0}
                        onClick={() => onAddSelected?.(selectedRows)}
                    >
                        {adding ? 'Adding...' : `Add Selected (${selectedRows.length})`}
                    </Button>
                    <Tooltip title='Dismiss recommendations'>
                        <IconButton size='small' onClick={() => onDismiss?.()}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box sx={{ width: '100%', height: { xs: 300, md: 360 } }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    density='compact'
                    getRowHeight={() => 'auto'}
                    getEstimatedRowHeight={() => 72}
                    checkboxSelection
                    disableRowSelectionOnClick
                    onRowSelectionModelChange={(newModel) => setSelectionIds(normalizeSelectionModel(newModel, rows))}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                pageSize: isSmallScreen ? 4 : 5,
                                page: 0,
                            },
                        },
                    }}
                    pageSizeOptions={isSmallScreen ? [4, 8] : [5, 10]}
                    sx={{
                        border: 0,
                        '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: 'rgba(255,255,255,0.04)'
                        },
                        '& .MuiDataGrid-columnHeaderCheckbox': {
                            position: 'sticky',
                            left: 0,
                            zIndex: 3,
                            backgroundColor: '#182333'
                        },
                        '& .MuiDataGrid-cellCheckbox': {
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            backgroundColor: '#182333'
                        },
                        '& .MuiDataGrid-cell': {
                            alignItems: 'flex-start',
                            py: 0.75,
                        }
                    }}
                />
            </Box>
        </Paper>
    )
}
