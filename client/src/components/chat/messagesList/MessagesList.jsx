import { useRef, useEffect } from 'react'
import { Box, Paper, Typography, Avatar } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './messagesList.module.css'

export const MessagesList = ({ messages, loading, user, loadingText = 'Thinking...', hideLoadingIndicator = false }) => {
    const messagesEndRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, loading])

    const isAssistantMessage = (role) => role === 'assistant' || role === 'AI'

    return (
        <Box
            className={styles.messagesContainer}
            sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                px: { xs: 2, md: 4 },
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 3
            }}
        >
            {messages.map((msg, index) => (
                <Box
                    key={index}
                    sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'flex-start',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                        maxWidth: 900,
                        mx: 'auto',
                        width: '100%'
                    }}
                >
                    <Avatar
                        sx={{
                            bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                            width: 36,
                            height: 36
                        }}
                    >
                        {msg.role === 'user' ? user?.name?.charAt(0) || 'U' : 'AI'}
                    </Avatar>
                    <Paper
                        sx={{
                            p: 2,
                            bgcolor: msg.role === 'user' ? 'primary.main' : '#2A3A4E',
                            color: 'text.primary',
                            maxWidth: '70%',
                            borderRadius: 2,
                            overflow: 'auto'
                        }}
                    >
                        {isAssistantMessage(msg.role) ? (
                            <Box className={styles.assistantMarkdown}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content || ''}
                                </ReactMarkdown>
                            </Box>
                        ) : (
                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word',
                                    alignContent: 'center'
                                }}
                            >
                                {msg.content}
                            </Typography>
                        )}
                    </Paper>
                </Box>
            ))}
            {loading && !hideLoadingIndicator && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', maxWidth: 900, mx: 'auto', width: '100%' }}>
                    <Avatar sx={{ bgcolor: 'secondary.main', width: 36, height: 36 }}>AI</Avatar>
                    <Paper sx={{ p: 2, bgcolor: '#2A3A4E' }}>
                        <Typography variant="body1" color="text.secondary">
                            {loadingText}
                        </Typography>
                    </Paper>
                </Box>
            )}
            <div ref={messagesEndRef} />
        </Box>
    )
}
