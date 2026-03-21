import { createAssetService } from '../services/asset/assetService.js'
import { Asset } from '../models/Asset.js'
import etfHelpers from '../helpers/etfHelpers.js';
import { parse } from 'csv-parse';
import CsvParserRouter from '../services/portfolio/CsvParserRouter.js';

export function createAssetController(assetService = createAssetService()) {
    return {
        async getAssets(req, res) {
            try {
                const user_id = req.session.userId
                if (!user_id) {
                    return res.status(400).json({ message: 'User ID is required' })
                }

                const assets = await assetService.getAssets(user_id)
                res.status(200).json(assets)
            } catch (error) {
                res.status(500).json({ message: error.message })
            }
        },

        async addAsset(req, res) {
            const { symbol, quantity, type } = req.body
            const user_id = req.session.userId
            if (!user_id || !symbol || !quantity) {
                return res.status(400).json({ message: 'Please include user_id, symbol, and quantity' })
            }

            try {
                const asset = await assetService.addAsset({
                    userId: user_id,
                    symbol,
                    quantity,
                    type,
                })

                return res.status(200).json(asset)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ message: error.message })
                }
                res.status(400).json({ message: error.message })
            }
        },

        async uploadCSV(req, res) {
            try {
                const user_id = req.session.userId;
                if (!user_id) return res.status(401).json({ message: 'User not authenticated' });

                if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

                const fileContent = req.file.buffer.toString('utf-8');

                parse(fileContent, { columns: true, skip_empty_lines: true, trim: true }, async (err, records) => {
                    if (err) return res.status(400).json({ message: 'Error parsing CSV file', error: err.message });
                    if (records.length === 0) return res.status(400).json({ message: 'CSV file is empty' });

                    try {
                        const headers = Object.keys(records[0]);
                        const router = new CsvParserRouter();
                        const parser = router.detectParser(headers);

                        const holdings = parser.parse(records);

                        let addedCount = 0;
                        let skippedCount = 0;

                        for (const holding of holdings) {
                            if (!holding.ticker) continue;

                            const symbol = holding.ticker.toUpperCase().trim();
                            const isMutualFund = holding.assetClass === 'Mutual Fund';
                            const type = isMutualFund ? 'Mutual Fund' : 'ETF';

                            let isValidETF = true;
                            if (type === 'ETF') {
                                isValidETF = await etfHelpers.isValidCanadianETF(symbol);
                            }

                            if (type === 'Mutual Fund' || isValidETF) {
                                const quantity = Number(holding.shares);
                                if (isNaN(quantity) || quantity <= 0) {
                                    skippedCount++;
                                    continue;
                                }

                                const existingAsset = await Asset.findOne({ user_id: user_id, symbol: symbol });
                                if (existingAsset) {
                                    existingAsset.quantity += quantity;
                                    if (!existingAsset.type) {
                                        existingAsset.type = type;
                                    }
                                    await existingAsset.save();
                                } else {
                                    await Asset.create({
                                        user_id: user_id,
                                        symbol: symbol,
                                        type: type,
                                        quantity: quantity
                                    });
                                }
                                addedCount++;
                            } else {
                                skippedCount++;
                            }
                        }

                        return res.status(200).json({ message: 'CSV processed successfully', added: addedCount, skipped: skippedCount });

                    } catch (parseError) {
                        return res.status(400).json({ message: parseError.message });
                    }
                });
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        },

        async updateAsset(req, res) {
            console.log(req.body)
            try {
                const updatedAsset = await assetService.updateAsset(req.params.id, req.body)
                res.status(200).json(updatedAsset)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ message: error.message })
                }
                res.status(400).json({ message: error.message })
            }
        },

        async deleteAsset(req, res) {
            try {
                const result = await assetService.deleteAsset(req.params.id)
                res.status(200).json(result)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ message: error.message })
                }
                res.status(400).json({ message: error.message })
            }
        }
    }
}

export default createAssetController()