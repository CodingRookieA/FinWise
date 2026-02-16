import express from 'express'
import AssetController from '../controllers/assetController.js'
import { checkAuth } from '../middleware/checkAuth.js'

const assetRouter = express.Router()

// Routes for /api/assets
assetRouter.get('/', checkAuth, AssetController.getAssets)
assetRouter.post('/', checkAuth, AssetController.addAsset)
assetRouter.put('/:id', checkAuth, AssetController.updateAsset)
assetRouter.delete('/:id', checkAuth, AssetController.deleteAsset)

export default assetRouter