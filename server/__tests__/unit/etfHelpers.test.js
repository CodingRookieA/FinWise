import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'

async function loadEtfHelpers({ etfList, quoteImpl } = {}) {
    const readFileSync = jest.fn(() => JSON.stringify(etfList ?? ['VFV.TO', 'XIU.TO']))
    const quote = jest.fn(quoteImpl ?? (async () => []))

    jest.resetModules()

    await jest.unstable_mockModule('fs', () => ({
        default: { readFileSync },
    }))

    await jest.unstable_mockModule('yahoo-finance2', () => ({
        default: jest.fn().mockImplementation(() => ({ quote })),
    }))

    const { default: etfHelpers } = await import('../../helpers/etfHelpers.js')
    return { etfHelpers, readFileSync, quote }
}

describe('etfHelpers', () => {
    let consoleErrorSpy

    beforeEach(() => {
        jest.clearAllMocks()
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        consoleErrorSpy.mockRestore()
    })

    test('isValidCanadianETF returns true for symbol in list', async () => {
        const { etfHelpers } = await loadEtfHelpers({ etfList: ['VFV.TO'] })

        expect(etfHelpers.isValidCanadianETF('VFV')).toBe(true)
    })

    test('isValidCanadianETF returns false for symbol not in list', async () => {
        const { etfHelpers } = await loadEtfHelpers({ etfList: ['VFV.TO'] })

        expect(etfHelpers.isValidCanadianETF('NOTREAL')).toBe(false)
    })

    test('fetchAllETFs returns [] when ETF list is empty', async () => {
        const { etfHelpers, quote } = await loadEtfHelpers({ etfList: [] })

        const result = await etfHelpers.fetchAllETFs()

        expect(result).toEqual([])
        expect(quote).not.toHaveBeenCalled()
    })

    test('fetchAllETFs wraps single quote object in an array', async () => {
        const quoteResult = { symbol: 'VFV.TO', regularMarketPrice: 100 }
        const { etfHelpers, quote } = await loadEtfHelpers({
            etfList: ['VFV.TO'],
            quoteImpl: async () => quoteResult,
        })

        const result = await etfHelpers.fetchAllETFs()

        expect(result).toEqual([quoteResult])
        expect(quote).toHaveBeenCalledWith(['VFV.TO'], { region: 'CA', lang: 'en-CA' })
    })

    test('fetchAllETFs returns [] when quote API throws', async () => {
        const { etfHelpers } = await loadEtfHelpers({
            etfList: ['VFV.TO'],
            quoteImpl: async () => {
                throw new Error('boom')
            },
        })

        const result = await etfHelpers.fetchAllETFs()

        expect(result).toEqual([])
    })
})
