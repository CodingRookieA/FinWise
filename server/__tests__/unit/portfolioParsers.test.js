import { describe, test, expect } from '@jest/globals'
import CsvParserRouter from '../../services/portfolio/CsvParserRouter.js'
import BankCsvParser from '../../services/portfolio/parsers/BankCsvParser.js'
import TDParser from '../../services/portfolio/parsers/TDParser.js'
import CIBCParser from '../../services/portfolio/parsers/CIBCParser.js'
import RBCParser from '../../services/portfolio/parsers/RBCParser.js'
import BMOParser from '../../services/portfolio/parsers/BMOParser.js'
import ScotiabankParser from '../../services/portfolio/parsers/ScotiabankParser.js'
import PortfolioHolding from '../../services/portfolio/models/PortfolioHolding.js'

class TestParser extends BankCsvParser {
    get requiredHeaders() {
        return ['Symbol', 'Quantity']
    }
}

class IncompleteParser extends BankCsvParser {}

describe('portfolio parser stack', () => {
    test('PortfolioHolding stores constructor values', () => {
        const holding = new PortfolioHolding('VFV.TO', 'ETF', 10, 1000, 120)

        expect(holding.ticker).toBe('VFV.TO')
        expect(holding.assetClass).toBe('ETF')
        expect(holding.shares).toBe(10)
        expect(holding.bookValue).toBe(1000)
        expect(holding.currentPrice).toBe(120)
    })

    test('BankCsvParser cannot be instantiated directly', () => {
        expect(() => new BankCsvParser()).toThrow('Cannot instantiate abstract class BankCsvParser')
    })

    test('base parse throws when subclass does not override parse', () => {
        const parser = new TestParser()
        expect(() => parser.parse([])).toThrow('Method parse() must be implemented.')
    })

    test('base requiredHeaders getter throws when not implemented by subclass', () => {
        const parser = new IncompleteParser()
        expect(() => parser.requiredHeaders).toThrow('Getter requiredHeaders must be implemented.')
    })

    test('canParse supports trimming and case-insensitive matching', () => {
        const parser = new TestParser()

        expect(parser.canParse([' symbol ', 'QUANTITY'])).toBe(true)
        expect(parser.canParse(['symbol'])).toBe(false)
    })

    test('cleanTicker handles empty and BMO suffix translations', () => {
        const parser = new TestParser()

        expect(parser.cleanTicker('')).toBe('')
        expect(parser.cleanTicker('vfv-tc')).toBe('VFV.TO')
        expect(parser.cleanTicker('abc-vc')).toBe('ABC.V')
        expect(parser.cleanTicker('reit.un-tc')).toBe('REIT.UN.TO')
        expect(parser.cleanTicker('pref/pa-tc')).toBe('PREF/PA.TO')
        expect(parser.cleanTicker('xiu:ca')).toBe('XIU')
    })

    test('determineAssetClass prioritizes explicit securityType', () => {
        const parser = new TestParser()

        expect(parser.determineAssetClass('ABCD123', 1, null, 'Mutual Fund')).toBe('Mutual Fund')
        expect(parser.determineAssetClass('VFV.TO', 1, null, 'ETF')).toBe('ETF')
    })

    test('determineAssetClass uses etf-description fallback for MF-like ticker', () => {
        const parser = new TestParser()

        const result = parser.determineAssetClass('ABCD123', 100, 'some etf product', null)

        expect(result).toBe('Mutual Fund')
    })

    test('determineAssetClass treats high precision quantity as mutual fund', () => {
        const parser = new TestParser()

        const result = parser.determineAssetClass('XQQQ', 12.345, 'not etf', null)

        expect(result).toBe('Mutual Fund')
    })

    test('determineAssetClass returns mutual fund for MF regex ticker', () => {
        const parser = new TestParser()

        expect(parser.determineAssetClass('ABCD123', 12, 'fund', null)).toBe('Mutual Fund')
    })

    test('determineAssetClass returns ETF for ETF regex ticker and default fallback', () => {
        const parser = new TestParser()

        expect(parser.determineAssetClass('XIU.TO', 5, null, null)).toBe('ETF')
        expect(parser.determineAssetClass('@@@', null, null, null)).toBe('ETF')
    })

    test('TDParser parses holdings and defaults missing values', () => {
        const parser = new TDParser()
        const rows = [
            { Account: 'a1', Action: 'Buy', Symbol: 'vfv-tc', 'Security Type': 'ETF', Quantity: '10' },
            { Account: 'a1', Action: 'Buy', Symbol: '', 'Security Type': '', Quantity: '' }
        ]

        const result = parser.parse(rows)

        expect(result).toHaveLength(2)
        expect(result[0].ticker).toBe('VFV.TO')
        expect(result[0].assetClass).toBe('ETF')
        expect(result[0].shares).toBe(10)
        expect(result[1].shares).toBe(0)
    })

    test('CIBCParser parses with security type path', () => {
        const parser = new CIBCParser()
        const rows = [
            { 'Security type': 'Mutual Fund', Symbol: 'ABCD123', 'Transaction type': 'Buy', Quantity: '2' }
        ]

        const result = parser.parse(rows)

        expect(result).toHaveLength(1)
        expect(result[0].assetClass).toBe('Mutual Fund')
    })

    test('RBCParser parses using description and optional security type', () => {
        const parser = new RBCParser()
        const rows = [
            { Symbol: 'ABCD123', Description: 'some etf text', Quantity: '3', Price: '100', 'Security Type': null }
        ]

        const result = parser.parse(rows)

        expect(result).toHaveLength(1)
        expect(result[0].assetClass).toBe('Mutual Fund')
        expect(result[0].shares).toBe(3)
    })

    test('BMOParser parses rows with quantity fallback to 0', () => {
        const parser = new BMOParser()
        const rows = [
            { Symbol: 'xiu', Description: 'ETF holding', Quantity: '', Price: '20', 'Security Type': 'ETF' }
        ]

        const result = parser.parse(rows)

        expect(result).toHaveLength(1)
        expect(result[0].ticker).toBe('XIU')
        expect(result[0].shares).toBe(0)
    })

    test('ScotiabankParser handles optional quantity branch', () => {
        const parser = new ScotiabankParser()
        const rows = [
            { Symbol: 'ABCD123', Description: 'Mutual fund', 'Security Type': 'Mutual Fund' },
            { Symbol: 'XIU', Description: 'ETF', 'Security Type': 'ETF', Quantity: '5' }
        ]

        const result = parser.parse(rows)

        expect(result).toHaveLength(2)
        expect(result[0].shares).toBe(0)
        expect(result[1].shares).toBe(5)
    })

    test('CsvParserRouter detects correct parser for known headers', () => {
        const router = new CsvParserRouter()

        const tdParser = router.detectParser(['Account', 'Action', 'Symbol', 'Security Type', 'Quantity'])
        const cibcParser = router.detectParser(['Security type', 'Symbol', 'Transaction type', 'Quantity'])

        expect(tdParser).toBeInstanceOf(TDParser)
        expect(cibcParser).toBeInstanceOf(CIBCParser)
    })

    test('CsvParserRouter throws for unsupported headers', () => {
        const router = new CsvParserRouter()

        expect(() => router.detectParser(['foo', 'bar'])).toThrow('Unsupported CSV format or unrecognized brokerage.')
    })
})
