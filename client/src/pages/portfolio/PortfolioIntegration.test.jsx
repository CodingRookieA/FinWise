import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { PortfolioPage } from './PortfolioPage';
import {
    mockUser,
    mockAssets,
    responses,
    setupFetchMock,
    queueFetchResponses,
    expectAssetsFetched,
    expectAssetDeleted,
    expectAssetPosted,
} from './Portfoliohandlers';

// Only mocking the toast utility since it's an external side effect.
// Never mock internal components in integration tests — that defeats the purpose.
vi.mock('../../utils/toastHelper', () => ({
    default: vi.fn(),
}));

describe('Portfolio Integration Flow', { timeout: 15000 }, () => {
    const mockLogout = vi.fn();

    // Renders the full page with all required providers
    function renderPortfolioPage() {
        return render(
            <MemoryRouter>
                <PortfolioPage user={mockUser} logout={mockLogout} />
            </MemoryRouter>
        );
    }

    beforeEach(() => {
        setupFetchMock();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Happy path — everything works as expected

    it('fetches and renders the full portfolio dashboard on load', async () => {
        // Arrange
        queueFetchResponses(responses.assetsSuccess);

        // Act
        renderPortfolioPage();

        // Assert: sidebar gets the user's name correctly
        expect(screen.getByText(mockUser.name)).toBeInTheDocument();

        // Assert: both assets appear once the fetch resolves
        expect(await screen.findByText('AAPL')).toBeInTheDocument();
        expect(screen.getByText('TSLA')).toBeInTheDocument();

        expectAssetsFetched(global.fetch);
    });

    // Loading state — the fetch is in flight

    it('shows a loading indicator while assets are being fetched', async () => {
        // Arrange: hold the fetch open so we can check the loading UI before it resolves
        let resolveFetch;
        const pendingFetch = new Promise((resolve) => { resolveFetch = resolve; });
        global.fetch.mockReturnValueOnce(pendingFetch);

        // Act
        renderPortfolioPage();

        // Assert: spinner is visible while we're still waiting
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        // Cleanup: let the fetch finish so the component can unmount cleanly
        resolveFetch({ ok: true, json: async () => mockAssets });
        await screen.findByText('AAPL');
    });

    // Error states — something goes wrong on the network

    it('displays an error message when the initial asset fetch fails', async () => {
        // Arrange
        queueFetchResponses(responses.assetsServerError);

        // Act
        renderPortfolioPage();

        // Assert
        expect(await screen.findByText(/failed to fetch assets/i)).toBeInTheDocument();
    });

    it('displays an error message when the network is unavailable', async () => {
        // Arrange
        queueFetchResponses(responses.assetsNetworkError);

        // Act
        renderPortfolioPage();

        // Assert
        expect(await screen.findByText(/network request failed/i)).toBeInTheDocument();
    });

    // Add asset flow — user opens the modal, fills it out, and saves

    it('opens the Add Asset modal, submits a new asset, and shows it in the table', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(
            responses.assetsSuccess,     // initial load
            responses.assetsSaveSuccess, // POST new asset
            responses.assetsWithNew      // re-fetch after save
        );

        renderPortfolioPage();

        // Wait for the initial assets to load before doing anything
        await screen.findByText('AAPL');

        // Act: open the modal
        await user.click(screen.getByRole('button', { name: /add asset/i }));

        // Act: fill out the form — inputs need proper aria labels for these selectors to work
        await user.type(screen.getByRole('textbox', { name: /symbol/i }), 'MSFT');
        await user.type(screen.getByRole('spinbutton', { name: /quantity/i }), '20');

        // Act: submit — all mocks are already queued above so no race condition here
        await user.click(screen.getByRole('button', { name: /save asset/i }));

        // Assert: the POST went out
        await waitFor(() => expectAssetPosted(global.fetch));

        // Assert: MSFT shows up in the table after the re-fetch
        expect(await screen.findByText('MSFT')).toBeInTheDocument();
    });

    it('shows an error toast when saving a new asset fails', async () => {
        // Arrange
        const user = userEvent.setup();
        const toastHelper = (await import('../../utils/toastHelper')).default;
        queueFetchResponses(
            responses.assetsSuccess,     // initial load
            responses.assetsServerError  // POST fails
        );

        renderPortfolioPage();
        await screen.findByText('AAPL');

        // Act: go through the whole add flow
        await user.click(screen.getByRole('button', { name: /add asset/i }));
        await user.type(screen.getByRole('textbox', { name: /symbol/i }), 'MSFT');
        await user.type(screen.getByRole('spinbutton', { name: /quantity/i }), '20');
        await user.click(screen.getByRole('button', { name: /save asset/i }));

        // Assert: user gets an error toast since the save failed
        await waitFor(() => expect(toastHelper).toHaveBeenCalled());
    });

    // Delete asset flow — user deletes an asset and confirms in the modal

    it('opens the Delete confirmation modal and removes the asset on confirm', async () => {
        // Arrange — all mocks queued upfront before any clicks happen
        const user = userEvent.setup();
        queueFetchResponses(
            responses.assetsSuccess,      // initial load
            responses.assetsDeleteSuccess // DELETE request
        );

        renderPortfolioPage();
        await screen.findByText('AAPL');

        // Act: click the delete icon on the first row
        const deleteButtons = screen.getAllByTestId('DeleteOutlineIcon');
        await user.click(deleteButtons[0]);

        // Act: confirm the deletion in the modal
        await user.click(screen.getByRole('button', { name: /^delete$/i }));

        // Assert: DELETE was called with the right asset id
        await waitFor(() => expectAssetDeleted(global.fetch, mockAssets[0]._id));

        // Assert: AAPL is gone — hook uses setAssets filter so no re-fetch needed
        await waitFor(() => {
            expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
        });

        // Assert: TSLA is still there, only AAPL was deleted
        expect(screen.getByText('TSLA')).toBeInTheDocument();
    });

    it('keeps the asset in the table if deletion fails', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(
            responses.assetsSuccess,     // initial load
            responses.assetsServerError  // DELETE fails
        );

        renderPortfolioPage();
        await screen.findByText('AAPL');

        // Act
        const deleteButtons = screen.getAllByTestId('DeleteOutlineIcon');
        await user.click(deleteButtons[0]);
        await user.click(screen.getByRole('button', { name: /^delete$/i }));

        // Assert: AAPL is still in the table since the delete didn't go through
        await waitFor(() => {
            expect(screen.getByText('AAPL')).toBeInTheDocument();
        });
    });
});