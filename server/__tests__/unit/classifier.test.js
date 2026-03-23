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
                                { text: '{"needs_articles":true,"needs_funds":false,"needs_etfs":false,"needs_distribution_mutual_funds":false}' }
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
                                { text: '{"needs_articles":false,"needs_funds":true,"needs_ETF":true,"needs_distribution_mutual_funds":false}' }
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
                                { text: '{"needs_articles":false,"needs_funds":false,"needs_etfs":true,"needs_distribution_mutual_funds":false}' }
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
    })
})
