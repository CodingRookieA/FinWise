import { Asset } from '../../models/Asset.js'
import etfHelpers from '../../helpers/etfHelpers.js'

function createHttpError(status, message) {
    const error = new Error(message)
    error.status = status
    return error
}

export function createAssetService(deps = {}) {
    const {
        AssetModel = Asset,
        etfHelperLib = etfHelpers,
    } = deps

    async function getAssets(userId) {
        return AssetModel.find({ user_id: userId })
    }

    async function addAsset({ userId, symbol, quantity }) {
        const normalizedSymbol = symbol.toUpperCase()
        const parsedQuantity = Number(quantity)

        const isValidETF = await etfHelperLib.isValidCanadianETF(normalizedSymbol)
        if (!isValidETF) {
            throw createHttpError(400, 'This ETF is invalid, or not part of the Canadian market')
        }

        const existingAsset = await AssetModel.findOne({
            user_id: userId,
            symbol: normalizedSymbol
        })

        if (existingAsset) {
            existingAsset.quantity += parsedQuantity
            await existingAsset.save()
            return existingAsset
        }

        return AssetModel.create({
            user_id: userId,
            symbol: normalizedSymbol,
            quantity: parsedQuantity
        })
    }

    async function updateAsset(id, updates) {
        const asset = await AssetModel.findById(id)
        if (!asset) {
            throw createHttpError(404, 'Asset not found')
        }

        return AssetModel.findByIdAndUpdate(id, updates, { new: true })
    }

    async function deleteAsset(id) {
        const asset = await AssetModel.findById(id)
        if (!asset) {
            throw createHttpError(404, 'Asset not found')
        }

        await asset.deleteOne()
        return { id }
    }

    return {
        getAssets,
        addAsset,
        updateAsset,
        deleteAsset,
    }
}
