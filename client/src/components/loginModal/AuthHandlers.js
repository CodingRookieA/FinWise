// Shared mock setup for the auth integration tests.
// I put all the fetch mocks and test data here so I don't have to
// repeat them in every test file. Just import what you need.
//
// Usage:
//   import { setupAuthMocks, responses } from './authHandlers';
//   beforeEach(() => setupAuthMocks());

import { vi } from 'vitest';
import { SERVERURL } from '../../utils/constants';

// Test user data I reuse across tests
export const validUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
};

// All the possible API responses the backend can return.
// I include ok: true/false even though the component doesn't check it,
// just to match what a real fetch response looks like.
export const responses = {
    loginSuccess: {
        ok: true,
        json: async () => ({ message: 'Logged in successfully' }),
    },
    loginFailure: {
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
    },
    signupSuccess: {
        ok: true,
        json: async () => ({ message: 'Check your email to verify' }),
    },
    signupFailure: {
        ok: false,
        json: async () => ({ error: 'Email already in use' }),
    },
    // This simulates the network going down entirely (fetch throws instead of resolving)
    networkError: new Error('Network request failed'),
};

// Runs before each test to reset everything to a clean state.
// Using vi.stubGlobal instead of manually deleting window.location
// because Vitest will clean it up automatically after each test.
export function setupAuthMocks() {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Stub location so we can check redirects without breaking the real window object
    vi.stubGlobal('location', { href: '', origin: 'http://localhost' });

    // Stub the Google SDK so clicking the Google button doesn't crash
    vi.stubGlobal('google', {
        accounts: {
            oauth2: {
                initCodeClient: vi.fn().mockReturnValue({ requestCode: vi.fn() }),
            },
        },
    });
}

// Queues up fetch responses in the order they'll be called.
// Pass in as many responses as you need, one per fetch call.
// If you pass an Error it'll mock a rejected fetch (network failure).
export function queueFetchResponses(...responsesInOrder) {
    for (const response of responsesInOrder) {
        if (response instanceof Error) {
            global.fetch.mockRejectedValueOnce(response);
        } else {
            global.fetch.mockResolvedValueOnce(response);
        }
    }
}

// Checks that the login endpoint was called with the right data
export function expectLoginPosted(fetchMock, email, password) {
    expect(fetchMock).toHaveBeenCalledWith(
        `${SERVERURL}/api/users/localLogin`,
        expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
    );
}

// Checks that the signup endpoint was called with the right data
export function expectSignupPosted(fetchMock, name, email, password) {
    expect(fetchMock).toHaveBeenCalledWith(
        `${SERVERURL}/api/users/localSignup`,
        expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        })
    );
}