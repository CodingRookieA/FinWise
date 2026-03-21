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
})
