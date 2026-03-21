import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createEmailController } from '../../controllers/email.js'

describe('email routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns 200 when verifyEmail succeeds', async () => {
        // Arrange
        const fakeService = { verifyEmailToken: jest.fn().mockResolvedValue({ user: { _id: 'u1' }, response: { message: 'Successfully verified email' } }) }
        const app = createApp({ emailController: createEmailController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/email/verifyEmail/token')

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Successfully verified email')
    })

    test('returns 201 when sendVerificationEmail succeeds', async () => {
        // Arrange
        const fakeService = { sendVerification: jest.fn().mockResolvedValue({ message: 'Verification email sent' }) }
        const app = createApp({ emailController: createEmailController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).post('/api/email/sendVerificationEmail')

        // Assert
        expect(res.status).toBe(201)
        expect(res.body.message).toBe('Verification email sent')
    })

    test('returns 401 when sendVerificationEmail is called without login', async () => {
        // Arrange
        const unauthorized = new Error('Not logged in')
        unauthorized.status = 401
        const fakeService = { sendVerification: jest.fn().mockRejectedValue(unauthorized) }
        const app = createApp({ emailController: createEmailController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/email/sendVerificationEmail')

        // Assert
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('Not logged in')
    })
})
