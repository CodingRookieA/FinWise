import { createAssetService } from '../services/asset/assetService.js'

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
            const { symbol, quantity } = req.body
            const user_id = req.session.userId
            if (!user_id || !symbol || !quantity) {
                return res.status(400).json({ message: 'Please include user_id, symbol, and quantity' })
            }

            try {
                const asset = await assetService.addAsset({
                    userId: user_id,
                    symbol,
                    quantity,
                })

                return res.status(200).json(asset)
            } catch (error) {
                if (error.status) {
                    return res.status(error.status).json({ message: error.message })
                }
                res.status(400).json({ message: error.message })
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