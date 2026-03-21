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
        expect(fakeAssetModel.create).toHaveBeenCalledWith({ user_id: 'u1', symbol: 'VFV', quantity: 2 })
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
})
