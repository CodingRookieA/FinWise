import { describe, test, expect, jest, beforeEach, afterAll, afterEach } from '@jest/globals'
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
        })
        const MessageModel = {
            create: jest.fn(),
            aggregate: jest.fn(),
            exists: jest.fn(),
            find: jest.fn(),
        }
        const ProfileModel = {
            findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) })
        }
        const randomUUIDFn = jest.fn().mockReturnValue('session-1')
        const aiClient = { generateAIResponse: jest.fn().mockResolvedValue('ai text') }
        const environment = { aiGeneralUrl: 'u', aiGeneralApiKey: 'k', aiMaxTokens: 1, aiTemperature: 0.1 }

        return {
            service: createChatService({
                promptengineeringLib,
                classifyQueryFn,
                MessageModel,
                ProfileModel,
                randomUUIDFn,
                aiClient,
                environment,
                mongooseLib: createFakeMongoose(),
                ...overrides,
            }),
            deps: { promptengineeringLib, classifyQueryFn, MessageModel, ProfileModel, aiClient }
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
            { role: 'user', content: 'Hi', createdAt: new Date('2026-01-01T00:00:00.000Z') }
        ])
        const sort = jest.fn().mockReturnValue({ select })
        deps.MessageModel.find.mockReturnValue({ sort })

        // Act
        const result = await service.getSessionMessages({ sessionId: 's1', sessionUserId: 'u1' })

        // Assert
        expect(result.forbidden).toBe(false)
        expect(result.messages[0]).toMatchObject({ role: 'user', content: 'Hi' })
        expect(deps.MessageModel.find).toHaveBeenCalledWith({ sessionId: 's1' })
    })
})
