import { describe, test, expect } from '@jest/globals'
import { parseAIResponse, sanitizeAssistantVisibleText } from '../../helpers/responseParser.js'

describe('responseParser', () => {
    test('parseAIResponse strips Internal Note and inline SOURCES from visible message', () => {
        const raw = `[Internal Note: No prior context]

Hello (SOURCES: 5, 6, 7).

SOURCES:
{"507f1f77bcf86cd799439011": 5}`

        const { message, sources } = parseAIResponse(raw)

        expect(message).not.toMatch(/Internal Note/i)
        expect(message).not.toMatch(/SOURCES:/i)
        expect(message).toContain('Hello')
        expect(sources).toEqual({ '507f1f77bcf86cd799439011': 5 })
    })

    test('sanitizeAssistantVisibleText removes debug and parenthetical source tags', () => {
        const t = `Line one [Internal Note: x]

Advice here (SOURCES: 1, 2, 3) and [Source 9] more.`
        expect(sanitizeAssistantVisibleText(t)).toBe('Line one\n\nAdvice here  and  more.')
    })

    test('sanitizeAssistantVisibleText removes (Source N) citations', () => {
        const t = 'Early investing helps (Source 4). Also see (Source 4, Source 7).'
        expect(sanitizeAssistantVisibleText(t)).toBe('Early investing helps . Also see .')
    })

    test('parseAIResponse still parses RECOMMENDATIONS after sanitization', () => {
        const raw = `Tip (SOURCE: 2)

RECOMMENDATIONS:
{"XIU.TO": "broad market"}`

        const { message, recommendations } = parseAIResponse(raw)
        expect(message).toBe('Tip')
        expect(recommendations).toEqual({ 'XIU.TO': 'broad market' })
    })

    test('parseAIResponse merges multiple JSON objects after SOURCES', () => {
        const raw = `Hello

SOURCES:
{"507f1f77bcf86cd799439011": 1}
{"507f1f77bcf86cd799439012": 2}`

        const { sources } = parseAIResponse(raw)
        expect(sources).toEqual({
            '507f1f77bcf86cd799439011': 1,
            '507f1f77bcf86cd799439012': 2,
        })
    })
})
