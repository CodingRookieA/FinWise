import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { createChatService } from '../../services/chat/chatService.js'

describe('chatService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    function createFakeMongoose() {
        const objectId = Object.assign(
            jest.fn().mockImplementation((id) => id),
            { isValid: jest.fn().mockReturnValue(true) }
        )
        return { Types: { ObjectId: objectId } }
    }

    function buildService(overrides = {}) {
        const promptengineeringLib = {
            generatePrompt: jest.fn().mockResolvedValue([{ content: 'system' }, { content: 'user' }])
        }
        const classifyQueryFn = jest.fn().mockResolvedValue({
            needs_articles: false,
            needs_funds: false,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            is_continuation: false,
        })
        const MessageModel = {
            create: jest.fn(),
            aggregate: jest.fn(),
            exists: jest.fn(),
            find: jest.fn(),
            deleteMany: jest.fn(),
        }
        const ProfileModel = {
            findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
        }
        const randomUUIDFn = jest.fn().mockReturnValue('session-1')
        const aiClient = { generateAIResponse: jest.fn().mockResolvedValue('ai text') }
        const reconstructContinuityContextFn = jest.fn().mockResolvedValue({
            funds: [],
            chunks: [],
            etfs: [],
            hasContext: false,
        })
        const environment = {
            aiGeneralUrl: 'u',
            aiGeneralApiKey: 'k',
            aiMaxTokens: 1,
            aiTemperature: 0.1,
            historyTokenBudget: 750,
        }

        return {
            service: createChatService({
                promptengineeringLib,
                classifyQueryFn,
                MessageModel,
                ProfileModel,
                randomUUIDFn,
                aiClient,
                reconstructContinuityContextFn,
                environment,
                mongooseLib: createFakeMongoose(),
                ...overrides,
            }),
            deps: { promptengineeringLib, classifyQueryFn, MessageModel, ProfileModel, aiClient, reconstructContinuityContextFn }
        }
    }

    test('returns ai response without persistence for guest session', async () => {
        // Arrange
        const { service, deps } = buildService()

        // Act
        const result = await service.sendMessage({ message: 'hi', userId: null, sessionId: null, sessionUserId: null })

        // Assert
        expect(result.stored).toBe(false)
        expect(result.messageIds).toBeNull()
        expect(deps.MessageModel.create).not.toHaveBeenCalled()
        expect(deps.MessageModel.find).not.toHaveBeenCalled()
        expect(deps.classifyQueryFn).toHaveBeenCalledWith('hi', null, [])
    })

    test('stores user and ai messages for authenticated user', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.create
            .mockResolvedValueOnce({ _id: 'm1', sessionId: 'session-1' })
            .mockResolvedValueOnce({ _id: 'm2', sessionId: 'session-1' })

        // Act
        const result = await service.sendMessage({ message: 'hello', userId: 'u1', sessionId: null, sessionUserId: 'u1' })

        // Assert
        expect(result.stored).toBe(true)
        expect(result.messageIds).toEqual({ userMessage: 'm1', aiMessage: 'm2' })
        expect(deps.MessageModel.create).toHaveBeenCalledTimes(2)
    })

    test('loads and injects formatted history when sessionId is provided', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.promptengineeringLib.generatePrompt.mockResolvedValueOnce([
            { content: 'system' },
            { role: 'user', content: 'Old user message' },
            { role: 'model', content: 'Old AI message' },
            { content: 'current message' }
        ])
        deps.MessageModel.create
            .mockResolvedValueOnce({ _id: 'm1', sessionId: 's-existing' })
            .mockResolvedValueOnce({ _id: 'm2', sessionId: 's-existing' })

        const historyLean = jest.fn().mockResolvedValue([
            { role: 'user', content: 'Old user message' },
            { role: 'AI', content: 'Old AI message' }
        ])
        const historySelect = jest.fn().mockReturnValue({ lean: historyLean })
        const historySort = jest.fn().mockReturnValue({ select: historySelect })
        deps.MessageModel.find.mockReturnValue({ sort: historySort })

        // Act
        await service.sendMessage({ message: 'hello', userId: 'u1', sessionId: 's-existing', sessionUserId: 'u1' })

        // Assert
        expect(deps.MessageModel.find).toHaveBeenCalledWith({ sessionId: 's-existing' })
        expect(deps.classifyQueryFn).toHaveBeenCalledWith(
            'hello',
            null,
            [
                { role: 'user', content: 'Old user message' },
                { role: 'AI', content: 'Old AI message' }
            ]
        )
        expect(deps.promptengineeringLib.generatePrompt).toHaveBeenCalledWith(
            'hello',
            'u1',
            expect.any(Object),
            [
                { role: 'user', content: 'Old user message' },
                { role: 'model', content: 'Old AI message' }
            ]
        )
        expect(deps.aiClient.generateAIResponse).toHaveBeenCalledWith(
            expect.objectContaining({
                userPrompt: 'current message',
                conversationHistory: [
                    { role: 'user', content: 'Old user message' },
                    { role: 'model', content: 'Old AI message' }
                ]
            })
        )
    })

    test('formats user chat history from aggregate result', async () => {
        // Arrange
        const { service, deps } = buildService()
        const now = new Date('2026-01-01T00:00:00.000Z')
        deps.MessageModel.aggregate.mockResolvedValue([{ _id: 's1', latestMessage: { content: 'Hello world' }, messageCount: 2, lastUpdated: now }])

        // Act
        const result = await service.getUserChatHistory({ sessionUserId: 'u1' })

        // Assert
        expect(result).toHaveLength(1)
        expect(result[0].sessionId).toBe('s1')
        expect(deps.MessageModel.aggregate).toHaveBeenCalledTimes(1)
    })

    test('returns forbidden when session ownership check fails', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.exists.mockResolvedValue(false)

        // Act
        const result = await service.getSessionMessages({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result.forbidden).toBe(true)
        expect(deps.MessageModel.find).not.toHaveBeenCalled()
    })

    test('returns ordered session messages when ownership check passes', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.exists.mockResolvedValue(true)
        const select = jest.fn().mockResolvedValue([
            { role: 'user', content: 'Hi', createdAt: new Date('2026-01-01T00:00:00.000Z') },
            {
                role: 'AI',
                content: 'Short answer.\n\nRECOMMENDATIONS: {"CDZ.TO": "Reason text"}',
                createdAt: new Date('2026-01-01T00:01:00.000Z')
            }
        ])
        const sort = jest.fn().mockReturnValue({ select })
        deps.MessageModel.find.mockReturnValue({ sort })

        // Act
        const result = await service.getSessionMessages({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result.forbidden).toBe(false)
        expect(result.messages[0]).toMatchObject({ role: 'user', content: 'Hi' })
        expect(result.messages[1]).toMatchObject({ role: 'AI', content: 'Short answer.' })
        expect(deps.MessageModel.find).toHaveBeenCalledWith({ sessionId: 's1' })
    })

    test('deleteSession returns forbidden when ownership check fails', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.exists.mockResolvedValue(false)

        // Act
        const result = await service.deleteSession({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result).toEqual({ forbidden: true, notFound: false, deletedCount: 0 })
        expect(deps.MessageModel.deleteMany).not.toHaveBeenCalled()
    })

    test('deleteSession returns notFound when deleteMany removes nothing', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.exists.mockResolvedValue(true)
        deps.MessageModel.deleteMany.mockResolvedValue({ deletedCount: 0 })

        // Act
        const result = await service.deleteSession({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result).toEqual({ forbidden: false, notFound: true, deletedCount: 0 })
        expect(deps.MessageModel.deleteMany).toHaveBeenCalledWith(
            expect.objectContaining({ sessionId: 's1' })
        )
    })

    test('deleteSession returns success with deleted count', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.MessageModel.exists.mockResolvedValue(true)
        deps.MessageModel.deleteMany.mockResolvedValue({ deletedCount: 3 })

        // Act
        const result = await service.deleteSession({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result).toEqual({ forbidden: false, notFound: false, deletedCount: 3 })
    })

    test('continuity merge preserves prefetched context and fetches only missing required types', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.classifyQueryFn.mockResolvedValueOnce({
            needs_articles: false,
            needs_funds: true,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            is_continuation: true,
        })

        const historyLean = jest.fn().mockResolvedValue([
            { role: 'user', content: 'recommend ETFs' },
            { role: 'AI', content: 'I recommend CDZ.TO' }
        ])
        const historySelect = jest.fn().mockReturnValue({ lean: historyLean })
        const historySort = jest.fn().mockReturnValue({ select: historySelect })
        deps.MessageModel.find.mockReturnValue({ sort: historySort })

        deps.reconstructContinuityContextFn.mockResolvedValueOnce({
            funds: [{ fund_code: 'RBF1035', name: 'Fund' }],
            chunks: [],
            etfs: [{ symbol: 'CDZ.TO', name: 'ETF' }],
            hasContext: true,
        })

        // Act
        await service.sendMessage({ message: 'recommend me mutual funds too', userId: 'u1', sessionId: 's-existing', sessionUserId: null })

        // Assert
        expect(deps.promptengineeringLib.generatePrompt).toHaveBeenCalledWith(
            'recommend me mutual funds too',
            'u1',
            expect.objectContaining({
                _prefetchedEtfs: [{ symbol: 'CDZ.TO', name: 'ETF' }],
                _prefetchedFunds: [{ fund_code: 'RBF1035', name: 'Fund' }],
                needs_funds: false,
                needs_etfs: false,
                needs_articles: false,
            }),
            expect.any(Array)
        )
    })

    test('continuity resets on prior-only ETF context with new-only mutual-fund query', async () => {
        // Arrange
        const { service, deps } = buildService()
        deps.classifyQueryFn.mockResolvedValueOnce({
            needs_articles: false,
            needs_funds: true,
            needs_etfs: false,
            needs_distribution_mutual_funds: false,
            is_continuation: true,
        })

        const historyLean = jest.fn().mockResolvedValue([
            { role: 'user', content: 'recommend ETFs' },
            { role: 'AI', content: 'I recommend CDZ.TO' }
        ])
        const historySelect = jest.fn().mockReturnValue({ lean: historyLean })
        const historySort = jest.fn().mockReturnValue({ select: historySelect })
        deps.MessageModel.find.mockReturnValue({ sort: historySort })

        deps.reconstructContinuityContextFn.mockResolvedValueOnce({
            funds: [],
            chunks: [],
            etfs: [{ symbol: 'CDZ.TO', name: 'ETF' }],
            hasContext: true,
        })

        // Act
        await service.sendMessage({ message: 'recommend me mutual funds too', userId: 'u1', sessionId: 's-existing', sessionUserId: null })

        // Assert
        expect(deps.promptengineeringLib.generatePrompt).toHaveBeenCalledWith(
            'recommend me mutual funds too',
            'u1',
            expect.not.objectContaining({ _prefetchedEtfs: expect.anything() }),
            expect.any(Array)
        )
    })
})
