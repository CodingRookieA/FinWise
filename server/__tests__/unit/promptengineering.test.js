import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import promptengineering from '../../helpers/promptengineering.js'

describe('promptengineering', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('builds full prompt with all context sections', async () => {
        // Arrange
        jest.spyOn(promptengineering, 'getUserInfo').mockResolvedValue('Employment status: employed')
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
        expect(messages[0].content).toContain('--- ARTICLE CONTEXT')
        expect(messages[0].content).toContain('--- MATCHING MUTUAL FUNDS')
        expect(messages[0].content).toContain('--- MATCHING ETFs')
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
    })
})
