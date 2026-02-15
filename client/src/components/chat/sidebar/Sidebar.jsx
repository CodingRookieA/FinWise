import { Box, Typography, IconButton, Button, List, ListItem, ListItemText, Avatar, Drawer } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'

const SIDEBAR_WIDTH = 280

export const Sidebar = ({ 
    user, 
    chatHistory, 
    sidebarOpen, 
    onToggleSidebar, 
    onNewChat,
    onLoadSession,
    loggedIn 
}) => {
    const SidebarContent = () => (
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
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    p: 1.5
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
                                />
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
                    bgcolor: '#0EA5E9',
                    color: '#0B1120',
                    fontWeight: 600,
                    mb: 2,
                    '&:hover': {
                        bgcolor: '#0284C7'
                    }
                }}
            >
                New Chat
            </Button>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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

    if (!loggedIn) return null

    return (
        <>
            {/* Desktop Sidebar - Permanent, toggleable */}
            <Drawer
                variant="persistent"
                open={sidebarOpen}
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: sidebarOpen ? SIDEBAR_WIDTH : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: '#1A2332',
                        border: 'none',
                        p: 2,
                    },
                }}
            >
                <SidebarContent />
            </Drawer>

            {/* Mobile Sidebar - Temporary */}
            <Drawer
                variant="temporary"
                open={sidebarOpen}
                onClose={onToggleSidebar}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: '#1A2332',
                        border: 'none',
                        p: 2,
                    },
                }}
            >
                <SidebarContent />
            </Drawer>
        </>
    )
}
