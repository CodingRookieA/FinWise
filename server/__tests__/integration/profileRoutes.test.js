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

    test('returns 200 when patchProfile succeeds', async () => {
        const fakeService = {
            patchProfile: jest.fn().mockResolvedValue({ userId: 'u1', risk_tolerance: 'medium' })
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).patch('/api/profile').send({ risk_tolerance: 'medium' })

        expect(res.status).toBe(200)
        expect(res.body.risk_tolerance).toBe('medium')
        expect(fakeService.patchProfile).toHaveBeenCalledWith('u1', { risk_tolerance: 'medium' })
    })

    test('returns 500 when patchProfile throws unexpected error', async () => {
        const fakeService = {
            patchProfile: jest.fn().mockRejectedValue(new Error('database down'))
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).patch('/api/profile').send({ risk_tolerance: 'high' })

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to update profile.')
    })

    test('returns 200 for questionnaire endpoint success', async () => {
        const fakeService = {
            getRandomUnanswered: jest.fn().mockResolvedValue([{ field: 'risk_tolerance', prompt: 'Question?' }])
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).get('/api/profile/questionnaire')

        expect(res.status).toBe(200)
        expect(Array.isArray(res.body)).toBe(true)
        expect(fakeService.getRandomUnanswered).toHaveBeenCalledWith('u1')
    })

    test('returns 500 for questionnaire endpoint failure', async () => {
        const fakeService = {
            getRandomUnanswered: jest.fn().mockRejectedValue(new Error('cannot build questions'))
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).get('/api/profile/questionnaire')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to pick questions.')
    })

    test('returns 200 for meta endpoint success', async () => {
        const fakeService = {
            getAllFields: jest.fn().mockReturnValue({ total: 2, fields: ['risk_tolerance', 'financial_goal'] })
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).get('/api/profile/meta')

        expect(res.status).toBe(200)
        expect(res.body.total).toBe(2)
    })

    test('returns 500 for meta endpoint failure', async () => {
        const fakeService = {
            getAllFields: jest.fn().mockImplementation(() => {
                throw new Error('metadata failure')
            })
        }
        const app = createApp({
            profileController: createProfileController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).get('/api/profile/meta')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe('Failed to get questions.')
    })
})
