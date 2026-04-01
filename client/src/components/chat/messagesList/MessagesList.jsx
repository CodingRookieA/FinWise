import { useRef, useEffect, useState, useCallback } from 'react'
import { Box, Paper, Typography, Avatar, IconButton, Tooltip, Collapse } from '@mui/material'
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './messagesList.module.css'
import { SourcesTable } from './SourcesTable'
import { RecommendationPanel } from '../recommendationPanel/RecommendationPanel'

const ASSISTANT_AVATAR_PROPS = {
    src: '/finwise-assistant-avatar.png',
    alt: 'FinWise',
    sx: {
        width: 36,
        height: 36,
        bgcolor: 'transparent',
        '& .MuiAvatar-img': { objectFit: 'cover' }
    }
}

export const MessagesList = ({
    messages,
    loading,
    user,
    loadingText = 'Thinking...',
    hideLoadingIndicator = false,
    onAddSelectedRecommendations,
    addingRecommendations = false,
}) => {
    const messagesEndRef = useRef(null)
    const [sourcesOpen, setSourcesOpen] = useState({})
    const [recsOpen, setRecsOpen] = useState({})

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, loading])

    const isAssistantMessage = (role) => role === 'assistant' || role === 'AI'

    const toggleSources = useCallback((key) => {
        setSourcesOpen((prev) => ({ ...prev, [key]: !prev[key] }))
    }, [])

    const toggleRecs = useCallback((key) => {
        setRecsOpen((prev) => ({ ...prev, [key]: !prev[key] }))
    }, [])

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
            {messages.map((msg, index) => {
                const msgKey = msg.id ?? `idx-${index}`
                const hasSources = Array.isArray(msg.enrichedSources) && msg.enrichedSources.length > 0
                const hasRecs = Array.isArray(msg.enrichedFunds) && msg.enrichedFunds.length > 0
                const showMetaBar = isAssistantMessage(msg.role) && (hasSources || hasRecs)

                return (
                    <Box
                        key={msgKey}
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
                            {...(msg.role === 'user'
                                ? {
                                      sx: { bgcolor: 'primary.main', width: 36, height: 36 },
                                      children: user?.name?.charAt(0) || 'U'
                                  }
                                : ASSISTANT_AVATAR_PROPS)}
                        />
                        <Paper
                            sx={{
                                p: 2,
                                bgcolor: msg.role === 'user' ? 'primary.main' : '#2A3A4E',
                                color: 'text.primary',
                                maxWidth: '70%',
                                borderRadius: 2,
                                overflow: 'visible'
                            }}
                        >
                            {isAssistantMessage(msg.role) ? (
                                <>
                                    <Box className={styles.assistantMarkdown}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {msg.content || ''}
                                        </ReactMarkdown>
                                    </Box>
                                    {showMetaBar && (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 0.5,
                                                mt: 1.5,
                                                pt: 1,
                                                borderTop: '1px solid rgba(255,255,255,0.08)',
                                            }}
                                        >
                                            {hasSources && (
                                                <Tooltip title="Article sources">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Toggle sources table"
                                                        aria-expanded={Boolean(sourcesOpen[msgKey])}
                                                        onClick={() => toggleSources(msgKey)}
                                                        sx={{ color: 'text.secondary' }}
                                                    >
                                                        <LibraryBooksOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {hasRecs && (
                                                <Tooltip title="Fund recommendations">
                                                    <IconButton
                                                        size="small"
                                                        aria-label="Toggle recommendations table"
                                                        aria-expanded={Boolean(recsOpen[msgKey])}
                                                        onClick={() => toggleRecs(msgKey)}
                                                        sx={{ color: 'text.secondary' }}
                                                    >
                                                        <TableChartOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    )}
                                    {hasSources && (
                                        <Collapse in={Boolean(sourcesOpen[msgKey])} timeout="auto" unmountOnExit>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, mt: 1 }}>
                                                Sources
                                            </Typography>
                                            <SourcesTable rows={msg.enrichedSources} />
                                        </Collapse>
                                    )}
                                    {hasRecs && (
                                        <Collapse in={Boolean(recsOpen[msgKey])} timeout="auto" unmountOnExit>
                                            <Box sx={{ mt: 1.5, maxWidth: '100%', overflow: 'auto' }}>
                                                <RecommendationPanel
                                                    embedded
                                                    funds={msg.enrichedFunds}
                                                    adding={addingRecommendations}
                                                    onAddSelected={onAddSelectedRecommendations}
                                                    onDismiss={undefined}
                                                />
                                            </Box>
                                        </Collapse>
                                    )}
                                </>
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
                )
            })}
            {loading && !hideLoadingIndicator && (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', maxWidth: 900, mx: 'auto', width: '100%' }}>
                    <Avatar {...ASSISTANT_AVATAR_PROPS} />
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
