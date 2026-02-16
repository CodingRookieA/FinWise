import { Box, Typography, Chip } from '@mui/material'

const sampleQuestions = [
    'What should I invest in?',
    'What are some finantial advices for beginners?',
    'Canadian ETF funds market today?',
]

export const EmptyState = ({ onSampleQuestion }) => {
    return (
        <Box
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
                py: 8
            }}
        >
            <Typography
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

            {/* Sample Questions */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 600, mb: 8 }}>
                {sampleQuestions.map((question, index) => (
                    <Chip
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
    )
}
