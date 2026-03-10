import { Asset } from '../models/Asset.js'
import yahooFinance from '../helpers/yahooFinance.js';

export default {
    // GET /api/assets
    async getAssets(req, res) {
        try {
            // TODO: req.user.session
            // const { user_id } = req.query; // Read userId from the URL query params
            const user_id = req.session.userId

            if (!user_id) {
                return res.status(400).json({ message: 'User ID is required' });
            }

            // Find assets specifically for this user
            const assets = await Asset.find({ user_id: user_id })
            res.status(200).json(assets)
        } catch (error) {
            res.status(500).json({ message: error.message })
        }
    },

    // POST /api/assets
   async addAsset(req, res) {
        // 1. Basic Validation
        let { symbol, quantity } = req.body
        const user_id = req.session.userId
        if (!user_id || !symbol || !quantity) {
            return res.status(400).json({ message: 'Please include user_id, symbol, and quantity' })
        }

        try {
            // Force Uppercase so 'vfv' matches 'VFV'
            symbol = symbol.toUpperCase();
            quantity = Number(quantity);

            // Check if it is a valid Canadian ETF
            const isValidETF = await yahooFinance.isValidCanadianETF(symbol)
            if(!isValidETF){
                return res.status(400).json({ message: 'This ETF is invalid, or not part of the Canadian market' })
            }

            // Check if this asset already exists for this specific user
            const existingAsset = await Asset.findOne({ 
                user_id: user_id, 
                symbol: symbol
            });

            if (existingAsset) {
                // Asset Exists we Update Quantity
                existingAsset.quantity += quantity;
                await existingAsset.save();
                
                // Return the updated asset
                return res.status(200).json(existingAsset);
            }

            // Asset is new create it
            const asset = await Asset.create({
                user_id: user_id,
                symbol: symbol,
                quantity: quantity
            });
            
            res.status(200).json(asset);

        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    },

    // PUT /api/assets/:id
    async updateAsset(req, res) {
        console.log(req.body)
        try {
            const asset = await Asset.findById(req.params.id)

            if (!asset) {
                return res.status(404).json({ message: 'Asset not found' })
            }

            const updatedAsset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
            })
            res.status(200).json(updatedAsset)
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    },
    
    // DELETE /api/assets/:id
    async deleteAsset(req, res) {
        try {
            const asset = await Asset.findById(req.params.id)

            if (!asset) {
                return res.status(404).json({ message: 'Asset not found' })
            }

            await asset.deleteOne()
            res.status(200).json({ id: req.params.id })
        } catch (error) {
            res.status(400).json({ message: error.message })
        }
    }
}