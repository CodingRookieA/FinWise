import { describe, test, expect } from '@jest/globals'
import { trimHistoryToTokenBudget, formatHistoryForLLM } from '../../services/history/historyService.js'

describe('historyService', () => {
    test('returns empty array for null or empty history', () => {
        expect(trimHistoryToTokenBudget(null)).toEqual([])
        expect(trimHistoryToTokenBudget(undefined)).toEqual([])
        expect(trimHistoryToTokenBudget([])).toEqual([])
        expect(formatHistoryForLLM(null)).toEqual([])
    })

    test('keeps most recent messages within token budget and preserves chronological order', () => {
        const history = [
            { role: 'user', content: 'first message' },
            { role: 'AI', content: 'first answer' },
            { role: 'user', content: 'second message' },
            { role: 'AI', content: 'second answer' }
        ]

        const trimmed = trimHistoryToTokenBudget(history, 4, 20)

        expect(trimmed).toEqual([
            { role: 'AI', content: 'second answer' }
        ])
    })

    test('enforces maxTurns ceiling as max messages x2', () => {
        const history = [
            { role: 'user', content: 'u1' },
            { role: 'AI', content: 'a1' },
            { role: 'user', content: 'u2' },
            { role: 'AI', content: 'a2' },
            { role: 'user', content: 'u3' },
            { role: 'AI', content: 'a3' },
        ]

        const trimmed = trimHistoryToTokenBudget(history, 1000, 2)

        expect(trimmed).toEqual([
            { role: 'user', content: 'u2' },
            { role: 'AI', content: 'a2' },
            { role: 'user', content: 'u3' },
            { role: 'AI', content: 'a3' },
        ])
    })

    test('formats roles for Gemini and filters invalid messages', () => {
        const formatted = formatHistoryForLLM([
            { role: 'user', content: 'hello' },
            { role: 'AI', content: 'hi there' },
            { role: 'AI', content: '' },
            { role: 'other', content: 'ignore me' },
            { role: 'user', content: '   ' },
        ])

        expect(formatted).toEqual([
            { role: 'user', content: 'hello' },
            { role: 'model', content: 'hi there' },
        ])
    })
})
