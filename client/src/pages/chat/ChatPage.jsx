import { useState, useEffect } from 'react'
import { Box, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Sidebar } from '../../components/chat/sidebar/Sidebar'
import { EmptyState } from '../../components/chat/emptyState/EmptyState'
import { MessagesList } from '../../components/chat/messagesList/MessagesList'
import { RecommendationPanel } from '../../components/chat/recommendationPanel/RecommendationPanel'
import { InputArea } from '../../components/chat/inputArea/InputArea'
import { InfoAlert } from '../../components/alerts/InfoAlert'
import { SERVERURL } from '../../utils/constants'
import toastHelper from '../../utils/toastHelper'

export const ChatPage = ({ user, loggedIn }) => {
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
    const [chatHistory, setChatHistory] = useState([])
    const [loadingSession, setLoadingSession] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [pendingDeleteSessionId, setPendingDeleteSessionId] = useState(null)
    const [activeRecommendations, setActiveRecommendations] = useState(null)
    const [addingRecommendations, setAddingRecommendations] = useState(false)
    const [streamingStatus, setStreamingStatus] = useState('')
    const [streamingMessageActive, setStreamingMessageActive] = useState(false)
    const defaultChatResponseMode = import.meta.env.MODE === 'test'
        ? 'regular'
        : (import.meta.env.VITE_CHAT_RESPONSE_MODE || 'streaming')
    const [chatResponseMode, setChatResponseMode] = useState(defaultChatResponseMode)
    const [showProfileFlashcards, setShowProfileFlashcards] = useState(false)
    const [profileQuestions, setProfileQuestions] = useState([])
    const [loadingProfileQuestions, setLoadingProfileQuestions] = useState(false)

    const guestChat = !loggedIn || !user.isVerified

    // Fetch chat history when user is logged in
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (guestChat) {
                // Clear history when user logs out
                setChatHistory([])
                return
            }

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
            }
        }

        fetchChatHistory()
    }, [guestChat, user?.userId])

    // Clear messages when user changes or logs out
    useEffect(() => {
        setMessages([])
        setSessionId(crypto.randomUUID())
        setActiveRecommendations(null)
    }, [user?.userId, guestChat])

    const fetchProfileQuestionnaire = async ({ silent = false, applyState = true } = {}) => {
        if (guestChat) {
            if (applyState) {
                setShowProfileFlashcards(false)
                setProfileQuestions([])
            }
            return { questions: [], remainingUnansweredCount: 0 }
        }

        if (!silent) {
            setLoadingProfileQuestions(true)
        }
        try {
            const response = await fetch(`${SERVERURL}/api/profile/questionnaire`, {
                credentials: 'include',
            })
            if (!response.ok) {
                throw new Error('Failed to load profile questionnaire')
            }

            const data = await response.json()
            const questions = Array.isArray(data?.questions) ? data.questions : []
            const hasUnanswered = Number(data?.remainingUnansweredCount || 0) > 0

            if (applyState) {
                setShowProfileFlashcards(hasUnanswered)
                setProfileQuestions(hasUnanswered ? questions : [])
            }
            return {
                questions,
                remainingUnansweredCount: Number(data?.remainingUnansweredCount || 0),
            }
        } catch (error) {
            console.error('Error loading profile questionnaire:', error)
            // Do not block empty state if questionnaire fetch fails.
            if (applyState) {
                setShowProfileFlashcards(false)
                setProfileQuestions([])
            }
            return { questions: [], remainingUnansweredCount: 0 }
        } finally {
            if (!silent) {
                setLoadingProfileQuestions(false)
            }
        }
    }

    useEffect(() => {
        if (loadingSession || messages.length > 0) return
        fetchProfileQuestionnaire()
    }, [guestChat, user?.userId, messages.length, loadingSession])

    const addSingleRecommendation = async (symbol, assetType) => {
        const normalizedSymbol =
            assetType === 'mutual_fund'
                ? symbol
                : String(symbol || '').replace(/\.TO$/i, '').trim()

        const payload = {
            symbol: normalizedSymbol,
            quantity: 1,
            type: assetType === 'mutual_fund' ? 'Mutual Fund' : 'ETF'
        }

        const response = await fetch(`${SERVERURL}/api/assets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body.message || `Failed to add ${symbol}`)
        }
    }

    const handleAddSelectedRecommendations = async (selectedRows) => {
        if (!Array.isArray(selectedRows) || selectedRows.length === 0) return

        setAddingRecommendations(true)
        try {
            let successCount = 0
            for (const row of selectedRows) {
                await addSingleRecommendation(row.symbol, row.assetType)
                successCount += 1
            }

            toastHelper('success', `Added ${successCount} recommendation${successCount > 1 ? 's' : ''} to portfolio`)
            setActiveRecommendations(null)
        } catch (error) {
            console.error('Error adding selected recommendations to portfolio:', error)
            toastHelper('error', error.message || 'Failed to add selected recommendations')
        } finally {
            setAddingRecommendations(false)
        }
    }

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

    const streamAssistantText = async (messageId, fullText) => {
        const text = String(fullText || '')
        if (!text) return

        const chunkSize = 16
        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize)
            setMessages((prev) => prev.map((msg) => (
                msg.id === messageId
                    ? { ...msg, content: `${msg.content || ''}${chunk}` }
                    : msg
            )))

            // Keep animation very light so UI remains responsive.
            await new Promise((resolve) => setTimeout(resolve, 12))
        }
    }

    const handleSendMessage = async () => {
        if (!message.trim()) return

        // Check if this is the first message in a new chat
        const isFirstMessage = messages.length === 0

        // Add user message to chat
        const userMessage = { id: crypto.randomUUID(), role: 'user', content: message }
        setMessages(prev => [...prev, userMessage])
        const currentMessage = message
        setMessage('')
        setLoading(true)

        const statusTextByStage = {
            classifying: 'Classifying query...',
            building_context: 'Building context...',
            loading: 'Loading model...',
            start_streaming: 'Starting stream...'
        }

        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

        try {
            const effectiveChatResponseMode = import.meta.env.MODE === 'test' ? 'regular' : chatResponseMode

            if (effectiveChatResponseMode === 'streaming') {
                try {
                    let aiMessageId = null
                    setStreamingStatus('Preparing request...')
                    setStreamingMessageActive(false)

                    const response = await fetch(`${SERVERURL}/api/chat/send/stream`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'text/event-stream'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            message: currentMessage,
                            userId: user?.userId,
                            sessionId: sessionId
                        })
                    })

                    if (!response.ok) {
                        throw new Error('Failed to get streaming response from server')
                    }

                    if (!response.body) {
                        const nonStreamData = await response.json().catch(() => null)
                        if (nonStreamData?.response) {
                            const shouldAttachTable =
                                nonStreamData?.isContinuation === false &&
                                Array.isArray(nonStreamData?.enrichedFunds) &&
                                nonStreamData.enrichedFunds.length > 0

                            const aiMessageId = crypto.randomUUID()
                            setMessages(prev => [...prev, {
                                id: aiMessageId,
                                role: 'assistant',
                                content: '',
                                enrichedFunds: shouldAttachTable ? nonStreamData.enrichedFunds : null,
                            }])
                            setActiveRecommendations(shouldAttachTable ? nonStreamData.enrichedFunds : null)
                            await streamAssistantText(aiMessageId, nonStreamData.response)

                            if (isFirstMessage) {
                                await refreshChatHistory()
                            }

                            return
                        }

                        throw new Error('Failed to get streaming response from server')
                    }

                    // We parse SSE manually from fetch stream so we can support
                    // status/chunk/done events in a single connection.
                    const reader = response.body.getReader()
                    const decoder = new TextDecoder('utf-8')
                    let buffer = ''

                    const applyChunk = (text) => {
                        if (!text) return

                        if (!aiMessageId) {
                            aiMessageId = crypto.randomUUID()
                            setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '', enrichedFunds: null }])
                        }

                        setStreamingMessageActive(true)
                        setStreamingStatus('Streaming response...')

                        setMessages((prev) => prev.map((msg) => (
                            msg.id === aiMessageId
                                ? { ...msg, content: `${msg.content || ''}${text}` }
                                : msg
                        )))
                    }

                    // Large model chunks render as one big jump. Split into small pieces with short
                    // delays so the UI paints progressively (same idea as streamAssistantText).
                    const SMOOTH_STEP = 28
                    const SMOOTH_DELAY_MS = 10
                    const smooth = { queue: [], draining: false, cancelled: false }

                    const cancelSmoothDrain = () => {
                        smooth.cancelled = true
                        smooth.queue.length = 0
                    }

                    const enqueueSmoothText = (text) => {
                        if (!text) return
                        const t = String(text)
                        if (t.length <= SMOOTH_STEP) {
                            applyChunk(t)
                            return
                        }
                        for (let i = 0; i < t.length; i += SMOOTH_STEP) {
                            smooth.queue.push(t.slice(i, i + SMOOTH_STEP))
                        }
                        if (smooth.draining) return
                        smooth.draining = true
                        smooth.cancelled = false

                        const drain = async () => {
                            while (smooth.queue.length > 0 && !smooth.cancelled) {
                                const piece = smooth.queue.shift()
                                if (piece) applyChunk(piece)
                                if (smooth.queue.length > 0 && !smooth.cancelled) {
                                    await sleep(SMOOTH_DELAY_MS)
                                }
                            }
                            smooth.draining = false
                        }
                        void drain()
                    }

                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break

                        buffer += decoder.decode(value, { stream: true })

                        let boundary = buffer.indexOf('\n\n')
                        while (boundary >= 0) {
                            const block = buffer.slice(0, boundary)
                            buffer = buffer.slice(boundary + 2)

                            const lines = block.split(/\r?\n/)
                            let eventName = 'message'
                            const dataLines = []

                            for (const line of lines) {
                                if (line.startsWith('event:')) {
                                    eventName = line.slice(6).trim()
                                } else if (line.startsWith('data:')) {
                                    dataLines.push(line.slice(5).trim())
                                }
                            }

                            if (dataLines.length > 0) {
                                let payload = null
                                try {
                                    payload = JSON.parse(dataLines.join('\n'))
                                } catch {
                                    payload = null
                                }

                                if (eventName === 'chunk' && payload) {
                                    const chunkText = String(payload.text || '')
                                    if (chunkText) {
                                        enqueueSmoothText(chunkText)
                                    }
                                }

                                if (eventName === 'status' && payload?.stage) {
                                    setStreamingStatus(statusTextByStage[payload.stage] || 'Working...')
                                }

                                if (eventName === 'done' && payload?.result) {
                                    const result = payload.result

                                    cancelSmoothDrain()

                                    setStreamingStatus('Finalizing recommendations...')

                                    const shouldAttachTable =
                                        result?.isContinuation === false &&
                                        Array.isArray(result?.enrichedFunds) &&
                                        result.enrichedFunds.length > 0

                                    if (!aiMessageId) {
                                        aiMessageId = crypto.randomUUID()
                                        setMessages(prev => [...prev, {
                                            id: aiMessageId,
                                            role: 'assistant',
                                            content: result.response || '',
                                            enrichedFunds: shouldAttachTable ? result.enrichedFunds : null,
                                        }])
                                    } else {
                                        setMessages((prev) => prev.map((msg) => (
                                            msg.id === aiMessageId
                                                ? {
                                                    ...msg,
                                                    content: result.response || msg.content,
                                                    enrichedFunds: shouldAttachTable ? result.enrichedFunds : null,
                                                }
                                                : msg
                                        )))
                                    }

                                    setActiveRecommendations(shouldAttachTable ? result.enrichedFunds : null)
                                    setStreamingMessageActive(false)
                                    setStreamingStatus('')
                                }

                                if (eventName === 'error') {
                                    throw new Error(payload?.details || payload?.error || 'Streaming request failed')
                                }
                            }

                            boundary = buffer.indexOf('\n\n')
                        }
                    }

                    if (isFirstMessage) {
                        await refreshChatHistory()
                    }

                    return
                } catch (streamError) {
                    // If stream transport fails, continue with regular endpoint so users still get a response.
                    console.warn('Streaming mode failed, falling back to regular mode:', streamError)
                    setStreamingMessageActive(false)
                    setStreamingStatus('')
                }
            }

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
            const shouldAttachTable =
                data?.isContinuation === false &&
                Array.isArray(data?.enrichedFunds) &&
                data.enrichedFunds.length > 0

            const aiMessageId = crypto.randomUUID()
            const aiMessage = {
                id: aiMessageId,
                role: 'assistant',
                content: data.response || '',
                enrichedFunds: shouldAttachTable ? data.enrichedFunds : null,
            }
            setMessages(prev => [...prev, aiMessage])
            setActiveRecommendations(shouldAttachTable ? data.enrichedFunds : null)

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
            setActiveRecommendations(null)
            setStreamingMessageActive(false)
            setStreamingStatus('')
        } finally {
            setLoading(false)
            setStreamingMessageActive(false)
            setStreamingStatus('')
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

    const handleSubmitProfileAnswer = async (field, rawValue) => {
        const question = profileQuestions.find((q) => q.field === field)
        if (!question) return

        let value = rawValue
        if (question.type !== 'mcq' && question.inputType === 'number') {
            value = rawValue === '' || rawValue == null ? null : Number(rawValue)
        } else if (typeof rawValue === 'string') {
            value = rawValue.trim()
        }

        const response = await fetch(`${SERVERURL}/api/profile`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ [field]: value }),
        })

        if (!response.ok) {
            const body = await response.json().catch(() => ({}))
            throw new Error(body?.error || 'Failed to save profile answer')
        }

        const priorQuestions = profileQuestions
        const answeredIndex = priorQuestions.findIndex((q) => q.field === field)
        const questionnaire = await fetchProfileQuestionnaire({ silent: true, applyState: false })
        const remaining = Number(questionnaire?.remainingUnansweredCount || 0)
        const nextBatch = Array.isArray(questionnaire?.questions) ? questionnaire.questions : []

        if (remaining <= 0) {
            setShowProfileFlashcards(false)
            setProfileQuestions([])
            return
        }

        const nextQuestions = [...priorQuestions]
        const preservedFields = new Set(
            priorQuestions
                .filter((q) => q?.field && q.field !== field)
                .map((q) => q.field)
        )
        const replacement = nextBatch.find((q) => q?.field && !preservedFields.has(q.field))

        if (answeredIndex >= 0) {
            if (replacement) {
                nextQuestions[answeredIndex] = replacement
            } else {
                nextQuestions.splice(answeredIndex, 1)
            }
        }

        setShowProfileFlashcards(true)
        setProfileQuestions(nextQuestions.filter(Boolean))
    }

    const handleNewChat = () => {
        setMessages([])
        setMessage('')
        setSessionId(crypto.randomUUID())
        setActiveRecommendations(null)
        if (!guestChat) {
            fetchProfileQuestionnaire()
        }
    }

    const handleChatModeChange = (nextMode) => {
        const normalizedMode = nextMode === 'streaming' ? 'streaming' : 'regular'
        if (normalizedMode === chatResponseMode) {
            return
        }

        setChatResponseMode(normalizedMode)

        if (normalizedMode === 'streaming') {
            toastHelper('info', 'Streaming enabled. Recommendation table may appear slightly after text.')
        }
    }

    const handleLoadSession = async (selectedSessionId) => {
        // Clear messages immediately to avoid showing old session data
        setMessages([])
        setActiveRecommendations(null)
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

    const confirmDeleteSession = async () => {
        const selectedSessionId = pendingDeleteSessionId
        if (guestChat || !selectedSessionId) return

        try {
            const response = await fetch(`${SERVERURL}/api/chat/session/${selectedSessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (!response.ok) {
                throw new Error(`Failed to delete session: ${response.status}`)
            }

            setChatHistory(prev => prev.filter(chat => chat.sessionId !== selectedSessionId))

            if (sessionId === selectedSessionId) {
                setMessages([])
                setMessage('')
                setSessionId(crypto.randomUUID())
            }
        } catch (error) {
            console.error('Error deleting session:', error)
        } finally {
            setDeleteDialogOpen(false)
            setPendingDeleteSessionId(null)
        }
    }

    const handleDeleteSession = (selectedSessionId) => {
        if (!selectedSessionId) return
        setPendingDeleteSessionId(selectedSessionId)
        setDeleteDialogOpen(true)
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
                onDeleteSession={handleDeleteSession}
                chatResponseMode={chatResponseMode}
                onChatResponseModeChange={handleChatModeChange}
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
                    overflowX: 'hidden',
                    overflowY: messages.length === 0 ? 'auto' : 'hidden',
                }}
            >
                {guestChat && (
                    <Box sx={{ p: 2 }}>
                        <Button
                            component="a"
                            href="/"
                            variant="text"
                            sx={{
                                color: 'text.secondary',
                                textTransform: 'none',
                                fontWeight: 600,
                                px: 0,
                                '&:hover': { color: 'text.primary', bgcolor: 'transparent' },
                            }}
                        >
                            ← Back to home
                        </Button>
                    </Box>
                )}

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
                    <EmptyState
                        onSampleQuestion={handleSampleQuestion}
                        showProfileFlashcards={showProfileFlashcards}
                        profileQuestions={profileQuestions}
                        loadingProfileQuestions={loadingProfileQuestions}
                        onSubmitProfileAnswer={handleSubmitProfileAnswer}
                    />
                ) : (
                    <MessagesList
                        messages={messages}
                        loading={loading}
                        user={user}
                        loadingText={streamingStatus || 'Thinking...'}
                        hideLoadingIndicator={streamingMessageActive}
                    />
                )}

                {Array.isArray(activeRecommendations) && activeRecommendations.length > 0 && (
                    <Box sx={{ px: { xs: 2, md: 4 }, pb: 2 }}>
                        <RecommendationPanel
                            funds={activeRecommendations}
                            adding={addingRecommendations}
                            onAddSelected={handleAddSelectedRecommendations}
                            onDismiss={() => setActiveRecommendations(null)}
                        />
                    </Box>
                )}

                {/* Input Area */}
                <InputArea
                    message={message}
                    loading={loading}
                    streamingResponse={loading && chatResponseMode === 'streaming'}
                    onMessageChange={(e) => setMessage(e.target.value)}
                    onSendMessage={handleSendMessage}
                    onKeyPress={handleKeyPress}
                />
            </Box>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false)
                    setPendingDeleteSessionId(null)
                }}
            >
                <DialogTitle>Delete chat session?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">
                        This action will permanently delete this chat history.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => {
                            setDeleteDialogOpen(false)
                            setPendingDeleteSessionId(null)
                        }}
                    >
                        Cancel
                    </Button>
                    <Button color="error" variant="contained" onClick={confirmDeleteSession}>
                        Delete Session
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}