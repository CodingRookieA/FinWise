import { Box, Paper, TextField, IconButton } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

export const InputArea = ({ 
    message, 
    loading, 
    onMessageChange, 
    onSendMessage, 
    onKeyPress 
}) => {
    return (
        <Box
            sx={{
                p: { xs: 2, md: 3 },
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.default'
            }}
        >
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Paper
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        bgcolor: '#1A2332',
                        border: '1px solid #2A3A4E',
                        px: 2,
                        py: 1,
                        borderRadius: 10
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="What would you like to know?"
                        value={message}
                        onChange={onMessageChange}
                        onKeyPress={onKeyPress}
                        disabled={loading}
                        variant="standard"
                        InputProps={{
                            disableUnderline: true,
                            sx: {
                                color: 'text.primary',
                                fontSize: '0.95rem'
                            }
                        }}
                    />
                    <IconButton
                        onClick={onSendMessage}
                        disabled={!message.trim() || loading}
                        sx={{
                            bgcolor: '#0EA5E9',
                            color: '#fff',
                            width: 40,
                            height: 40,
                            '&:hover': {
                                bgcolor: '#0284C7'
                            },
                            '&.Mui-disabled': {
                                bgcolor: '#2A3A4E',
                                color: '#666'
                            }
                        }}
                    >
                        <SendIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                </Paper>
            </Box>
        </Box>
    )
}
