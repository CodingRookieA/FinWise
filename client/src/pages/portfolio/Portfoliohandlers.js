/**
 * Shared network mock handlers for Portfolio integration tests.
 * All fetch mocks are defined here and imported into test files.
 * Never define inline fetch mocks inside individual test files.
 *
 * Usage:
 *   import { mockAssets, setupFetchMock } from './portfolioHandlers';
 *   beforeEach(() => setupFetchMock());
 */

import { vi } from 'vitest';
import { SERVERURL } from '../../utils/constants';

// mock data

export const mockAssets = [
    { _id: '1', name: 'Apple Inc.',  symbol: 'AAPL', currentPrice: 150, quantity: 10, currency: 'USD' },
    { _id: '2', name: 'Tesla',       symbol: 'TSLA', currentPrice: 800, quantity: 5,  currency: 'USD' },
];

export const mockNewAsset = {
    _id: '3', name: 'Microsoft', symbol: 'MSFT', currentPrice: 320, quantity: 20, currency: 'USD',
};

export const mockUser = { name: 'Test User', email: 'test@example.com' };

// Response factories

export const responses = {
    assetsSuccess: {
        ok: true,
        json: async () => mockAssets,
    },
    assetsWithNew: {
        ok: true,
        json: async () => [...mockAssets, mockNewAsset],
    },
    assetsSaveSuccess: {
        ok: true,
        json: async () => ({ message: 'Asset saved successfully' }),
    },
    assetsDeleteSuccess: {
        ok: true,
        json: async () => ({ message: 'Asset deleted successfully' }),
    },
    assetsServerError: {
        ok: false,
        status: 500,
        json: async () => ({ message: 'Failed to fetch assets' }),
    },
    assetsNetworkError: new Error('Network request failed'),
};

// Setup helpers

/**
 * Call in beforeEach. Resets and re-installs a clean global.fetch mock.
 */
export function setupFetchMock() {
    vi.clearAllMocks();
    global.fetch = vi.fn();
}

/**
 * Queue a sequence of fetch responses in order.
 * Each call to fetch() consumes the next response in the list.
 *
 * @param {...object} responsesInOrder - response objects or Errors from `responses`
 *
 * Example:
 *   queueFetchResponses(
 *     responses.assetsSuccess,       // 1st fetch: initial load
 *     responses.assetsSaveSuccess,   // 2nd fetch: POST new asset
 *     responses.assetsWithNew        // 3rd fetch: re-fetch after save
 *   );
 */
export function queueFetchResponses(...responsesInOrder) {
    for (const response of responsesInOrder) {
        if (response instanceof Error) {
            global.fetch.mockRejectedValueOnce(response);
        } else {
            global.fetch.mockResolvedValueOnce(response);
        }
    }
}

// Assertion helpers 
/**
 * Assert that fetch was called with the assets endpoint.
 */
export function expectAssetsFetched(fetchMock) {
    expect(fetchMock).toHaveBeenCalledWith(
        `${SERVERURL}/api/assets`,
        expect.any(Object)
    );
}

/**
 * Assert that fetch was called with DELETE on a specific asset.
 */
export function expectAssetDeleted(fetchMock, assetId) {
    expect(fetchMock).toHaveBeenCalledWith(
        `${SERVERURL}/api/assets/${assetId}`,
        expect.objectContaining({ method: 'DELETE' })
    );
}

/**
 * Assert that fetch was called with POST on the assets endpoint.
 */
export function expectAssetPosted(fetchMock) {
    expect(fetchMock).toHaveBeenCalledWith(
        `${SERVERURL}/api/assets`,
        expect.objectContaining({ method: 'POST' })
    );
}