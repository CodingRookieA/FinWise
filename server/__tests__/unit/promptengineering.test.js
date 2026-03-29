import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals'
import promptengineering from '../../helpers/promptengineering.js'
import { ENVIRONMENT } from '../../utils/constants.js'
import { Profile } from '../../models/profile.js'
import { MutualFund } from '../../models/MutualFund.js'
import { Asset } from '../../models/Asset.js'
import etfHelpers from '../../helpers/etfHelpers.js'
import { Chunk } from '../../models/Chunks.js'

describe('promptengineering', () => {
    let consoleLogSpy
    let originalFetch

    beforeEach(() => {
        jest.clearAllMocks()
        originalFetch = global.fetch
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        global.fetch = originalFetch
        consoleLogSpy.mockRestore()
        jest.restoreAllMocks()
    })

    test('builds full prompt with all context sections', async () => {
        // Arrange
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('Employment status: employed')
        jest.spyOn(promptengineering, 'getUserPortfolioContext').mockResolvedValue('Holding 1: VFV | Type: ETF | Quantity: 10')
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('Article context')
        jest.spyOn(promptengineering, 'getSFundInfo').mockResolvedValue('Fund context')
        jest.spyOn(promptengineering, 'getSETFInfo').mockResolvedValue('ETF context')

        // Act
        const messages = await promptengineering.generatePrompt('question', 'u1', {
            needs_articles: true,
            needs_funds: true,
            needs_etfs: true,
            needs_distribution_mutual_funds: false,
        })

        // Assert
        expect(messages[0].content).toContain('--- USER PROFILE')
        expect(messages[0].content).toContain('--- USER PORTFOLIO')
        expect(messages[0].content).toContain('--- ARTICLE CONTEXT')
        expect(messages[0].content).toContain('--- MATCHING MUTUAL FUNDS')
        expect(messages[0].content).toContain('--- MATCHING ETFs')
        expect(messages[0].content).toContain('SOURCE OF TRUTH')
        expect(messages[0].content).toContain('RECOMMENDATIONS')
    })

    test('adds no-context marker when all context flags are false', async () => {
        // Arrange
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')

        // Act
        const messages = await promptengineering.generatePrompt('hello', null, {
            needs_articles: false,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
        })

        // Assert
        expect(messages[0].content).toContain('(No specific context provided for this query.)')
        expect(messages[0].content).toContain('SOURCE OF TRUTH')
        expect(messages[1]).toEqual({ role: 'user', content: 'hello' })
    })

    test('passes distribution flag to fund context fetch', async () => {
        const getSFundInfoSpy = jest.spyOn(promptengineering, 'getSFundInfo').mockResolvedValue('Fund context')
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getUserPortfolioContext').mockResolvedValue('')

        await promptengineering.generatePrompt('distribution question', 'u1', {
            needs_articles: false,
            needs_funds: true,
            needs_etfs: false,
            needs_distribution_mutual_funds: true,
        })

        expect(getSFundInfoSpy).toHaveBeenCalledWith('u1', true)
    })

    test('includes only selected context sections', async () => {
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('Article only')
        jest.spyOn(promptengineering, 'getSFundInfo').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getSETFInfo').mockResolvedValue('')

        const messages = await promptengineering.generatePrompt('query', null, {
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
        })

        expect(messages[0].content).toContain('--- ARTICLE CONTEXT')
        expect(messages[0].content).toContain('MODE: General educational')
        expect(messages[0].content).not.toContain('--- MATCHING MUTUAL FUNDS')
        expect(messages[0].content).not.toContain('--- MATCHING ETFs')
    })

    test('needs_articles triggers fresh fetch and ignores prefetched session chunks', async () => {
        const getDocsSpy = jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('Fresh from vector search')
        const formatSpy = jest.spyOn(promptengineering, 'formatChunksAsText')

        const messages = await promptengineering.generatePrompt('new question', 'u1', {
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            _prefetchedChunks: [{ _id: 'old', content: 'stale', source_url: 'u', source_category: 'c' }],
        })

        expect(getDocsSpy).toHaveBeenCalled()
        expect(formatSpy).not.toHaveBeenCalled()
        expect(messages[0].content).toContain('Fresh from vector search')
        expect(messages[0].content).not.toContain('stale')
    })

    test('prefetched chunks used only when needs_articles is false', async () => {
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('should not use')
        const formatSpy = jest.spyOn(promptengineering, 'formatChunksAsText').mockReturnValue('From prior turn')

        const messages = await promptengineering.generatePrompt('tell me more', 'u1', {
            needs_articles: false,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            _prefetchedChunks: [{ _id: '507f1f77bcf86cd799439011', content: 'prior', source_url: 'u', source_category: 'c' }],
        })

        expect(promptengineering.getInvestmentDocs).not.toHaveBeenCalled()
        expect(formatSpy).toHaveBeenCalled()
        expect(messages[0].content).toContain('From prior turn')
        expect(messages[0].content).not.toContain('should not use')
    })

    test('general mode omits portfolio section even when holdings exist', async () => {
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('chunks')
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('Risk: low')
        jest.spyOn(promptengineering, 'getUserPortfolioContext').mockResolvedValue('Holding: VFV')

        const messages = await promptengineering.generatePrompt('q', 'u1', {
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
        })

        expect(messages[0].content).toContain('USER PROFILE')
        expect(messages[0].content).not.toContain('USER PORTFOLIO')
        expect(messages[0].content).not.toContain('VFV')
    })

    test('returns message array with system and user roles', async () => {
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')

        const messages = await promptengineering.generatePrompt('test query', null, {
            needs_articles: false,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
        })

        expect(Array.isArray(messages)).toBe(true)
        expect(messages).toHaveLength(2)
        expect(messages[0].role).toBe('system')
        expect(messages[1].role).toBe('user')
        expect(messages[1].content).toBe('test query')
    })

    test('skips empty context sections in system prompt', async () => {
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getSFundInfo').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getSETFInfo').mockResolvedValue('')

        const messages = await promptengineering.generatePrompt('query', null, {
            needs_articles: true,
            needs_funds: true,
            needs_etfs: true,
            needs_distribution_mutual_funds: false,
        })

        expect(messages[0].content).toContain('(No specific context provided')
    })

    test('handles mixed empty and populated context sections', async () => {
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('Employment: freelance')
        jest.spyOn(promptengineering, 'getUserPortfolioContext').mockResolvedValue('Holding 1: XQQ | Type: ETF | Quantity: 2')
        jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getSFundInfo').mockResolvedValue('Some fund data')
        jest.spyOn(promptengineering, 'getSETFInfo').mockResolvedValue('')

        const messages = await promptengineering.generatePrompt('query', 'u1', {
            needs_articles: true,
            needs_funds: true,
            needs_etfs: true,
            needs_distribution_mutual_funds: false,
        })

        expect(messages[0].content).toContain('--- USER PROFILE')
        expect(messages[0].content).toContain('--- USER PORTFOLIO')
        expect(messages[0].content).toContain('--- MATCHING MUTUAL FUNDS')
        expect(messages[0].content).not.toContain('--- ARTICLE CONTEXT')
    })

    test('returns formatted portfolio context for user holdings', async () => {
        jest.spyOn(Asset, 'find').mockReturnValue({
            sort: () => ({
                select: () => ({
                    lean: async () => ([
                        { symbol: 'VFV', type: 'ETF', quantity: 10 },
                        { symbol: 'RBF460', type: 'Mutual Fund', quantity: 5 }
                    ])
                })
            })
        })

        const result = await promptengineering.getUserPortfolioContext('u1')

        expect(result).toContain('Total holdings: 2 | ETFs: 1 | Mutual Funds: 1 | Aggregate quantity: 15')
        expect(result).toContain('Holding 1: VFV | Type: ETF | Quantity: 10')
        expect(result).toContain('Holding 2: RBF460 | Type: Mutual Fund | Quantity: 5')
    })

    test('returns empty string when portfolio lookup has no assets', async () => {
        jest.spyOn(Asset, 'find').mockReturnValue({
            sort: () => ({
                select: () => ({
                    lean: async () => ([])
                })
            })
        })

        const result = await promptengineering.getUserPortfolioContext('u1')

        expect(result).toBe('')
    })

    test('returns unauthenticated notice when getSFundInfo is called without userId', async () => {
        const result = await promptengineering.getSFundInfo(null)

        expect(result).toContain('[USER NOT AUTHENTICATED]')
    })

    test('returns profile-not-found notice when getSFundInfo has no profile', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue(null)

        const result = await promptengineering.getSFundInfo('u1')

        expect(result).toContain('[USER PROFILE NOT FOUND]')
    })

    test('returns no-matching-funds notice when filtered funds are empty', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({ risk_tolerance: 'low', savings_balance: 1000 })
        jest.spyOn(MutualFund, 'find').mockReturnValue({
            limit: () => ({ lean: async () => [] })
        })

        const result = await promptengineering.getSFundInfo('u1')

        expect(result).toContain('[NO MATCHING FUNDS]')
    })

    test('formats fund distribution details when distribution context is requested', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({ risk_tolerance: 'high', savings_balance: 10000 })
        jest.spyOn(MutualFund, 'find').mockReturnValue({
            limit: () => ({
                lean: async () => ([
                    {
                        fund_code: 'F123',
                        name: 'Growth Fund',
                        nav: 12.34,
                        mer: 1.2,
                        risk: 'medium',
                        fund_type: 'equity',
                        minimum_investment: 500,
                        '1yr': 10,
                        '3yr': 9,
                        '5yr': 8,
                        distribution: {
                            '2023': { total: 1.5, dividends: 0.9 }
                        }
                    }
                ])
            })
        })

        const result = await promptengineering.getSFundInfo('u1', true)

        expect(result).toContain('Fund 1: Growth Fund (F123)')
        expect(result).toContain('Distributions:')
        expect(result).toContain('2023: total: 1.5, dividends: 0.9')
    })

    test('returns no-matching-etfs notice when matching list is empty', async () => {
        jest.spyOn(Profile, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue({}) })
        jest.spyOn(etfHelpers, 'fetchAllETFs').mockResolvedValue([])

        const result = await promptengineering.getSETFInfo('u1')

        expect(result).toContain('[NO MATCHING ETFs]')
    })

    test('formats ETF values and null fallbacks in getSETFInfo', async () => {
        jest.spyOn(Profile, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue({}) })
        jest.spyOn(etfHelpers, 'fetchAllETFs').mockResolvedValue([
            {
                symbol: 'VFV',
                shortName: 'Vanguard S&P 500',
                currency: 'CAD',
                exchange: 'TSX',
                regularMarketPrice: 120,
                ytdReturn: 11.2,
                trailingThreeMonthReturns: 3.2,
                fiftyTwoWeekChangePercent: 15.7,
                dividendYield: 1.1,
                net_assets: 1000000,
            }
        ])

        const result = await promptengineering.getSETFInfo('u1')

        expect(result).toContain('ETF 1: Vanguard S&P 500 (VFV)')
        expect(result).toContain('MER: null | Category: null')
    })

    test('returns empty string when getUserInfo has no profile', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue(null)

        const result = await promptengineering.getUserInfo('u1')

        expect(result).toBe('')
    })

    test('returns formatted profile fields for getUserInfo', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({
            employment_status: 'employed',
            monthly_income: 5000,
            savings_balance: 15000,
            risk_tolerance: 'medium',
            financial_goal: 'retirement',
        })

        const result = await promptengineering.getUserInfo('u1')

        expect(result).toContain('Employment status: employed')
        expect(result).toContain('Monthly income: $5000')
        expect(result).toContain('Risk tolerance: medium')
    })

    test('returns formatted article context when vector results exceed threshold', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } })
        })
        jest.spyOn(Chunk, 'aggregate').mockResolvedValue([
            {
                _id: '507f1f77bcf86cd799439011',
                source_url: 'https://example.com/article',
                source_category: 'fundamentals',
                score: 0.95,
                content: 'Diversification reduces concentration risk.'
            },
            {
                _id: '507f1f77bcf86cd799439012',
                source_url: 'https://example.com/low-score',
                source_category: 'fees',
                score: 0.2,
                content: 'Low confidence chunk'
            }
        ])

        const result = await promptengineering.getInvestmentDocs('what is diversification?')

        expect(result).toContain('URL: https://example.com/article')
        expect(result).toContain('Diversification reduces concentration risk.')
        expect(result).not.toContain('low-score')
    })

    test('getInvestmentDocs passes vector search limit from chunkLimit option', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ embedding: { values: new Array(3072).fill(0.01) } })
        })
        const aggregateSpy = jest.spyOn(Chunk, 'aggregate').mockResolvedValue([])

        await promptengineering.getInvestmentDocs('query', { chunkLimit: 8 })

        const vectorStage = aggregateSpy.mock.calls[0][0][0].$vectorSearch
        expect(vectorStage.limit).toBe(8)
        expect(vectorStage.numCandidates).toBeGreaterThanOrEqual(100)
    })

    test('generatePrompt requests more article chunks in general mode', async () => {
        const getDocsSpy = jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')

        await promptengineering.generatePrompt('q', null, {
            needs_articles: true,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            response_mode: 'general',
        })

        expect(getDocsSpy.mock.calls[0][1].chunkLimit).toBe(ENVIRONMENT.articleChunkLimitGeneral)
    })

    test('generatePrompt requests narrow article chunk count when mode is narrow', async () => {
        const getDocsSpy = jest.spyOn(promptengineering, 'getInvestmentDocs').mockResolvedValue('')
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('')

        await promptengineering.generatePrompt('q', null, {
            needs_articles: true,
            needs_funds: true,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            response_mode: 'narrow',
        })

        expect(getDocsSpy.mock.calls[0][1].chunkLimit).toBe(ENVIRONMENT.articleChunkLimitNarrow)
    })

    test('returns empty context when no article chunks pass threshold', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } })
        })
        jest.spyOn(Chunk, 'aggregate').mockResolvedValue([
            { score: 0.1, source_url: 'u', source_category: 'c', content: 'x' }
        ])

        const result = await promptengineering.getInvestmentDocs('query')

        expect(result).toBe('')
    })

    test('returns empty string when getSFundInfo throws unexpectedly', async () => {
        jest.spyOn(Profile, 'findOne').mockRejectedValue(new Error('db failure'))

        const result = await promptengineering.getSFundInfo('u1')

        expect(result).toBe('')
    })

    test('returns empty string when getSETFInfo throws unexpectedly', async () => {
        jest.spyOn(Profile, 'findOne').mockReturnValue({ lean: jest.fn().mockResolvedValue({}) })
        jest.spyOn(etfHelpers, 'fetchAllETFs').mockRejectedValue(new Error('etf source down'))

        const result = await promptengineering.getSETFInfo('u1')

        expect(result).toBe('')
    })

    test('returns empty string when getUserInfo throws unexpectedly', async () => {
        jest.spyOn(Profile, 'findOne').mockRejectedValue(new Error('profile query failed'))

        const result = await promptengineering.getUserInfo('u1')

        expect(result).toBe('')
    })

    test('returns empty string when getInvestmentDocs throws unexpectedly', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: 'embedding api error' })
        })

        const result = await promptengineering.getInvestmentDocs('query')

        expect(result).toBe('')
    })

    test('handles getSFundInfo when risk level and savings filters are both skipped', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({ risk_tolerance: 'unknown', savings_balance: null })
        jest.spyOn(MutualFund, 'find').mockImplementation(() => ({
            limit: () => ({
                lean: async () => ([
                    {
                        fund_code: 'F999',
                        name: 'Conservative Fund',
                        nav: 10,
                        mer: 1,
                        risk: 'low',
                        fund_type: 'balanced',
                        minimum_investment: null,
                        '1yr': null,
                        '3yr': null,
                        '5yr': null,
                    }
                ])
            })
        }))

        const result = await promptengineering.getSFundInfo('u1', false)

        expect(result).toContain('Fund 1: Conservative Fund (F999)')
        expect(result).toContain('1yr: N/A, 3yr: N/A, 5yr: N/A')
        expect(result).not.toContain('Min Investment:')
    })

    test('skips distribution year output when all distribution fields are null', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({ risk_tolerance: 'high', savings_balance: 10000 })
        jest.spyOn(MutualFund, 'find').mockReturnValue({
            limit: () => ({
                lean: async () => ([
                    {
                        fund_code: 'F124',
                        name: 'Income Fund',
                        nav: 11,
                        mer: 1.1,
                        risk: 'medium',
                        fund_type: 'income',
                        '1yr': 5,
                        '3yr': 4,
                        '5yr': 3,
                        distribution: {
                            '2024': {
                                total: null,
                                capitalGains: null,
                                dividends: null,
                                interest: null,
                                returnCapital: null,
                                foreignDividends: null,
                                foreignTax: null,
                            }
                        }
                    }
                ])
            })
        })

        const result = await promptengineering.getSFundInfo('u1', true)

        expect(result).toContain('Distributions:')
        expect(result).not.toContain('2024:')
    })

    test('formats ETF output with N/A fallbacks when metrics are missing', async () => {
        jest.spyOn(etfHelpers, 'fetchAllETFs').mockResolvedValue([
            {
                symbol: 'XUU',
                shortName: 'US Total Market ETF',
                currency: 'CAD',
                exchange: 'TSX',
                regularMarketPrice: null,
                ytdReturn: null,
                trailingThreeMonthReturns: null,
                fiftyTwoWeekChangePercent: null,
                dividendYield: null,
                netAssets: null,
            }
        ])

        const result = await promptengineering.getSETFInfo(null)

        expect(result).toContain('ETF 1: US Total Market ETF (XUU)')
        expect(result).toContain('Price: N/A | YTD: N/A | 3mo: N/A | 1yr: N/A')
        expect(result).toContain('Yield: N/A | Net Assets: N/A')
    })

    test('returns empty string when user profile exists but has no populated fields', async () => {
        jest.spyOn(Profile, 'findOne').mockResolvedValue({})

        const result = await promptengineering.getUserInfo('u1')

        expect(result).toBe('')
    })
})
