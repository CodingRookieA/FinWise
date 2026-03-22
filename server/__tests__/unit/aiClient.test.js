import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { generateAIResponse } from '../../clients/aiClient.js'

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
