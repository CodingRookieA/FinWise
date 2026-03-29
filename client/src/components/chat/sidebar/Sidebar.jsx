import { Drawer } from '@mui/material'

import styles from './Sidebar.module.css'
import { SidebarContent } from './SidebarContent'

const SIDEBAR_WIDTH = 280

export const Sidebar = ({ 
    user, 
    chatHistory, 
    sidebarOpen, 
    onToggleSidebar, 
    onNewChat,
    onLoadSession,
    onDeleteSession,
    chatResponseMode = 'streaming',
    onChatResponseModeChange,
    loggedIn 
}) => {

    if (!loggedIn) return null

    return (
        <>
            {/* Desktop Sidebar - Permanent, toggleable */}
            <Drawer
                className={styles.sidebar}
                variant="persistent"
                open={sidebarOpen}
                sx={{
                    display: { xs: 'none', md: 'block' },
                    width: sidebarOpen ? SIDEBAR_WIDTH : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'background.default',
                        borderRadius: '1.5rem',
                        border: `1px solid #2A3A4E`,
                        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 10px 20px 0 rgba(0, 0, 0, 0.19)',
                        p: 2,
                        height: 'auto',
                        inset: '2rem'
                    },
                }}
            >
                <SidebarContent
                    user={user}
                    chatHistory={chatHistory}
                    onToggleSidebar={onToggleSidebar}
                    onNewChat={onNewChat}
                    onLoadSession={onLoadSession}
                    onDeleteSession={onDeleteSession}
                    chatResponseMode={chatResponseMode}
                    onChatResponseModeChange={onChatResponseModeChange}
                />
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
                        bgcolor: 'background.default',
                        borderRadius: '1.5rem',
                        border: `1px solid #2A3A4E`,
                        boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 10px 20px 0 rgba(0, 0, 0, 0.19)',
                        p: 2,
                        height: 'auto',
                        inset: '2rem'
                    },
                }}
            >
                <SidebarContent
                    user={user}
                    chatHistory={chatHistory}
                    onToggleSidebar={onToggleSidebar}
                    onNewChat={onNewChat}
                    onLoadSession={onLoadSession}
                    onDeleteSession={onDeleteSession}
                    chatResponseMode={chatResponseMode}
                    onChatResponseModeChange={onChatResponseModeChange}
                />
            </Drawer>
        </>
    )
}
