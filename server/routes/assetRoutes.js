// --- Strategy Pattern: Asset Routing Strategy ---
// This router is a concrete strategy for handling all asset-management requests
// (retrieving, adding, updating, and deleting user assets).
// It encapsulates the routing logic for the /api/assets namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import multer from 'multer'
import AssetController from '../controllers/assetController.js'
import { checkAuth } from '../middleware/checkAuth.js'

export function createAssetRouter(controller = AssetController) {
	const assetRouter = express.Router()

	// Setup multer for memory storage
	const upload = multer({ storage: multer.memoryStorage() })

	// Routes for /api/assets
	assetRouter.get('/', checkAuth, controller.getAssets)
	assetRouter.post('/', checkAuth, controller.addAsset)
	assetRouter.post('/upload', checkAuth, upload.single('csvFile'), controller.uploadCSV)
	assetRouter.put('/:id', checkAuth, controller.updateAsset)
	assetRouter.delete('/:id', checkAuth, controller.deleteAsset)

	return assetRouter
}

export default createAssetRouter()