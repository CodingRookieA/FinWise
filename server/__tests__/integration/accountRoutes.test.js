import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createAccountController } from '../../controllers/account.js'

describe('account routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    // ========== Signup Tests ==========
    test('returns 400 for missing signup fields', async () => {
        // Arrange
        const fakeService = {}
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).post('/api/users/localSignup').send({})

        // Assert
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('returns 400 when signup missing email', async () => {
        const fakeService = {}
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        const res = await request(app).post('/api/users/localSignup').send({ name: 'User', password: 'pw' })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Email')
    })

    test('returns 400 when signup missing name', async () => {
        const fakeService = {}
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        const res = await request(app).post('/api/users/localSignup').send({ email: 'user@example.com', password: 'pw' })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Email')
    })

    test('returns 201 for successful local signup', async () => {
        const fakeService = {
            localSignup: jest.fn().mockResolvedValue({
                user: { _id: 'u1', email: 'user@example.com' },
                response: { message: 'Successfully registered' }
            })
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/localSignup').send({
            email: 'user@example.com',
            name: 'User',
            password: 'password123'
        })

        expect(res.status).toBe(201)
        expect(res.body.message).toContain('Successfully')
        expect(fakeService.localSignup).toHaveBeenCalledWith({
            email: 'user@example.com',
            name: 'User',
            password: 'password123'
        })
    })

    test('returns 400 for signup with service status error', async () => {
        const error = new Error('Email already registered')
        error.status = 400
        const fakeService = {
            localSignup: jest.fn().mockRejectedValue(error)
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/localSignup').send({
            email: 'existing@example.com',
            name: 'User',
            password: 'pw'
        })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('already registered')
    })

    test('returns 500 for signup with service error without status', async () => {
        const fakeService = {
            localSignup: jest.fn().mockRejectedValue(new Error('Database error'))
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/localSignup').send({
            email: 'user@example.com',
            name: 'User',
            password: 'pw'
        })

        expect(res.status).toBe(500)
        expect(res.body.error).toContain('error occurred')
    })

    // ========== Login Tests ==========
    test('returns 400 for missing login fields', async () => {
        const fakeService = {}
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        const res = await request(app).post('/api/users/localLogin').send({})

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Email')
    })

    test('returns 400 when login missing password', async () => {
        const fakeService = {}
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        const res = await request(app).post('/api/users/localLogin').send({ email: 'user@example.com' })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('password')
    })

    test('returns 201 for successful local login', async () => {
        const fakeService = {
            localLogin: jest.fn().mockResolvedValue({
                user: { _id: 'u1', email: 'user@example.com' },
                response: { message: 'Logged in successfully' }
            })
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/localLogin').send({
            email: 'user@example.com',
            password: 'password123'
        })

        expect(res.status).toBe(201)
        expect(fakeService.localLogin).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'password123'
        })
    })

    test('returns 401 for invalid login credentials', async () => {
        const error = new Error('Invalid credentials')
        error.status = 401
        const fakeService = {
            localLogin: jest.fn().mockRejectedValue(error)
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/localLogin').send({
            email: 'user@example.com',
            password: 'wrongpassword'
        })

        expect(res.status).toBe(401)
        expect(res.body.error).toContain('Invalid')
    })

    // ========== Google Login Tests ==========
    test('returns 200 for successful google login', async () => {
        const fakeService = {
            googleLogin: jest.fn().mockResolvedValue({
                user: { _id: 'u1', email: 'user@gmail.com' },
                response: { message: 'Logged in with Google' }
            })
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/googleLogin').send({ code: 'auth-code-123' })

        expect(res.status).toBe(200)
        expect(fakeService.googleLogin).toHaveBeenCalledWith('auth-code-123')
    })

    test('returns 400 for invalid google auth code', async () => {
        const error = new Error('Invalid auth code')
        error.status = 400
        const fakeService = {
            googleLogin: jest.fn().mockRejectedValue(error)
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/googleLogin').send({ code: 'invalid-code' })

        expect(res.status).toBe(400)
        expect(res.body.error).toContain('Invalid')
    })

    test('returns 500 for google login service error', async () => {
        const fakeService = {
            googleLogin: jest.fn().mockRejectedValue(new Error('Google API error'))
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).post('/api/users/googleLogin').send({ code: 'code' })

        expect(res.status).toBe(500)
        expect(res.body.error).toContain('logging in with Google')
    })

    // ========== Check User Auth Tests ==========
    test('returns 200 for checkUserAuth when service succeeds', async () => {
        // Arrange
        const fakeService = { checkUserAuth: jest.fn().mockReturnValue({ userId: 'u1' }) }
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).get('/api/users/checkUserAuth')

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.userId).toBe('u1')
    })

    test('returns 401 for checkUserAuth when service throws unauthorized', async () => {
        // Arrange
        const error = new Error('User not authenticated')
        error.status = 401
        const fakeService = { checkUserAuth: jest.fn().mockImplementation(() => { throw error }) }
        const app = createApp({ accountController: createAccountController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).get('/api/users/checkUserAuth')

        // Assert
        expect(res.status).toBe(401)
        expect(res.body.error).toBe('User not authenticated')
    })

    test('returns 500 for checkUserAuth with service error', async () => {
        const fakeService = {
            checkUserAuth: jest.fn().mockImplementation(() => {
                throw new Error('Database error')
            })
        }
        const app = createApp({
            accountController: createAccountController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = {}; next(); }
        })

        const res = await request(app).get('/api/users/checkUserAuth')

        expect(res.status).toBe(500)
        expect(res.body.error).toContain('error occurred')
    })
})
