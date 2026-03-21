// --- Strategy Pattern: Asset Routing Strategy ---
// This router is a concrete strategy for handling all asset-management requests
// (retrieving, adding, updating, and deleting user assets).
// It encapsulates the routing logic for the /api/assets namespace,
// keeping it independent from other routing strategies.
import express from 'express'
import multer from 'multer'
import AssetController from '../controllers/assetController.js'
import { checkAuth } from '../middleware/checkAuth.js'

const assetRouter = express.Router()

// Setup multer for memory storage
const upload = multer({ storage: multer.memoryStorage() })

// Routes for /api/assets
assetRouter.get('/', checkAuth, AssetController.getAssets)
assetRouter.post('/', checkAuth, AssetController.addAsset)
assetRouter.post('/upload', checkAuth, upload.single('csvFile'), AssetController.uploadCSV)
assetRouter.put('/:id', checkAuth, AssetController.updateAsset)
assetRouter.delete('/:id', checkAuth, AssetController.deleteAsset)

export default assetRouter