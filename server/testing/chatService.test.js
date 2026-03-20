import { jest } from '@jest/globals'
import { createChatService } from '../services/chat/chatService.js'

describe('chatService', () => {
    const basePrompt = [
        { role: 'system', content: 'SYSTEM' },
        { role: 'user', content: 'USER' }
    ]

    function buildService(overrides = {}) {
        const promptengineeringLib = {
            generatePrompt: jest.fn().mockResolvedValue(basePrompt)
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
            findOne: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
            })
        }

        const randomUUIDFn = jest.fn().mockReturnValue('session-123')

        const mongooseLib = {
            Types: {
                ObjectId: {
                    isValid: jest.fn().mockReturnValue(true)
                }
            }
        }

        const environment = {
            aiGeneralUrl: 'https://ai.example.com',
            aiGeneralApiKey: 'key',
            aiMaxTokens: 100,
            aiTemperature: 0.5,
        }

        const aiClient = {
            generateAIResponse: jest.fn().mockResolvedValue('AI response')
        }

        const deps = {
            promptengineeringLib,
            classifyQueryFn,
            MessageModel,
            ProfileModel,
            randomUUIDFn,
            mongooseLib,
            environment,
            aiClient,
            ...overrides,
        }

        return { service: createChatService(deps), deps }
    }

    test('sendMessage returns AI response without storing for guests', async () => {
        const { service, deps } = buildService()

        const result = await service.sendMessage({
            message: 'Hi',
            userId: null,
            sessionId: null,
            sessionUserId: null,
        })

        expect(deps.classifyQueryFn).toHaveBeenCalled()
        expect(deps.promptengineeringLib.generatePrompt).toHaveBeenCalled()
        expect(deps.aiClient.generateAIResponse).toHaveBeenCalled()
        expect(deps.MessageModel.create).not.toHaveBeenCalled()
        expect(result).toEqual({
            success: true,
            response: 'AI response',
            stored: false,
            sessionId: undefined,
            messageIds: null,
        })
    })

    test('sendMessage stores messages when session user exists', async () => {
        const { service, deps } = buildService()

        deps.MessageModel.create.mockImplementation(async payload => {
            if (payload.role === 'user') {
                return { _id: 'user-msg', sessionId: payload.sessionId }
            }
            return { _id: 'ai-msg', sessionId: payload.sessionId }
        })

        const result = await service.sendMessage({
            message: 'Hello',
            userId: 'user-1',
            sessionId: null,
            sessionUserId: 'user-1',
        })

        expect(deps.MessageModel.create).toHaveBeenCalledTimes(2)
        expect(result).toEqual({
            success: true,
            response: 'AI response',
            stored: true,
            sessionId: 'session-123',
            messageIds: {
                userMessage: 'user-msg',
                aiMessage: 'ai-msg',
            }
        })
    })

    test('getUserChatHistory formats sessions', async () => {
        const { service, deps } = buildService()

        const date = new Date('2025-01-01T00:00:00.000Z')
        deps.MessageModel.aggregate.mockResolvedValue([
            {
                _id: 'session-1',
                latestMessage: { content: 'Hello world', createdAt: date },
                messageCount: 2,
                lastUpdated: date,
            }
        ])

        const sessions = await service.getUserChatHistory({ sessionUserId: 'user-1' })

        expect(sessions).toEqual([
            {
                sessionId: 'session-1',
                title: 'Hello world',
                date: date.toLocaleDateString(),
                messageCount: 2,
            }
        ])
    })

    test('getSessionMessages blocks unauthorized session access', async () => {
        const { service, deps } = buildService()

        deps.MessageModel.exists.mockResolvedValue(false)

        const result = await service.getSessionMessages({
            sessionId: 'session-1',
            sessionUserId: 'user-1'
        })

        expect(result).toEqual({ forbidden: true, messages: [] })
    })

    test('getSessionMessages returns message list for authorized user', async () => {
        const { service, deps } = buildService()

        deps.MessageModel.exists.mockResolvedValue(true)

        const selectMock = jest.fn().mockResolvedValue([
            { role: 'user', content: 'Hi', createdAt: new Date('2025-01-02T00:00:00.000Z') },
            { role: 'AI', content: 'Hello', createdAt: new Date('2025-01-02T00:00:01.000Z') },
        ])
        const sortMock = jest.fn().mockReturnValue({ select: selectMock })
        deps.MessageModel.find.mockReturnValue({ sort: sortMock })

        const result = await service.getSessionMessages({
            sessionId: 'session-1',
            sessionUserId: 'user-1'
        })

        expect(result.forbidden).toBe(false)
        expect(result.messages).toHaveLength(2)
        expect(result.messages[0]).toMatchObject({ role: 'user', content: 'Hi' })
    })
})
