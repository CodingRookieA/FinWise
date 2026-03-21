import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createProfileController } from '../../controllers/profile.js'

describe('profile routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns 401 when auth middleware blocks request', async () => {
        // Arrange
        const fakeService = {}
        const app = createApp({ profileController: createProfileController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).get('/api/profile')

        // Assert
        expect(res.status).toBe(401)
        expect(res.body.message).toBe('Unauthorized - please log in')
    })

    test('returns 200 for successful profile fetch', async () => {
        // Arrange
        const fakeService = { getProfile: jest.fn().mockResolvedValue({ userId: 'u1' }) }
        const app = createApp({ profileController: createProfileController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).get('/api/profile')

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.userId).toBe('u1')
    })

    test('returns 400 when patch has no valid fields', async () => {
        // Arrange
        const invalid = new Error('No valid fields provided.')
        invalid.status = 400
        const fakeService = { patchProfile: jest.fn().mockRejectedValue(invalid) }
        const app = createApp({ profileController: createProfileController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).patch('/api/profile').send({ bad: 1 })

        // Assert
        expect(res.status).toBe(400)
        expect(res.body.error).toBe('No valid fields provided.')
    })

    test('returns 500 when profile retrieval throws unexpected error', async () => {
        // Arrange
        const fakeService = { getProfile: jest.fn().mockRejectedValue(new Error('boom')) }
        const app = createApp({ profileController: createProfileController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).get('/api/profile')

        // Assert
        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to get profile.')
    })
})
