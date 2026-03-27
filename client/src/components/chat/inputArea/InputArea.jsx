import { Box, Paper, TextField, IconButton, Typography } from '@mui/material'
import SendIcon from '@mui/icons-material/Send'

import styles from './InputArea.module.css'

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
                p: { xs: 3, md: 5 },
                borderColor: 'divider',
            }}
        >
            <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                <Paper
                    className={styles.inputArea}
                    sx={{
                        display: 'flex',
                        gap: 1,
                        alignItems: 'center',
                        bgcolor: '#1A2332',
                        border: '1px solid #2A3A4E',
                        px: 2,
                        py: 1,
                        borderRadius: 10,
                        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)'
                    }}
                >
                    <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="What would you like to know?"
                        value={message}
                        onChange={onMessageChange}
                        onKeyDown={onKeyPress}
                        disabled={loading}
                        variant="standard"
                        slotProps={{
                            input: {
                                disableUnderline: true,
                                sx: {
                                    color: 'text.primary',
                                    fontSize: '0.95rem'
                                }
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
            <Typography
                className={styles.warning}
                variant='subtitle2' sx={{paddingTop: '0.5rem'}}
            >
                Not a financial advisor, just your AI guide.
            </Typography>
        </Box>
    )
}
