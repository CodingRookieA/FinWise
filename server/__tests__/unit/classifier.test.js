import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'

describe('classifier', () => {
    let originalFetch
    let consoleErrorSpy
    let consoleLogSpy
    let consoleWarnSpy

    beforeEach(() => {
        jest.resetModules()
        originalFetch = global.fetch
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        global.fetch = originalFetch
        consoleErrorSpy.mockRestore()
        consoleLogSpy.mockRestore()
        consoleWarnSpy.mockRestore()
    })

    test('throws on invalid query input', async () => {
        const { classifyQuery } = await import('../../helpers/classifier.js')

        await expect(classifyQuery('')).rejects.toThrow('Invalid query: must be a non-empty string')
    })

    test('returns parsed classification for valid AI response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                { text: '{"needs_articles":true,"needs_funds":false,"needs_etfs":false,"needs_distribution_mutual_funds":false,"is_continuation":false}' }
                            ]
                        }
                    }
                ]
            })
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        const result = await classifyQuery('What is NAV?')

        expect(result).toEqual({
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            is_continuation: false,
        })
    })

    test('maps needs_ETF alias to needs_etfs', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                { text: '{"needs_articles":false,"needs_funds":true,"needs_ETF":true,"needs_distribution_mutual_funds":false,"is_continuation":true}' }
                            ]
                        }
                    }
                ]
            })
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        const result = await classifyQuery('Compare ETF and fund')

        expect(result.needs_etfs).toBe(true)
        expect(result.needs_funds).toBe(true)
        expect(result.is_continuation).toBe(true)
    })

    test('returns safe fallback on API or parse errors', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ candidates: [] }),
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        const result = await classifyQuery('Any query')

        expect(result).toEqual({
            needs_articles: true,
            needs_funds: true,
            needs_etfs: true,
            needs_distribution_mutual_funds: false,
            is_continuation: false,
        })
    })

    test('forces articles, funds, and etfs for generic recommendation intent', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                { text: '{"needs_articles":false,"needs_funds":false,"needs_etfs":true,"needs_distribution_mutual_funds":false,"is_continuation":false}' }
                            ]
                        }
                    }
                ]
            })
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        const result = await classifyQuery('What should I invest in?')

        expect(result.needs_articles).toBe(true)
        expect(result.needs_etfs).toBe(true)
        expect(result.needs_funds).toBe(true)
        expect(result.is_continuation).toBe(false)
    })

    test('includes recent conversation history in classifier prompt payload', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                { text: '{"needs_articles":false,"needs_funds":false,"needs_etfs":true,"needs_distribution_mutual_funds":false,"is_continuation":true}' }
                            ]
                        }
                    }
                ]
            })
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        await classifyQuery(
            'can you provide their 5yr performance?',
            { risk_tolerance: 'medium' },
            [
                { role: 'user', content: 'so recommend me some ETFs' },
                { role: 'AI', content: 'CDZ.TO and DMEI.TO look suitable.' }
            ]
        )

        expect(global.fetch).toHaveBeenCalledTimes(1)
        const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body)
        const promptText = requestBody.contents?.[0]?.parts?.[0]?.text || ''
        expect(promptText).toContain('Recent conversation history')
        expect(promptText).toContain('assistant: CDZ.TO and DMEI.TO look suitable.')
        expect(promptText).toContain('user: so recommend me some ETFs')
    })

    test('forces funds-only when query explicitly pivots to mutual funds', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                { text: '{"needs_articles":false,"needs_funds":true,"needs_etfs":true,"needs_distribution_mutual_funds":false,"is_continuation":true}' }
                            ]
                        }
                    }
                ]
            })
        })

        const { classifyQuery } = await import('../../helpers/classifier.js')
        const result = await classifyQuery(
            'what about some mutual funds? anything that\'s a good addition to my portfolio?',
            { risk_tolerance: 'medium' },
            [
                { role: 'user', content: 'what are some top ETF funds you can recommend?' },
                { role: 'AI', content: 'I recommend CDZ.TO and CDIV.TO.' }
            ]
        )

        expect(result.needs_funds).toBe(true)
        expect(result.needs_etfs).toBe(false)
        expect(result.is_continuation).toBe(true)
    })
})
