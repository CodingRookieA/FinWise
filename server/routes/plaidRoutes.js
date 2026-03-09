import express from 'express';
import { createLinkToken, exchangeToken } from '../controllers/plaidController.js';
import { checkAuth } from '../middleware/checkAuth.js';

const router = express.Router();

// Create link token for Plaid Link flow
router.post('/create_link_token', checkAuth, createLinkToken);

// Exchange public token for access token
router.post('/exchange_token', checkAuth, exchangeToken);

export default router;
