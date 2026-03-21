import { Asset } from '../../models/Asset.js'
import etfHelpers from '../../helpers/etfHelpers.js'
import { parse as csvParse } from 'csv-parse'
import CsvParserRouter from '../portfolio/CsvParserRouter.js'

function createHttpError(status, message) {
    const error = new Error(message)
    error.status = status
    return error
}

export function createAssetService(deps = {}) {
    const {
        AssetModel = Asset,
        etfHelperLib = etfHelpers,
        parseCsv = csvParse,
        parserRouterFactory = () => new CsvParserRouter(),
    } = deps

    async function getAssets(userId) {
        return AssetModel.find({ user_id: userId })
    }

    async function addAsset({ userId, symbol, quantity, type = 'ETF' }) {
        const normalizedSymbol = symbol.toUpperCase().trim()
        const parsedQuantity = Number(quantity)
        const normalizedType = type === 'Mutual Fund' ? 'Mutual Fund' : 'ETF'

        if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
            throw createHttpError(400, 'Quantity must be a positive number')
        }

        if (normalizedType === 'ETF') {
            const isValidETF = await etfHelperLib.isValidCanadianETF(normalizedSymbol)
            if (!isValidETF) {
                throw createHttpError(400, 'This ETF is invalid, or not part of the Canadian market')
            }
        }

        const existingAsset = await AssetModel.findOne({
            user_id: userId,
            symbol: normalizedSymbol
        })

        if (existingAsset) {
            existingAsset.quantity += parsedQuantity
            if (!existingAsset.type) {
                existingAsset.type = normalizedType
            }
            await existingAsset.save()
            return existingAsset
        }

        return AssetModel.create({
            user_id: userId,
            symbol: normalizedSymbol,
            type: normalizedType,
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

    async function uploadCSV({ userId, fileContent }) {
        const records = await new Promise((resolve, reject) => {
            parseCsv(fileContent, { columns: true, skip_empty_lines: true, trim: true }, (err, parsedRecords) => {
                if (err) {
                    return reject(createHttpError(400, `Error parsing CSV file: ${err.message}`))
                }
                return resolve(parsedRecords)
            })
        })

        if (!Array.isArray(records) || records.length === 0) {
            throw createHttpError(400, 'CSV file is empty')
        }

        let holdings
        try {
            const headers = Object.keys(records[0])
            const parser = parserRouterFactory().detectParser(headers)
            holdings = parser.parse(records)
        } catch (error) {
            throw createHttpError(400, error.message)
        }

        let addedCount = 0
        let skippedCount = 0

        for (const holding of holdings) {
            if (!holding.ticker) continue

            const symbol = holding.ticker.toUpperCase().trim()
            const isMutualFund = holding.assetClass === 'Mutual Fund'
            const type = isMutualFund ? 'Mutual Fund' : 'ETF'

            let isValidETF = true
            if (type === 'ETF') {
                isValidETF = await etfHelperLib.isValidCanadianETF(symbol)
            }

            if (type === 'Mutual Fund' || isValidETF) {
                const quantity = Number(holding.shares)
                if (Number.isNaN(quantity) || quantity <= 0) {
                    skippedCount++
                    continue
                }

                const existingAsset = await AssetModel.findOne({ user_id: userId, symbol })
                if (existingAsset) {
                    existingAsset.quantity += quantity
                    if (!existingAsset.type) {
                        existingAsset.type = type
                    }
                    await existingAsset.save()
                } else {
                    await AssetModel.create({
                        user_id: userId,
                        symbol,
                        type,
                        quantity,
                    })
                }
                addedCount++
            } else {
                skippedCount++
            }
        }

        return {
            message: 'CSV processed successfully',
            added: addedCount,
            skipped: skippedCount,
        }
    }

    return {
        getAssets,
        addAsset,
        updateAsset,
        deleteAsset,
        uploadCSV,
    }
}
