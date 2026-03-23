// Integration tests for LoginModal.
// These tests check how the form actually behaves
// tab switching, form submission, API calls, redirects, and error handling.
//
// What I'm testing here:
//   - switching between login and signup tabs shows/hides the right fields
//   - submitting the login form hits the right endpoint and redirects
//   - submitting the signup form hits the right endpoint and redirects
//   - bad credentials shows a toast and doesn't redirect
//   - malformed email is caught client-side before any fetch is made

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { LoginModal } from './LoginModal';
import toastHelper from '../../utils/toastHelper';
import {
    validUser,
    responses,
    setupAuthMocks,
    queueFetchResponses,
    expectLoginPosted,
    expectSignupPosted,
} from './AuthHandlers';

// Mocking external utilities only — never mock internal components
// constants needs to be mocked so the Google OAuth client doesn't complain
vi.mock('../../utils/constants', () => ({
    ENVIRONMENT: { oauthClientId: 'test-client-id' },
    SERVERURL: 'http://localhost',
}));

vi.mock('../../utils/toastHelper', () => ({
    default: vi.fn(),
}));

describe('Authentication Integration Flow (LoginModal)', { timeout: 15000 }, () => {
    const handleModalClose = vi.fn();

    // LoginModal doesn't use any router stuff so no MemoryRouter needed here
    function renderLoginModal() {
        return render(<LoginModal handleModalClose={handleModalClose} />);
    }

    beforeEach(() => {
        // resets fetch, stubs window.location and window.google
        setupAuthMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        // vi.stubGlobal cleans itself up automatically after each test
    });

    // Tab switching tests

    it('shows login fields by default and reveals name field when switching to sign up', async () => {
        // Arrange
        const user = userEvent.setup();
        renderLoginModal();

        // MUI Tab renders as role="tab" not role="button", so we need to be specific here
        // role="button" is reserved for the submit button below the form
        expect(screen.getByRole('tab', { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        // name field should not exist yet on the login tab
        expect(screen.queryByRole('textbox', { name: /name/i })).not.toBeInTheDocument();

        // Act: click the Sign Up tab to switch
        await user.click(screen.getByRole('tab', { name: /sign up/i }));

        // Assert: name field appears and the submit button label changes
        expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('clears all fields when switching tabs', async () => {
        // Arrange
        const user = userEvent.setup();
        renderLoginModal();

        // Act: type something into the login fields then switch tabs
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('tab', { name: /sign up/i }));

        // Assert: fields should be empty after the tab switch (clearFields is called)
        expect(screen.getByRole('textbox', { name: /email/i })).toHaveValue('');
        expect(screen.getByLabelText(/password/i)).toHaveValue('');
    });

    // Client-side validation tests

    it('shows an invalid email toast when email has no domain dot, caught by the custom regex before fetch', async () => {
        // Arrange
        const user = userEvent.setup();
        renderLoginModal();

        // Act: try to submit with a bad email format
        await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@nodot');
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('button', { name: /log in/i }));

        // Assert: the email regex catches it before fetch is ever called
        expect(toastHelper).toHaveBeenCalledWith('error', 'Invalid email');
        expect(global.fetch).not.toHaveBeenCalled();
    });

    // Login happy path

    it('submits login credentials, calls the correct endpoint, and redirects to /questionnaire', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(responses.loginSuccess);
        renderLoginModal();

        // Act
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('button', { name: /log in/i }));

        // Assert: the right endpoint was called with the right body
        await waitFor(() => expectLoginPosted(global.fetch, validUser.email, validUser.password));

        // Assert: redirected to the questionnaire on success
        await waitFor(() => {
            expect(window.location.href).toBe('/questionnaire');
        });
    });

    // Login error states

    it('shows an error toast on login failure and does not redirect', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(responses.loginFailure);
        renderLoginModal();

        // Act
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
        await user.click(screen.getByRole('button', { name: /log in/i }));

        // Assert: toast appears with the error message from the server
        await waitFor(() => {
            expect(toastHelper).toHaveBeenCalledWith('error', 'Invalid credentials');
        });

        // Assert: no redirect happened
        expect(window.location.href).not.toBe('/questionnaire');
    });

    it('does not redirect and gives no feedback when the network fails on login', async () => {
        // Arrange
        // NOTE: this test is documenting a bug in the component.
        // the catch block only does console.log so the user gets no feedback
        // when their network drops. a toastHelper call should be added there.
        const user = userEvent.setup();
        queueFetchResponses(responses.networkError);
        renderLoginModal();

        // Act
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('button', { name: /log in/i }));

        // Assert: at least the user isn't wrongly redirected
        await waitFor(() => {
            expect(window.location.href).not.toBe('/questionnaire');
        });
        // once the catch block is fixed to show a toast, remove this line
        expect(toastHelper).not.toHaveBeenCalled();
    });

    // Signup happy path

    it('submits signup credentials, calls the correct endpoint, and redirects to /email-verification', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(responses.signupSuccess);
        renderLoginModal();

        // Act: switch to the sign up tab first
        await user.click(screen.getByRole('tab', { name: /sign up/i }));

        await user.type(screen.getByRole('textbox', { name: /name/i }), validUser.name);
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // Assert: signup endpoint was called with all three fields
        await waitFor(() =>
            expectSignupPosted(global.fetch, validUser.name, validUser.email, validUser.password)
        );

        // Assert: redirected to email verification page
        await waitFor(() => {
            expect(window.location.href).toBe('/email-verification');
        });
    }, 10000);

    // Signup error state

    it('shows an error toast when signup fails and does not redirect', async () => {
        // Arrange
        const user = userEvent.setup();
        queueFetchResponses(responses.signupFailure);
        renderLoginModal();

        // Act
        await user.click(screen.getByRole('tab', { name: /sign up/i }));
        await user.type(screen.getByRole('textbox', { name: /name/i }), validUser.name);
        await user.type(screen.getByRole('textbox', { name: /email/i }), validUser.email);
        await user.type(screen.getByLabelText(/password/i), validUser.password);
        await user.click(screen.getByRole('button', { name: /create account/i }));

        // Assert
        await waitFor(() => {
            expect(toastHelper).toHaveBeenCalledWith('error', 'Email already in use');
        });
        expect(window.location.href).not.toBe('/email-verification');
    });

    // Google OAuth test

    it('initialises the Google OAuth client with the correct config and fires the code request', async () => {
        // Arrange
        const user = userEvent.setup();
        renderLoginModal();

        // Act
        await user.click(screen.getByRole('button', { name: /continue with google/i }));

        // Assert: initCodeClient was called with all the right OAuth params
        expect(window.google.accounts.oauth2.initCodeClient).toHaveBeenCalledWith(
            expect.objectContaining({
                client_id: 'test-client-id',
                redirect_uri: 'http://localhost/google-redirect',
                scope: 'email profile',
                state: 'login',
                ux_mode: 'redirect',
            })
        );

        // Assert: requestCode was actually called on the client that was returned
        const mockClient = window.google.accounts.oauth2.initCodeClient.mock.results[0].value;
        expect(mockClient.requestCode).toHaveBeenCalled();
    });
});