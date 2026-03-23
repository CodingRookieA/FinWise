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

    test('returns 400 when verifyEmailToken service returns status error', async () => {
        const invalidToken = new Error('Token is invalid or expired')
        invalidToken.status = 400
        const fakeService = { verifyEmailToken: jest.fn().mockRejectedValue(invalidToken) }
        const app = createApp({
            emailController: createEmailController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/email/verifyEmail/bad-token')

        expect(res.status).toBe(400)
        expect(res.body.error).toBe('Token is invalid or expired')
    })

    test('returns 500 when verifyEmailToken throws unexpected error', async () => {
        const fakeService = { verifyEmailToken: jest.fn().mockRejectedValue(new Error('db failed')) }
        const app = createApp({
            emailController: createEmailController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/email/verifyEmail/token')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('An error occurred while verifying email')
    })

    test('returns 500 when sendVerificationEmail throws unexpected error', async () => {
        const fakeService = { sendVerification: jest.fn().mockRejectedValue(new Error('mail provider down')) }
        const app = createApp({
            emailController: createEmailController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).post('/api/email/sendVerificationEmail')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('An error occurred while sending verification email')
    })
})
