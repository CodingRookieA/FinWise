import { Box, Typography, IconButton, Button, List, ListItem, ListItemText, Avatar, FormControlLabel, Switch } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useNavigate } from 'react-router-dom'

export const SidebarContent = ({
    user, 
    chatHistory, 
    onToggleSidebar, 
    onNewChat,
    onLoadSession,
    onDeleteSession,
    chatResponseMode = 'streaming',
    onChatResponseModeChange,
}) => {
    const navigate = useNavigate()

    return(
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Logo and Close Button */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                    Fin<span style={{color: '#10B981'}}>Wise</span>
                </Typography>
                <IconButton
                    onClick={onToggleSidebar}
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {
                            color: 'text.primary'
                        }
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Chat History */}
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Chat history
                </Typography>
                {chatHistory.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', px: 1 }}>
                        No chat history yet. Start a conversation!
                    </Typography>
                ) : (
                    <List sx={{ p: 0 }}>
                        {chatHistory.map((chat, index) => (
                            <ListItem
                                key={chat.sessionId || index}
                                onClick={() => onLoadSession && onLoadSession(chat.sessionId)}
                                sx={{
                                    bgcolor: '#0B1120',
                                    mb: 1,
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: '#2A3A4E'
                                    },
                                    alignItems: 'center'
                                }}
                            >
                                <ListItemText
                                    primary={chat.title}
                                    secondary={chat.date}
                                    primaryTypographyProps={{
                                        variant: 'body2',
                                        color: 'text.primary',
                                        fontWeight: 500,
                                        noWrap: true
                                    }}
                                    secondaryTypographyProps={{
                                        variant: 'caption',
                                        color: 'text.secondary'
                                    }}
                                    sx={{ mr: 1 }}
                                />
                                <IconButton
                                    size="small"
                                    aria-label={`delete session ${chat.title}`}
                                    onClick={(event) => {
                                        event.stopPropagation()
                                        if (onDeleteSession) onDeleteSession(chat.sessionId)
                                    }}
                                    sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                                >
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* New Chat Button */}
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onNewChat}
                sx={{
                    background: 'linear-gradient(135deg, #2dd4bf, #38bdf8)',
                    color: '#07101e',
                    fontWeight: 600,
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontSize: '13px',
                    boxShadow: '0 2px 12px rgba(45,212,191,0.3)',
                    '&:hover': {
                        boxShadow: '0 4px 20px rgba(45,212,191,0.45)',
                        transform: 'scale(1.02)'
                    },
                    mb: 2,
                }}
            >
                New Chat
            </Button>

            <Box
                sx={{
                    px: 0.5,
                    py: 1,
                    mb: 1,
                    borderTop: 1,
                    borderColor: 'divider',
                }}
            >
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Response mode
                </Typography>
                <FormControlLabel
                    control={(
                        <Switch
                            size="small"
                            checked={chatResponseMode === 'streaming'}
                            onChange={(event) => {
                                if (typeof onChatResponseModeChange === 'function') {
                                    onChatResponseModeChange(event.target.checked ? 'streaming' : 'regular')
                                }
                            }}
                            inputProps={{ 'aria-label': 'toggle streaming mode' }}
                        />
                    )}
                    label={chatResponseMode === 'streaming' ? 'Stream' : 'Regular'}
                    sx={{
                        m: 0,
                        width: '100%',
                        justifyContent: 'space-between',
                        '& .MuiFormControlLabel-label': {
                            fontSize: '0.8rem',
                            fontWeight: 600,
                        }
                    }}
                    labelPlacement="start"
                />
            </Box>

            {/* User Profile */}
            <Box 
                onClick={() => navigate('/profile')}
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    pt: 2, 
                    borderTop: 1, 
                    borderColor: 'divider',
                    cursor: 'pointer',
                    borderRadius: 1,
                    p: 1,
                    mt: 1,
                    '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                }}
            >
                <Avatar src={user?.picture} sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                    {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="body2" color="text.primary" noWrap fontWeight={500}>
                        {user?.email || 'email@email.com'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user?.name || 'username'}
                    </Typography>
                </Box>
            </Box>
        </Box>
    )
}