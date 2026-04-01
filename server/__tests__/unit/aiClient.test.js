import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { generateAIResponse, generateAIResponseStream } from '../../clients/aiClient.js'

function sseDataLine(obj) {
    return `data: ${JSON.stringify(obj)}\n\n`
}

function streamFromString(s) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode(s))
            controller.close()
        },
    })
}

describe('aiClient.generateAIResponse', () => {
    let originalFetch

    beforeEach(() => {
        originalFetch = global.fetch
        jest.clearAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    test('returns generated text when API call succeeds', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                candidates: [
                    {
                        content: {
                            parts: [{ text: 'Generated response text' }]
                        }
                    }
                ]
            })
        })

        const result = await generateAIResponse({
            systemPrompt: 'System prompt',
            userPrompt: 'User prompt',
            apiUrl: 'https://example.ai/generate',
            apiKey: 'test-key',
            maxOutputTokens: 256,
            temperature: 0.3,
        })

        expect(result).toBe('Generated response text')
        expect(global.fetch).toHaveBeenCalledTimes(1)
        const [url, options] = global.fetch.mock.calls[0]
        expect(url).toBe('https://example.ai/generate?key=test-key')
        expect(options.method).toBe('POST')
        expect(options.headers['Content-Type']).toBe('application/json')

        const parsedBody = JSON.parse(options.body)
        expect(parsedBody.contents[0].parts[0].text).toContain('System prompt')
        expect(parsedBody.contents[0].parts[0].text).toContain('User prompt')
        expect(parsedBody.generationConfig.maxOutputTokens).toBe(256)
        expect(parsedBody.generationConfig.temperature).toBe(0.3)
    })

    test('throws formatted error when API call fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({ message: 'quota exceeded', code: 429 })
        })

        await expect(
            generateAIResponse({
                systemPrompt: 'System prompt',
                userPrompt: 'User prompt',
                apiUrl: 'https://example.ai/generate',
                apiKey: 'test-key',
                maxOutputTokens: 128,
                temperature: 0.7,
            })
        ).rejects.toThrow('AI API error: {"message":"quota exceeded","code":429}')
    })
})

describe('aiClient.generateAIResponseStream', () => {
    let originalFetch

    beforeEach(() => {
        originalFetch = global.fetch
        jest.clearAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    test('yields concatenated text from multiple SSE events', async () => {
        const ev1 = { candidates: [{ content: { parts: [{ text: 'Hello' }] } }] }
        const ev2 = { candidates: [{ content: { parts: [{ text: ' world' }] } }] }
        const body = sseDataLine(ev1) + sseDataLine(ev2)

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            body: streamFromString(body),
        })

        const parts = []
        for await (const chunk of generateAIResponseStream({
            systemPrompt: '',
            userPrompt: 'Hi',
            apiUrl: 'https://example.ai/v1/models/x:generateContent',
            apiKey: 'k',
            maxOutputTokens: 100,
            temperature: 0.5,
        })) {
            parts.push(chunk)
        }

        expect(parts.join('')).toBe('Hello world')
        expect(global.fetch).toHaveBeenCalledWith(
            'https://example.ai/v1/models/x:streamGenerateContent?alt=sse&key=k',
            expect.any(Object),
        )
    })

    test('joins text from multiple parts in one chunk', async () => {
        const ev = {
            candidates: [{
                content: {
                    parts: [{ text: 'A' }, { text: 'B' }],
                },
            }],
        }
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            body: streamFromString(sseDataLine(ev)),
        })

        const parts = []
        for await (const chunk of generateAIResponseStream({
            systemPrompt: '',
            userPrompt: 'Hi',
            apiUrl: 'https://example.ai/v1/models/x:generateContent',
            apiKey: 'k',
            maxOutputTokens: 100,
            temperature: 0.5,
        })) {
            parts.push(chunk)
        }

        expect(parts.join('')).toBe('AB')
    })

    test('handles one SSE event split across multiple stream reads', async () => {
        const ev = { candidates: [{ content: { parts: [{ text: 'ABCDEF' }] } }] }
        const full = sseDataLine(ev)
        const mid = Math.floor(full.length / 2)
        const part1 = full.slice(0, mid)
        const part2 = full.slice(mid)

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(part1))
                    controller.enqueue(new TextEncoder().encode(part2))
                    controller.close()
                },
            }),
        })

        const parts = []
        for await (const chunk of generateAIResponseStream({
            systemPrompt: '',
            userPrompt: 'Hi',
            apiUrl: 'https://example.ai/v1/models/x:generateContent',
            apiKey: 'k',
            maxOutputTokens: 100,
            temperature: 0.5,
        })) {
            parts.push(chunk)
        }

        expect(parts.join('')).toBe('ABCDEF')
    })
})
