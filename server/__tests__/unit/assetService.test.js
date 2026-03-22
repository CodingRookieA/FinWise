import { describe, test, expect, jest, beforeEach, afterAll, afterEach } from '@jest/globals'
import { createAssetService } from '../../services/asset/assetService.js'

describe('assetService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('returns user assets on getAssets', async () => {
        // Arrange
        const fakeAssetModel = { find: jest.fn().mockResolvedValue([{ symbol: 'VFV' }]) }
        const service = createAssetService({ AssetModel: fakeAssetModel })

        // Act
        const result = await service.getAssets('u1')

        // Assert
        expect(result).toHaveLength(1)
        expect(fakeAssetModel.find).toHaveBeenCalledWith({ user_id: 'u1' })
    })

    test('creates a new asset when symbol is valid and not existing', async () => {
        // Arrange
        const fakeAssetModel = {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ symbol: 'VFV', quantity: 2 })
        }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        const result = await service.addAsset({ userId: 'u1', symbol: 'vfv', quantity: '2' })

        // Assert
        expect(result.symbol).toBe('VFV')
        expect(fakeAssetModel.create).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'VFV', type: 'ETF', quantity: 2 })
    })

    test('creates a mutual fund without ETF symbol validation', async () => {
        // Arrange
        const fakeAssetModel = {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ symbol: 'TDB900', quantity: 1.5, type: 'Mutual Fund' })
        }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn() }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        const result = await service.addAsset({ userId: 'u1', symbol: 'tdb900', quantity: '1.5', type: 'Mutual Fund' })

        // Assert
        expect(result.type).toBe('Mutual Fund')
        expect(fakeEtfHelpers.isValidCanadianETF).not.toHaveBeenCalled()
        expect(fakeAssetModel.create).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'TDB900', type: 'Mutual Fund', quantity: 1.5 })
    })

    test('defaults unknown type to ETF and validates symbol', async () => {
        // Arrange
        const fakeAssetModel = {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ symbol: 'VFV', quantity: 1, type: 'ETF' })
        }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        const result = await service.addAsset({ userId: 'u1', symbol: 'vfv', quantity: 1, type: 'Stock' })

        // Assert
        expect(result.type).toBe('ETF')
        expect(fakeEtfHelpers.isValidCanadianETF).toHaveBeenCalledWith('VFV')
    })

    test('rejects non-positive quantity for addAsset', async () => {
        // Arrange
        const service = createAssetService({ AssetModel: {}, etfHelperLib: {} })

        // Act
        const action = service.addAsset({ userId: 'u1', symbol: 'VFV', quantity: 0, type: 'ETF' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400, message: 'Quantity must be a positive number' })
    })

    test('normalizes symbol by trimming whitespace in addAsset', async () => {
        // Arrange
        const fakeAssetModel = {
            findOne: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({ symbol: 'VFV', quantity: 1, type: 'ETF' })
        }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        await service.addAsset({ userId: 'u1', symbol: '  vfv  ', quantity: 1, type: 'ETF' })

        // Assert
        expect(fakeEtfHelpers.isValidCanadianETF).toHaveBeenCalledWith('VFV')
        expect(fakeAssetModel.findOne).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'VFV' })
    })

    test('updates existing asset quantity when asset already exists', async () => {
        // Arrange
        const save = jest.fn().mockResolvedValue(undefined)
        const existing = { quantity: 3, save }
        const fakeAssetModel = { findOne: jest.fn().mockResolvedValue(existing) }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        const result = await service.addAsset({ userId: 'u1', symbol: 'xiu', quantity: 2 })

        // Assert
        expect(result.quantity).toBe(5)
        expect(save).toHaveBeenCalledTimes(1)
    })

    test('backfills type on existing asset when missing', async () => {
        // Arrange
        const save = jest.fn().mockResolvedValue(undefined)
        const existing = { quantity: 2, type: undefined, save }
        const fakeAssetModel = { findOne: jest.fn().mockResolvedValue(existing) }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const service = createAssetService({ AssetModel: fakeAssetModel, etfHelperLib: fakeEtfHelpers })

        // Act
        await service.addAsset({ userId: 'u1', symbol: 'xiu', quantity: 1, type: 'ETF' })

        // Assert
        expect(existing.type).toBe('ETF')
        expect(save).toHaveBeenCalledTimes(1)
    })

    test('throws bad request when etf symbol is invalid', async () => {
        // Arrange
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(false) }
        const service = createAssetService({ AssetModel: {}, etfHelperLib: fakeEtfHelpers })

        // Act
        const action = service.addAsset({ userId: 'u1', symbol: 'bad', quantity: 1 })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
    })

    test('throws not found when updating missing asset', async () => {
        // Arrange
        const fakeAssetModel = { findById: jest.fn().mockResolvedValue(null) }
        const service = createAssetService({ AssetModel: fakeAssetModel })

        // Act
        const action = service.updateAsset('id1', { quantity: 1 })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 404 })
        expect(fakeAssetModel.findById).toHaveBeenCalledWith('id1')
    })

    test('throws not found when deleting missing asset', async () => {
        // Arrange
        const fakeAssetModel = { findById: jest.fn().mockResolvedValue(null) }
        const service = createAssetService({ AssetModel: fakeAssetModel })

        // Act
        const action = service.deleteAsset('id1')

        // Assert
        await expect(action).rejects.toMatchObject({ status: 404 })
    })

    test('uploadCSV parses holdings and returns added/skipped counts', async () => {
        // Arrange
        const save = jest.fn().mockResolvedValue(undefined)
        const fakeAssetModel = {
            findOne: jest
                .fn()
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce({ quantity: 1, type: 'ETF', save }),
            create: jest.fn().mockResolvedValue({}),
        }
        const fakeEtfHelpers = { isValidCanadianETF: jest.fn().mockResolvedValue(true) }
        const parseCsv = jest.fn((_content, _opts, cb) => cb(null, [{ ticker: 'header-row' }]))
        const parserRouterFactory = jest.fn(() => ({
            detectParser: jest.fn(() => ({
                parse: jest.fn(() => ([
                    { ticker: 'VFV', shares: '2', assetClass: 'ETF' },
                    { ticker: 'XIU', shares: '3', assetClass: 'ETF' },
                    { ticker: 'BAD', shares: '1', assetClass: 'ETF' },
                    { ticker: 'TDB900', shares: '2.5', assetClass: 'Mutual Fund' },
                    { ticker: 'VUN', shares: '0', assetClass: 'ETF' },
                ])),
            })),
        }))

        fakeEtfHelpers.isValidCanadianETF
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(true)
            .mockResolvedValueOnce(false)

        const service = createAssetService({
            AssetModel: fakeAssetModel,
            etfHelperLib: fakeEtfHelpers,
            parseCsv,
            parserRouterFactory,
        })

        // Act
        const result = await service.uploadCSV({ userId: 'u1', fileContent: 'csv' })

        // Assert
        expect(result).toEqual({ message: 'CSV processed successfully', added: 3, skipped: 2 })
        expect(fakeAssetModel.create).toHaveBeenCalledTimes(2)
        expect(fakeAssetModel.create).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'VFV', type: 'ETF', quantity: 2 })
        expect(fakeAssetModel.create).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'TDB900', type: 'Mutual Fund', quantity: 2.5 })
        expect(save).toHaveBeenCalledTimes(1)
    })

    test('uploadCSV returns 400 when parser yields no records', async () => {
        // Arrange
        const parseCsv = jest.fn((_content, _opts, cb) => cb(null, []))
        const service = createAssetService({
            AssetModel: {},
            etfHelperLib: {},
            parseCsv,
            parserRouterFactory: jest.fn(),
        })

        // Act
        const action = service.uploadCSV({ userId: 'u1', fileContent: 'csv' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400, message: 'CSV file is empty' })
    })

    test('uploadCSV returns 400 when CSV parsing fails', async () => {
        // Arrange
        const parseCsv = jest.fn((_content, _opts, cb) => cb(new Error('bad csv')))
        const service = createAssetService({
            AssetModel: {},
            etfHelperLib: {},
            parseCsv,
            parserRouterFactory: jest.fn(),
        })

        // Act
        const action = service.uploadCSV({ userId: 'u1', fileContent: 'csv' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400 })
        await expect(action).rejects.toHaveProperty('message', 'Error parsing CSV file: bad csv')
    })

    test('uploadCSV returns 400 when brokerage format is unsupported', async () => {
        // Arrange
        const parseCsv = jest.fn((_content, _opts, cb) => cb(null, [{ foo: 'bar' }]))
        const parserRouterFactory = jest.fn(() => ({
            detectParser: jest.fn(() => {
                throw new Error('Unsupported CSV format or unrecognized brokerage.')
            }),
        }))
        const service = createAssetService({
            AssetModel: {},
            etfHelperLib: {},
            parseCsv,
            parserRouterFactory,
        })

        // Act
        const action = service.uploadCSV({ userId: 'u1', fileContent: 'csv' })

        // Assert
        await expect(action).rejects.toMatchObject({ status: 400, message: 'Unsupported CSV format or unrecognized brokerage.' })
    })
})
