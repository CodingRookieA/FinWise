import express from 'express'
import AssetController from '../controllers/assetController.js'

const assetRouter = express.Router()

// Routes for /api/assets
assetRouter.get('/', AssetController.getAssets)
assetRouter.post('/', AssetController.addAsset)
assetRouter.put('/:id', AssetController.updateAsset)
assetRouter.delete('/:id', AssetController.deleteAsset)

export default assetRouter