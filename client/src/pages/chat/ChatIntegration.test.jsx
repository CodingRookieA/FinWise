import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ChatPage } from './ChatPage';
import { SERVERURL } from '../../utils/constants';

describe('Chat Flow Integration', () => {
    const mockUser = { userId: '123', name: 'Test User', isVerified: true };
    const mockLogout = vi.fn();

    const mockChatHistory = {
        sessions: [
            { sessionId: 'old-session-1', title: 'My first chat', updatedAt: new Date().toISOString() },
            { sessionId: 'old-session-2', title: 'ETF advice', updatedAt: new Date().toISOString() }
        ]
    };

    const mockSessionData = {
        messages: [
            { role: 'user', content: 'What is an ETF?' },
            { role: 'assistant', content: 'An ETF is an exchange-traded fund.' }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        
        // Mock scrollIntoView which is called by MessagesList
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the chat interface and fetches history successfully', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockChatHistory
        });

        render(
            <MemoryRouter>
                <ChatPage user={mockUser} loggedIn={true} logout={mockLogout} setLoggedIn={vi.fn()} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${SERVERURL}/api/chat/history`,
                expect.any(Object)
            );
        });

        expect((await screen.findAllByText('My first chat'))[0]).toBeInTheDocument();
        expect(screen.getAllByText('ETF advice')[0]).toBeInTheDocument();

        expect(screen.getByText(/How can I help you/i)).toBeInTheDocument();
        expect(screen.getByText('What should I invest in?')).toBeInTheDocument();
    });

    it('sends a new message and receives an AI response', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ sessions: [] }) });

        render(
            <MemoryRouter>
                <ChatPage user={mockUser} loggedIn={true} logout={mockLogout} setLoggedIn={vi.fn()} />
            </MemoryRouter>
        );

        const inputField = screen.getByPlaceholderText('What would you like to know?');
        await screen.findByText(/How can I help you/i);

        fireEvent.change(inputField, { target: { value: 'Tell me a joke' } });
        await waitFor(() => { expect(inputField.value).toBe('Tell me a joke'); });

        // Pre-queue the expected fetch definitions BEFORE triggering the network call
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ response: 'Why did the chicken cross the road? To get to the other side.' })
        });
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ sessions: [{ sessionId: 'new-1', title: 'Tell me a joke...', updatedAt: new Date().toISOString() }] })
        });

        const sendBtn = screen.getByTestId('SendIcon').closest('button');
        expect(sendBtn).not.toHaveAttribute('disabled');
        fireEvent.click(sendBtn);
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${SERVERURL}/api/chat/send`,
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('Tell me a joke')
                })
            );
        });

        expect(await screen.findByText('Tell me a joke')).toBeInTheDocument();
        expect(await screen.findByText(/Why did the chicken cross the road/i)).toBeInTheDocument();
        
        expect(screen.queryByText(/How can I help you/i)).not.toBeInTheDocument();
    });

    it('loads a previous chat session by clicking on the sidebar', async () => {
        const user = userEvent.setup();

        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockChatHistory
        });

        render(
            <MemoryRouter>
                <ChatPage user={mockUser} loggedIn={true} logout={mockLogout} setLoggedIn={vi.fn()} />
            </MemoryRouter>
        );

        const oldChatBtn = (await screen.findAllByText('ETF advice'))[0];
        
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockSessionData
        });

        await user.click(oldChatBtn);

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                `${SERVERURL}/api/chat/session/old-session-2`,
                expect.any(Object)
            );
        });

        expect(await screen.findByText('What is an ETF?')).toBeInTheDocument();
        expect(screen.getByText('An ETF is an exchange-traded fund.')).toBeInTheDocument();
        
        expect(screen.queryByText(/How can I help you/i)).not.toBeInTheDocument();
    });
});
