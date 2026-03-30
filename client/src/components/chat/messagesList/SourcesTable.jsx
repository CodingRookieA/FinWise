import { useMemo } from 'react'
import { Box, Link } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'

/**
 * @param {Array<{ id: string, chunkIndex: number, sourceUrl: string }>} rows
 * `id` is only used as the DataGrid row key (not shown).
 */
export function SourcesTable({ rows }) {
    const gridRows = useMemo(() => {
        return (Array.isArray(rows) ? rows : []).map((row, index) => ({
            id: row.id || `src-${index}`,
            chunkIndex: row.chunkIndex,
            sourceUrl: row.sourceUrl,
        }))
    }, [rows])

    const columns = useMemo(() => ([
        {
            field: 'chunkIndex',
            headerName: '#',
            width: 72,
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                const v = params.value
                return v != null && Number.isFinite(Number(v)) ? Number(v) : '—'
            },
        },
        {
            field: 'sourceUrl',
            headerName: 'URL',
            flex: 1,
            minWidth: 220,
            sortable: false,
            renderCell: (params) => {
                const href = params.value
                if (!href) return '—'
                return (
                    <Link href={href} target="_blank" rel="noopener noreferrer" variant="body2">
                        {href}
                    </Link>
                )
            },
        },
    ]), [])

    if (!gridRows.length) return null

    return (
        <Box sx={{ width: '100%', minWidth: 0, mt: 1 }}>
            <DataGrid
                rows={gridRows}
                columns={columns}
                disableRowSelectionOnClick
                density="compact"
                autoHeight
                hideFooter={gridRows.length <= 5}
                pageSizeOptions={[5, 10]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 5, page: 0 } },
                }}
                sx={{
                    borderColor: 'rgba(255,255,255,0.08)',
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(255,255,255,0.04)',
                    },
                }}
            />
        </Box>
    )
}
