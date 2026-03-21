import { Asset } from '../models/Asset.js'
import etfHelpers from '../helpers/etfHelpers.js';
import { parse } from 'csv-parse';
import CsvParserRouter from '../services/portfolio/CsvParserRouter.js';

export default {
    async getAssets(req, res) {
        try {
            const user_id = req.session.userId;
            if (!user_id) return res.status(400).json({ message: 'User ID is required' });
            
            const assets = await Asset.find({ user_id: user_id })
            res.status(200).json(assets)
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    },

    async addAsset(req, res) {
        let { symbol, quantity, type } = req.body
        const user_id = req.session.userId
        if (!user_id || !symbol || !quantity || !type) {
            return res.status(400).json({ message: 'Please include user_id, symbol, quantity, and type' })
        }

        try {
            symbol = symbol.toUpperCase();
            quantity = Number(quantity);

            let isValidETF = true;
            if (type === 'ETF') {
                isValidETF = await etfHelpers.isValidCanadianETF(symbol);
                if(!isValidETF){
                    return res.status(400).json({ message: 'This ETF is invalid, or not part of the Canadian market' });
                }
            }

            const existingAsset = await Asset.findOne({ user_id: user_id, symbol: symbol });
            if (existingAsset) {
                existingAsset.quantity += quantity;
                if (!existingAsset.type) {
                    existingAsset.type = type;
                }
                await existingAsset.save();
                return res.status(200).json(existingAsset);
            }

            const asset = await Asset.create({
                user_id: user_id,
                symbol: symbol,
                type: type,
                quantity: quantity
            });
            
            res.status(200).json(asset);
        } catch (error) {
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
        try {
            const asset = await Asset.findById(req.params.id)
            if (!asset) return res.status(404).json({ message: 'Asset not found' })

            const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true })
            res.status(200).json(updatedAsset)
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    },
    
    async deleteAsset(req, res) {
        try {
            const asset = await Asset.findById(req.params.id)
            if (!asset) return res.status(404).json({ message: 'Asset not found' })

            await asset.deleteOne()
            res.status(200).json({ id: req.params.id })
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }
}