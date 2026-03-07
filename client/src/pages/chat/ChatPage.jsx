import { useState, useEffect } from 'react'
import { Box, IconButton } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Sidebar } from '../../components/chat/sidebar/Sidebar'
import { EmptyState } from '../../components/chat/emptyState/EmptyState'
import { MessagesList } from '../../components/chat/messagesList/MessagesList'
import { InputArea } from '../../components/chat/inputArea/InputArea'
import { InfoAlert } from '../../components/alerts/InfoAlert'
import { SERVERURL } from '../../utils/constants'

export const ChatPage = ({ user, logout, loggedIn, setLoggedIn }) => {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
    const [chatHistory, setChatHistory] = useState([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [loadingSession, setLoadingSession] = useState(false)

    const guestChat = !loggedIn || !user.isVerified

    // Fetch chat history when user is logged in
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (guestChat) {
                // Clear history when user logs out
                setChatHistory([])
                return
            }

            setLoadingHistory(true)
            try {
                // Use /history endpoint which uses default userId for testing
                const response = await fetch(`${SERVERURL}/api/chat/history`, {
                    credentials: 'include'
                })

                if (response.ok) {
                    const data = await response.json()
                    setChatHistory(data.sessions || [])
                }
            } catch (error) {
                console.error('Error fetching chat history:', error)
            } finally {
                setLoadingHistory(false)
            }
        }

        fetchChatHistory()
    }, [guestChat, user?.userId])

    // Clear messages when user changes or logs out
    useEffect(() => {
        setMessages([])
        setSessionId(crypto.randomUUID())
    }, [user?.userId, guestChat])

    // Function to refresh chat history
    const refreshChatHistory = async () => {
        if (guestChat) return

        try {
            const response = await fetch(`${SERVERURL}/api/chat/history`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setChatHistory(data.sessions || [])
            }
        } catch (error) {
            console.error('Error refreshing chat history:', error)
        }
    }

    const handleSendMessage = async () => {
        if (!message.trim()) return

        // Check if this is the first message in a new chat
        const isFirstMessage = messages.length === 0

        // Add user message to chat
        const userMessage = { role: 'user', content: message }
        setMessages(prev => [...prev, userMessage])
        const currentMessage = message
        setMessage('')
        setLoading(true)

        try {
            const response = await fetch(`${SERVERURL}/api/chat/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    message: currentMessage,
                    userId: user?.userId,
                    sessionId: sessionId
                })
            })

            if (!response.ok) {
                throw new Error('Failed to get response from server')
            }

            const data = await response.json()
            
            // Add AI response to chat
            const aiMessage = { role: 'assistant', content: data.response }
            setMessages(prev => [...prev, aiMessage])
            
            // Refresh chat history to show new/updated session
            if (isFirstMessage) {
                // Refresh on first message to show the new chat in history
                await refreshChatHistory()
            }
        } catch (error) {
            console.error('Error sending message:', error)
            // Add error message to chat
            const errorMessage = { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error while processing your request. Please try again.' 
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const handleSampleQuestion = (question) => {
        setMessage(question)
    }

    const handleNewChat = () => {
        setMessages([])
        setMessage('')
        setSessionId(crypto.randomUUID())
    }

    const handleLoadSession = async (selectedSessionId) => {
        // Clear messages immediately to avoid showing old session data
        setMessages([])
        setLoadingSession(true)
        setLoading(true)
        try {
            console.log('Loading session:', selectedSessionId)
            const response = await fetch(`${SERVERURL}/api/chat/session/${selectedSessionId}`, {
                credentials: 'include'
            })

            console.log('Response status:', response.status)
            if (response.ok) {
                const data = await response.json()
                console.log('Loaded messages:', data)
                setMessages(data.messages || [])
                setSessionId(selectedSessionId)
            } else {
                console.error('Failed to load session:', response.status, response.statusText)
            }
        } catch (error) {
            console.error('Error loading session:', error)
        } finally {
            setLoading(false)
            setLoadingSession(false)
        }
    }

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen)
    }

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100vh',
                bgcolor: 'background.default',
                overflow: 'hidden',
                background: `radial-gradient(ellipse 90% 60% at -5% -5%, rgba(45,212,191,0.09) 0%, transparent 100%),
                             radial-gradient(ellipse 70% 45% at -5% -5%, rgba(56,189,248,0.07) 0%, transparent 80%),
                             radial-gradient(ellipse 120% 80% at -15% -15%, rgba(15,40,70,0.6) 0%, transparent 100%)`,
            }}
        >
            {
                user.userId && !user.isVerified &&
                <InfoAlert topOffset='0.5rem'>
                    <a style={{ textDecoration: 'none', color: '#0EA5E9' }} href='/email-verification'>Verify your email</a> to unlock full features
                </InfoAlert>
            }
            {/* Sidebar */}
            <Sidebar
                user={user}
                chatHistory={chatHistory}
                sidebarOpen={sidebarOpen}
                onToggleSidebar={toggleSidebar}
                onNewChat={handleNewChat}
                onLoadSession={handleLoadSession}
                loggedIn={!guestChat}
            />

            {/* Main Chat Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    ml: { xs: 0, md: !guestChat ? 0 : 0 },
                    height: '100vh',
                    overflow: 'hidden'
                }}
            >
                {/* Menu Button - Show when logged in and sidebar can be toggled */}
                {!guestChat && (
                    <Box 
                        sx={{ 
                            p: 2,
                            display: sidebarOpen ? { xs: 'none', md: 'none' } : 'block'
                        }}
                    >
                        <IconButton
                            onClick={toggleSidebar}
                            sx={{
                                color: 'text.primary',
                                bgcolor: '#1A2332',
                                '&:hover': {
                                    bgcolor: '#2A3A4E'
                                }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    </Box>
                )}

                {/* Content Area - Empty State or Messages */}
                {messages.length === 0 && !loadingSession ? (
                    <EmptyState onSampleQuestion={handleSampleQuestion} />
                ) : (
                    <MessagesList messages={messages} loading={loading} user={user} />
                )}

                {/* Input Area */}
                <InputArea
                    message={message}
                    loading={loading}
                    onMessageChange={(e) => setMessage(e.target.value)}
                    onSendMessage={handleSendMessage}
                    onKeyPress={handleKeyPress}
                />
            </Box>
        </Box>
    )
}