import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { embedText } from '../../services/article/embeddingService.js'

describe('embeddingService.embedText', () => {
    let originalFetch

    beforeEach(() => {
        originalFetch = global.fetch
        jest.clearAllMocks()
    })

    afterEach(() => {
        global.fetch = originalFetch
    })

    test('returns embedding vector when API call succeeds', async () => {
        const mockVector = [0.12, -0.04, 0.98]
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                embedding: { values: mockVector }
            })
        })

        const result = await embedText('Sample article chunk text')

        expect(result).toEqual(mockVector)
        expect(global.fetch).toHaveBeenCalledTimes(1)

        const [url, options] = global.fetch.mock.calls[0]
        expect(url).toContain('?key=')
        expect(options.method).toBe('POST')
        expect(options.headers['Content-Type']).toBe('application/json')

        const parsedBody = JSON.parse(options.body)
        expect(parsedBody.model).toBe('models/gemini-embedding-001')
        expect(parsedBody.content.parts[0].text).toBe('Sample article chunk text')
    })

    test('throws formatted error when embedding API fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: jest.fn().mockResolvedValue({ message: 'invalid key', code: 401 })
        })

        await expect(embedText('Some text')).rejects.toThrow(
            'Embedding API error: {"message":"invalid key","code":401}'
        )
    })
})
