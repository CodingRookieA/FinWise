import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createAssetController } from '../../controllers/assetController.js'

describe('asset routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns 401 when auth middleware blocks unauthenticated request', async () => {
        // Arrange
        const fakeService = {}
        const app = createApp({ assetController: createAssetController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = {}; next(); } })

        // Act
        const res = await request(app).get('/api/assets')

        // Assert
        expect(res.status).toBe(401)
        expect(res.body).toHaveProperty('message', 'Unauthorized - please log in')
    })

    test('returns 200 and response body for successful create', async () => {
        // Arrange
        const fakeService = { addAsset: jest.fn().mockResolvedValue({ symbol: 'VFV' }) }
        const app = createApp({ assetController: createAssetController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).post('/api/assets').send({ symbol: 'VFV', quantity: 1 })

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.symbol).toBe('VFV')
    })

    test('returns 404 when update target is missing', async () => {
        // Arrange
        const error = new Error('Asset not found')
        error.status = 404
        const fakeService = { updateAsset: jest.fn().mockRejectedValue(error) }
        const app = createApp({ assetController: createAssetController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).put('/api/assets/missing').send({ quantity: 2 })

        // Assert
        expect(res.status).toBe(404)
        expect(res.body.message).toBe('Asset not found')
    })

    test('returns 500 when getAssets fails unexpectedly', async () => {
        // Arrange
        const fakeService = { getAssets: jest.fn().mockRejectedValue(new Error('boom')) }
        const app = createApp({ assetController: createAssetController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).get('/api/assets')

        // Assert
        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('message')
    })

    test('returns 200 for CSV upload when service succeeds', async () => {
        // Arrange
        const fakeService = {
            uploadCSV: jest.fn().mockResolvedValue({ message: 'CSV processed successfully', added: 1, skipped: 0 })
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        // Act
        const res = await request(app)
            .post('/api/assets/upload')
            .attach('csvFile', Buffer.from('ticker,shares\nVFV,1'), 'holdings.csv')

        // Assert
        expect(res.status).toBe(200)
        expect(res.body).toEqual({ message: 'CSV processed successfully', added: 1, skipped: 0 })
        expect(fakeService.uploadCSV).toHaveBeenCalledTimes(1)
    })
})
