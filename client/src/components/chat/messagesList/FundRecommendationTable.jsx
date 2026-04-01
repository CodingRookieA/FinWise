import { useMemo } from 'react'
import { Box, Button, Chip, Typography } from '@mui/material'
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

export const FundRecommendationTable = ({
    funds,
    onAddToPortfolio,
    addedRecommendationKeys = {},
    messageKey,
}) => {
    const rows = useMemo(() => {
        return (Array.isArray(funds) ? funds : []).map((fund, index) => {
            const symbol = fund?.asset_type === 'mutual_fund'
                ? (fund?.fund_code || fund?.symbol || `FUND-${index + 1}`)
                : (fund?.symbol || `ETF-${index + 1}`)

            const merNumber = normalizeNumber(fund?.mer)

            return {
                id: `${messageKey}-${symbol}-${index}`,
                symbol,
                name: fund?.name || 'N/A',
                assetType: fund?.asset_type || 'unknown',
                merDisplay: formatMer(fund?.asset_type, fund?.mer),
                merNumber,
                risk: fund?.risk || 'N/A',
                ytd: fund?.ytd_return,
                oneYear: fund?.asset_type === 'mutual_fund' ? fund?.['1yr'] : fund?.fifty_two_week_return,
                threeYear: fund?.asset_type === 'mutual_fund' ? fund?.['3yr'] : null,
                minInvestment: fund?.asset_type === 'mutual_fund' ? fund?.minimum_investment : null,
                dividendYield: fund?.dividend_yield,
                aiReason: fund?.ai_reason || 'N/A',
            }
        })
    }, [funds, messageKey])

    const columns = useMemo(() => ([
        { field: 'symbol', headerName: 'Symbol', minWidth: 110, flex: 0.8 },
        { field: 'name', headerName: 'Name', minWidth: 220, flex: 1.4 },
        {
            field: 'assetType',
            headerName: 'Type',
            minWidth: 110,
            flex: 0.7,
            renderCell: (params) => (
                <Chip
                    size='small'
                    label={params.value === 'etf' ? 'ETF' : 'Mutual Fund'}
                    sx={{ fontSize: 11 }}
                />
            )
        },
        {
            field: 'merDisplay',
            headerName: 'MER',
            minWidth: 170,
            flex: 1,
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
        {
            field: 'risk',
            headerName: 'Risk',
            minWidth: 100,
            flex: 0.6,
        },
        {
            field: 'ytd',
            headerName: 'YTD',
            minWidth: 100,
            flex: 0.6,
            valueFormatter: (value) => formatPercent(value),
        },
        {
            field: 'oneYear',
            headerName: '1yr',
            minWidth: 100,
            flex: 0.6,
            valueFormatter: (value) => formatPercent(value),
        },
        {
            field: 'threeYear',
            headerName: '3yr',
            minWidth: 100,
            flex: 0.6,
            valueFormatter: (value) => formatPercent(value),
        },
        {
            field: 'dividendYield',
            headerName: 'Dividend Yield',
            minWidth: 150,
            flex: 0.9,
            valueFormatter: (value) => formatPercent(value),
        },
        {
            field: 'minInvestment',
            headerName: 'Min Investment',
            minWidth: 150,
            flex: 0.9,
            valueFormatter: (value) => value == null ? 'N/A' : `$${value}`,
        },
        {
            field: 'aiReason',
            headerName: 'AI Reason',
            minWidth: 320,
            flex: 1.8,
            sortable: false,
        },
        {
            field: 'actions',
            headerName: 'Action',
            minWidth: 130,
            flex: 0.8,
            sortable: false,
            filterable: false,
            renderCell: (params) => {
                const recommendationKey = `${messageKey}:${params.row.symbol}`
                const isAdded = Boolean(addedRecommendationKeys[recommendationKey])
                return (
                    <Button
                        size='small'
                        variant={isAdded ? 'outlined' : 'contained'}
                        disabled={isAdded}
                        onClick={() => onAddToPortfolio?.(params.row.symbol, params.row.assetType, messageKey)}
                    >
                        {isAdded ? 'Added ✓' : 'Add'}
                    </Button>
                )
            }
        }
    ]), [addedRecommendationKeys, messageKey, onAddToPortfolio])

    if (!rows.length) return null

    return (
        <Box sx={{ width: '100%', minWidth: 760 }}>
            <DataGrid
                rows={rows}
                columns={columns}
                disableRowSelectionOnClick
                pageSizeOptions={[5, 10]}
                initialState={{ pagination: { paginationModel: { pageSize: 5, page: 0 } } }}
                autoHeight
                sx={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(255,255,255,0.04)'
                    }
                }}
            />
        </Box>
    )
}
