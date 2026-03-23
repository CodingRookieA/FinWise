import { describe, test, expect } from '@jest/globals'
import { slimETF, getMatchingETFs } from '../../helpers/etfService.js'

describe('etfService', () => {
    test('slimETF maps known fields and defaults unknown fields to null', () => {
        const input = {
            symbol: 'VFV.TO',
            shortName: 'Vanguard S&P 500 Index ETF',
            currency: 'CAD',
            exchange: 'TOR',
            regularMarketPrice: 120,
            regularMarketChangePercent: 0.2,
            ytdReturn: 8.1,
            trailingThreeMonthReturns: 2.3,
            fiftyTwoWeekChangePercent: 14.5,
            fiftyTwoWeekHigh: 130,
            fiftyTwoWeekLow: 95,
            dividendYield: 1.5,
            netAssets: 5000000000,
            regularMarketTime: 1700000000,
            marketState: 'REGULAR',
        }

        const result = slimETF(input)

        expect(result.symbol).toBe('VFV.TO')
        expect(result.name).toBe('Vanguard S&P 500 Index ETF')
        expect(result.current_price).toBe(120)
        expect(result.mer).toBeNull()
        expect(result.fund_category).toBeNull()
        expect(result.asset_allocation).toBeNull()
    })

    test('getMatchingETFs returns [] for invalid or empty input', () => {
        expect(getMatchingETFs({}, null)).toEqual([])
        expect(getMatchingETFs({}, [])).toEqual([])
    })

    test('getMatchingETFs filters to CAD TSX/TOR and returns top 10 scored ETFs', () => {
        const allETFs = [
            {
                symbol: 'AAA.TO', shortName: 'AAA', currency: 'CAD', exchange: 'TOR',
                ytdReturn: 10, trailingThreeMonthReturns: 2, fiftyTwoWeekChangePercent: 15,
                netAssets: 2000000000, dividendYield: 4,
            },
            {
                symbol: 'BBB.TO', shortName: 'BBB', currency: 'CAD', exchange: 'TSX',
                ytdReturn: 5, trailingThreeMonthReturns: 1, fiftyTwoWeekChangePercent: 6,
                netAssets: 150000000, dividendYield: 1,
            },
            {
                symbol: 'USD.TO', shortName: 'USD', currency: 'USD', exchange: 'TOR',
                ytdReturn: 50, trailingThreeMonthReturns: 10, fiftyTwoWeekChangePercent: 60,
                netAssets: 5000000000, dividendYield: 5,
            },
            {
                symbol: 'NONTSX.TO', shortName: 'NONTSX', currency: 'CAD', exchange: 'NYSE',
                ytdReturn: 30, trailingThreeMonthReturns: 8, fiftyTwoWeekChangePercent: 35,
                netAssets: 3000000000, dividendYield: 4,
            },
        ]

        const result = getMatchingETFs({ financial_goal: 'income' }, allETFs)

        expect(result).toHaveLength(2)
        expect(result[0].symbol).toBe('AAA.TO')
        expect(result[1].symbol).toBe('BBB.TO')
        expect(result[0]).toHaveProperty('name', 'AAA')
    })

    test('getMatchingETFs caps output at 10 ETFs', () => {
        const allETFs = Array.from({ length: 12 }).map((_, i) => ({
            symbol: `ETF${i}.TO`,
            shortName: `ETF${i}`,
            currency: 'CAD',
            exchange: 'TOR',
            ytdReturn: i + 1,
            trailingThreeMonthReturns: i + 1,
            fiftyTwoWeekChangePercent: i + 1,
            netAssets: 1000000000 + i,
            dividendYield: 1,
        }))

        const result = getMatchingETFs({}, allETFs)

        expect(result).toHaveLength(10)
    })
})
