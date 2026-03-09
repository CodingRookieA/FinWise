import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { ENVIRONMENT } from '../utils/constants.js';

// Initialize Plaid client
const configuration = new Configuration({
    basePath: PlaidEnvironments.Sandbox, // Using Sandbox for development
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': ENVIRONMENT.plaidClientId,
            'PLAID-SECRET': ENVIRONMENT.plaidSecret,
        },
    },
});

const client = new PlaidApi(configuration);

export const createLinkToken = async (req, res) => {
    try {
        const request = {
            user: { client_user_id: req.session.userId || 'user-' + Date.now() },
            client_name: 'FinWise',
            products: ['investments'], // For mutual funds and ETFs
            country_codes: ['US', 'CA'],
            language: 'en',
        };

        const response = await client.linkTokenCreate(request);
        res.json({ link_token: response.data.link_token });
    } catch (error) {
        console.error('Error creating link token:', error);
        res.status(500).json({ error: 'Failed to create link token' });
    }
};

export const exchangeToken = async (req, res) => {
    try {
        const { public_token } = req.body;

        if (!public_token) {
            return res.status(400).json({ error: 'public_token is required' });
        }

        // Exchange public token for access token
        const response = await client.itemPublicTokenExchange({
            public_token,
        });

        const { access_token, item_id } = response.data;

        // TODO: Save access_token and item_id to database associated with user
        // This where will store the token to make future API calls

        res.json({ success: true, item_id });
    } catch (error) {
        console.error('Error exchanging token:', error);
        res.status(500).json({ error: 'Failed to exchange token' });
    }
};
