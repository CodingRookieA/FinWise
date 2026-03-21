import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createAccountController } from '../../controllers/account.js'

describe('account routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

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
})
