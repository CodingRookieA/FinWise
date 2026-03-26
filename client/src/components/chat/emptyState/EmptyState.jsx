import { useRef, useState } from 'react'
import { Box, Typography, Chip, Paper, Button, TextField, CircularProgress } from '@mui/material'
import styles from './EmptyState.module.css'

const sampleQuestions = [
    'What should I invest in?',
    'What are some financial advices for beginners?',
    'Canadian ETF funds market today?',
]

const formatOptionLabel = (option) => String(option || '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export const EmptyState = ({
    onSampleQuestion,
    showProfileFlashcards = false,
    profileQuestions = [],
    loadingProfileQuestions = false,
    onSubmitProfileAnswer,
}) => {
    const [fillAnswers, setFillAnswers] = useState({})
    const [submittingField, setSubmittingField] = useState('')
    const [exitingSlotIndex, setExitingSlotIndex] = useState(null)
    const clearExitTimerRef = useRef(null)

    const cardHeight = profileQuestions.length === 1 ? 'auto' : 240

    const handleMcqClick = async (slotIndex, field, option) => {
        if (!onSubmitProfileAnswer) return
        setSubmittingField(field)
        setExitingSlotIndex(slotIndex)
        if (clearExitTimerRef.current) {
            clearTimeout(clearExitTimerRef.current)
            clearExitTimerRef.current = null
        }
        try {
            // Small delay so the card can start fading out before we refresh questions.
            await new Promise((resolve) => setTimeout(resolve, 90))
            await onSubmitProfileAnswer(field, option)
        } finally {
            setSubmittingField('')
            clearExitTimerRef.current = setTimeout(() => {
                setExitingSlotIndex(null)
                clearExitTimerRef.current = null
            }, 230)
        }
    }

    const handleFillSubmit = async (slotIndex, field) => {
        if (!onSubmitProfileAnswer) return
        const answer = fillAnswers[field]
        if (answer == null || String(answer).trim() === '') return

        setSubmittingField(field)
        setExitingSlotIndex(slotIndex)
        if (clearExitTimerRef.current) {
            clearTimeout(clearExitTimerRef.current)
            clearExitTimerRef.current = null
        }
        try {
            // Small delay so the card can start fading out before we refresh questions.
            await new Promise((resolve) => setTimeout(resolve, 90))
            await onSubmitProfileAnswer(field, answer)
            setFillAnswers((prev) => ({ ...prev, [field]: '' }))
        } finally {
            setSubmittingField('')
            clearExitTimerRef.current = setTimeout(() => {
                setExitingSlotIndex(null)
                clearExitTimerRef.current = null
            }, 230)
        }
    }

    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: showProfileFlashcards
                    ? { xs: 'flex-start', md: 'center' }
                    : 'center',
                overflowY: showProfileFlashcards ? 'auto' : 'visible',
                px: 3,
                py: 8
            }}
        >
            <Typography
                className={styles.header}
                variant="h3"
                fontWeight={700}
                color="text.primary"
                sx={{
                    mb: 6,
                    textAlign: 'center',
                    fontSize: { xs: '2rem', md: '3rem' }
                }}
            >
                How can I help you <span style={{ color: '#10B981' }}>today?</span>
            </Typography>

            {showProfileFlashcards ? (
                <Box sx={{ width: '100%', maxWidth: 980 }}>
                    <Typography fontWeight={700} color="text.primary" variant="h6" gutterBottom>
                        Finish your profile first
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Answer these quick profile cards to unlock tailored quick actions.
                    </Typography>

                    {loadingProfileQuestions ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    md: profileQuestions.length === 1 ? '1fr' : '1fr 1fr',
                                },
                                justifyContent: 'center',
                                maxWidth: profileQuestions.length === 1 ? 520 : 980,
                                alignItems: 'stretch',
                                gap: 2,
                                margin: '0 auto',
                            }}
                        >
                            {profileQuestions.map((q, index) => (
                                <Box key={`flash-slot-${index}`} sx={{ width: '100%' }}>
                                    <Paper
                                        className={[
                                            styles.profileCard,
                                            exitingSlotIndex === index ? styles.profileCardExit : '',
                                        ].filter(Boolean).join(' ')}
                                        sx={{
                                            p: 3,
                                            borderRadius: 4,
                                            minHeight: 190,
                                            height: { xs: 'auto', md: cardHeight },
                                            display: 'flex',
                                            flexDirection: 'column',
                                            pointerEvents: exitingSlotIndex === index ? 'none' : 'auto',
                                        }}
                                    >
                                        <Typography variant="h6" className={styles.profileCardTitle} sx={{ mb: 3 }}>
                                            {q.prompt || q.title}
                                        </Typography>

                                        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                                            {q.type === 'mcq' ? (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                    {(q.options || []).map((option) => (
                                                        <Button
                                                            key={option}
                                                            variant="outlined"
                                                            onClick={() => handleMcqClick(index, q.field, option)}
                                                            disabled={submittingField === q.field}
                                                            sx={{ minWidth: 120, borderRadius: 3 }}
                                                        >
                                                            {formatOptionLabel(option)}
                                                        </Button>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                    <TextField
                                                        size="small"
                                                        placeholder={q.placeholder || 'Type your answer...'}
                                                        value={fillAnswers[q.field] ?? ''}
                                                        onChange={(e) => setFillAnswers((prev) => ({ ...prev, [q.field]: e.target.value }))}
                                                        type={q.inputType === 'number' ? 'number' : 'text'}
                                                        sx={{ flex: 1 }}
                                                    />
                                                    <Button
                                                        variant="contained"
                                                        onClick={() => handleFillSubmit(index, q.field)}
                                                        disabled={submittingField === q.field}
                                                    >
                                                        Save
                                                    </Button>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            ) : (
                <Box className={styles.quickActions}>
                    <Typography
                        fontWeight={700}
                        color="text.primary"
                        variant='h6'
                        gutterBottom
                    >
                        Quick Actions
                    </Typography>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        width: '100%',
                        maxWidth: 600
                    }}>
                        {sampleQuestions.map((question, index) => (
                            <Chip
                                className={styles.chip}
                                key={index}
                                label={question}
                                onClick={() => onSampleQuestion(question)}
                                sx={{
                                    bgcolor: '#2A4A6E',
                                    color: 'text.primary',
                                    py: 3,
                                    px: 2,
                                    fontSize: '1rem',
                                    fontStyle: 'italic',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: '#3A5A7E'
                                    },
                                    '& .MuiChip-label': {
                                        px: 2
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    )
}
