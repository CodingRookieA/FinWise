import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createChatController } from '../../controllers/chatController.js'

describe('chat routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns 400 when message is missing', async () => {
        // Arrange
        const fakeService = {}
        const app = createApp({ chatController: createChatController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/chat/send').send({})

        // Assert
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Message is required')
    })

    test('returns 200 and expected response shape on send success', async () => {
        // Arrange
        const fakeService = {
            sendMessage: jest.fn().mockResolvedValue({ success: true, response: 'mocked', stored: false, messageIds: null })
        }
        const app = createApp({ chatController: createChatController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/chat/send').send({ message: 'hi' })

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body).toHaveProperty('response', 'mocked')
    })

    test('returns 403 when session ownership check fails', async () => {
        // Arrange
        const fakeService = {
            getSessionMessages: jest.fn().mockResolvedValue({ forbidden: true, messages: [] })
        }
        const app = createApp({ chatController: createChatController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); } })

        // Act
        const res = await request(app).get('/api/chat/session/s1')

        // Assert
        expect(res.status).toBe(403)
        expect(res.body.error).toBe('You do not have access to this session')
    })

    test('returns 500 when sendMessage fails unexpectedly', async () => {
        // Arrange
        const fakeService = { sendMessage: jest.fn().mockRejectedValue(new Error('boom')) }
        const app = createApp({ chatController: createChatController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/chat/send').send({ message: 'hi' })

        // Assert
        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('error', 'Failed to process message')
    })

    test('returns 200 with empty object for history when user is not logged in', async () => {
        const fakeService = { getUserChatHistory: jest.fn() }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).get('/api/chat/history')

        expect(res.status).toBe(200)
        expect(res.body).toEqual({})
        expect(fakeService.getUserChatHistory).not.toHaveBeenCalled()
    })

    test('returns 400 for history when session userId format is invalid', async () => {
        const fakeService = { getUserChatHistory: jest.fn() }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'not-an-object-id' }; next(); }
        })

        const res = await request(app).get('/api/chat/history')

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid user ID format')
    })

    test('returns 200 with sessions for history success', async () => {
        const fakeService = {
            getUserChatHistory: jest.fn().mockResolvedValue([{ sessionId: 's1', title: 'My Chat' }])
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).get('/api/chat/history')

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.sessions).toHaveLength(1)
    })

    test('returns 500 for history when service throws', async () => {
        const fakeService = {
            getUserChatHistory: jest.fn().mockRejectedValue(new Error('history failed'))
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).get('/api/chat/history')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to fetch user chat history')
    })

    test('returns 400 when session messages userId format is invalid', async () => {
        const fakeService = { getSessionMessages: jest.fn() }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'invalid' }; next(); }
        })

        const res = await request(app).get('/api/chat/session/s1')

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Invalid user ID format')
    })

    test('returns 200 with session messages on success', async () => {
        const fakeService = {
            getSessionMessages: jest.fn().mockResolvedValue({ forbidden: false, messages: [{ message: 'hi' }] })
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).get('/api/chat/session/s1')

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.messages).toHaveLength(1)
    })

    test('returns 500 when session messages retrieval throws', async () => {
        const fakeService = {
            getSessionMessages: jest.fn().mockRejectedValue(new Error('session fetch failed'))
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).get('/api/chat/session/s1')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to fetch session messages')
    })

    test('deletes session successfully', async () => {
        const fakeService = {
            deleteSession: jest.fn().mockResolvedValue({ forbidden: false, notFound: false, deletedCount: 2 })
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).delete('/api/chat/session/s1')

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.deletedCount).toBe(2)
    })

    test('returns 401 when deleting session without login', async () => {
        const fakeService = { deleteSession: jest.fn() }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).delete('/api/chat/session/s1')

        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Authentication required')
        expect(fakeService.deleteSession).not.toHaveBeenCalled()
    })

    test('returns 403 when deleting forbidden session', async () => {
        const fakeService = {
            deleteSession: jest.fn().mockResolvedValue({ forbidden: true, notFound: false, deletedCount: 0 })
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).delete('/api/chat/session/s1')

        expect(res.status).toBe(403)
        expect(res.body.error).toBe('You do not have access to this session')
    })

    test('returns 404 when deleting non-existent session', async () => {
        const fakeService = {
            deleteSession: jest.fn().mockResolvedValue({ forbidden: false, notFound: true, deletedCount: 0 })
        }
        const app = createApp({
            chatController: createChatController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: '507f1f77bcf86cd799439011' }; next(); }
        })

        const res = await request(app).delete('/api/chat/session/s1')

        expect(res.status).toBe(404)
        expect(res.body.error).toBe('Session not found')
    })
})
