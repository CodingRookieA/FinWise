import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import request from 'supertest'
import { createApp } from '../../app.js'
import { createAssetController } from '../../controllers/assetController.js'

describe('asset routes', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    // ========== GET /api/assets Tests ==========
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

    test('returns 200 with asset list when authenticated', async () => {
        // Arrange
        const mockAssets = [
            { symbol: 'VFV', quantity: 10, type: 'ETF' },
            { symbol: 'XIC', quantity: 5, type: 'ETF' }
        ]
        const fakeService = { getAssets: jest.fn().mockResolvedValue(mockAssets) }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        // Act
        const res = await request(app).get('/api/assets')

        // Assert
        expect(res.status).toBe(200)
        expect(res.body).toEqual(mockAssets)
        expect(fakeService.getAssets).toHaveBeenCalledWith('u1')
    })

    test('returns 500 when getAssets fails unexpectedly', async () => {
        // Arrange
        const fakeService = { getAssets: jest.fn().mockRejectedValue(new Error('Database error')) }
        const app = createApp({ assetController: createAssetController(fakeService), sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); } })

        // Act
        const res = await request(app).get('/api/assets')

        // Assert
        expect(res.status).toBe(500)
        expect(res.body).toHaveProperty('message')
    })

    // ========== POST /api/assets Tests ==========
    test('returns 400 when addAsset missing required fields', async () => {
        const fakeService = {}
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).post('/api/assets').send({ symbol: 'VFV' })

        expect(res.status).toBe(400)
        expect(res.body.message).toContain('include')
    })

    test('returns 200 and asset data for successful addAsset', async () => {
        // Arrange
        const fakeService = { addAsset: jest.fn().mockResolvedValue({ symbol: 'VFV', quantity: 1, type: 'ETF' }) }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        // Act
        const res = await request(app)
            .post('/api/assets')
            .send({ symbol: 'VFV', quantity: 1, type: 'ETF' })

        // Assert
        expect(res.status).toBe(200)
        expect(res.body.symbol).toBe('VFV')
        expect(fakeService.addAsset).toHaveBeenCalledWith({
            userId: 'u1',
            symbol: 'VFV',
            quantity: 1,
            type: 'ETF'
        })
    })

    test('returns 400 when addAsset service returns status error', async () => {
        const error = new Error('Invalid ETF symbol')
        error.status = 400
        const fakeService = { addAsset: jest.fn().mockRejectedValue(error) }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .post('/api/assets')
            .send({ symbol: 'INVALID', quantity: 1 })

        expect(res.status).toBe(400)
        expect(res.body.message).toContain('Invalid')
    })

    test('returns 400 for addAsset with service error without status', async () => {
        const fakeService = {
            addAsset: jest.fn().mockRejectedValue(new Error('Unexpected error'))
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .post('/api/assets')
            .send({ symbol: 'VFV', quantity: 1 })

        expect(res.status).toBe(400)
        expect(res.body.message).toBeDefined()
    })

    // ========== PUT /api/assets/:id Tests ==========
    test('returns 200 for successful updateAsset', async () => {
        const fakeService = {
            updateAsset: jest.fn().mockResolvedValue({ _id: 'a1', symbol: 'VFV', quantity: 20 })
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .put('/api/assets/a1')
            .send({ quantity: 20 })

        expect(res.status).toBe(200)
        expect(res.body.quantity).toBe(20)
        expect(fakeService.updateAsset).toHaveBeenCalledWith('a1', { quantity: 20 })
    })

    test('returns 404 when updateAsset target is missing', async () => {
        // Arrange
        const error = new Error('Asset not found')
        error.status = 404
        const fakeService = { updateAsset: jest.fn().mockRejectedValue(error) }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        // Act
        const res = await request(app)
            .put('/api/assets/missing')
            .send({ quantity: 2 })

        // Assert
        expect(res.status).toBe(404)
        expect(res.body.message).toBe('Asset not found')
    })

    test('returns 400 for updateAsset with service error', async () => {
        const fakeService = {
            updateAsset: jest.fn().mockRejectedValue(new Error('Invalid update'))
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .put('/api/assets/a1')
            .send({ quantity: 0 })

        expect(res.status).toBe(400)
    })

    // ========== DELETE /api/assets/:id Tests ==========
    test('returns 200 for successful deleteAsset', async () => {
        const fakeService = {
            deleteAsset: jest.fn().mockResolvedValue({ message: 'Asset deleted successfully' })
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).delete('/api/assets/a1')

        expect(res.status).toBe(200)
        expect(res.body.message).toContain('deleted')
        expect(fakeService.deleteAsset).toHaveBeenCalledWith('a1')
    })

    test('returns 404 when deleteAsset target is missing', async () => {
        const error = new Error('Asset not found')
        error.status = 404
        const fakeService = {
            deleteAsset: jest.fn().mockRejectedValue(error)
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).delete('/api/assets/missing')

        expect(res.status).toBe(404)
        expect(res.body.message).toBe('Asset not found')
    })

    test('returns 400 for deleteAsset with service error', async () => {
        const fakeService = {
            deleteAsset: jest.fn().mockRejectedValue(new Error('Cannot delete'))
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app).delete('/api/assets/a1')

        expect(res.status).toBe(400)
    })

    // ========== POST /api/assets/upload Tests ==========
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
    test('returns 400 for CSV upload when file is missing', async () => {
        // Arrange
        const fakeService = { uploadCSV: jest.fn() }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        // Act
        const res = await request(app)
            .post('/api/assets/upload')

        // Assert
        expect(res.status).toBe(400)
        expect(res.body.message).toBe('No CSV file uploaded')
        expect(fakeService.uploadCSV).not.toHaveBeenCalled()
    })

    test('returns 400 for CSV upload with service status error', async () => {
        const error = new Error('Unsupported broker')
        error.status = 400
        const fakeService = {
            uploadCSV: jest.fn().mockRejectedValue(error)
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .post('/api/assets/upload')
            .attach('csvFile', Buffer.from('invalid'), 'file.csv')

        expect(res.status).toBe(400)
        expect(res.body.message).toContain('Unsupported')
    })

    test('returns 500 for CSV upload with service error', async () => {
        const fakeService = {
            uploadCSV: jest.fn().mockRejectedValue(new Error('Unexpected error'))
        }
        const app = createApp({
            assetController: createAssetController(fakeService),
            sessionMiddleware: (req, _res, next) => { req.session = { userId: 'u1' }; next(); }
        })

        const res = await request(app)
            .post('/api/assets/upload')
            .attach('csvFile', Buffer.from('data'), 'file.csv')

        expect(res.status).toBe(500)
        expect(res.body.message).toBeDefined()
    })
})
