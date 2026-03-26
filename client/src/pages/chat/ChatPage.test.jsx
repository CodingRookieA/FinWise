import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatPage } from './ChatPage'

const toastHelperMock = vi.fn()

vi.mock('../../utils/constants', () => ({
  SERVERURL: 'http://test-server'
}))

vi.mock('../../utils/toastHelper', () => ({
  default: (...args) => toastHelperMock(...args)
}))

vi.mock('../../components/alerts/InfoAlert', () => ({
  InfoAlert: ({ children }) => <div>{children}</div>
}))

vi.mock('../../components/chat/sidebar/Sidebar', () => ({
  Sidebar: ({ loggedIn, chatHistory, onNewChat, onLoadSession, onDeleteSession, onChatResponseModeChange }) => (
    <div>
      <p>{`sidebar-logged-in:${String(loggedIn)}`}</p>
      <p>{`history-count:${chatHistory.length}`}</p>
      <button onClick={onNewChat}>new-chat</button>
      <button onClick={() => onLoadSession('session-abc')}>load-session</button>
      <button onClick={() => onDeleteSession('session-abc')}>delete-session</button>
      <button onClick={() => onChatResponseModeChange && onChatResponseModeChange('streaming')}>toggle-stream-mode</button>
    </div>
  )
}))

vi.mock('../../components/chat/emptyState/EmptyState', () => ({
  EmptyState: ({ onSampleQuestion }) => (
    <button onClick={() => onSampleQuestion('What is an ETF?')}>pick-sample-question</button>
  )
}))

vi.mock('../../components/chat/messagesList/MessagesList', () => ({
  MessagesList: ({ messages, loading }) => (
    <div>
      <p>{`messages-count:${messages.length}`}</p>
      <p>{`loading:${String(loading)}`}</p>
      {messages.map((m, i) => (
        <p key={i}>{`${m.role}:${m.content}`}</p>
      ))}
    </div>
  )
}))

vi.mock('../../components/chat/inputArea/InputArea', () => ({
  InputArea: ({ message, loading, onMessageChange, onSendMessage }) => (
    <div>
      <input
        aria-label="chat-input"
        value={message}
        onChange={(e) => onMessageChange(e)}
        disabled={loading}
      />
      <button onClick={onSendMessage} disabled={loading}>
        send-message
      </button>
    </div>
  )
}))

describe('ChatPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    toastHelperMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(globalThis.crypto, 'randomUUID')
      .mockReturnValueOnce('initial-session-id')
      .mockReturnValueOnce('session-after-user-change')
      .mockReturnValue('generated-session-id')
  })

  it('shows verify email alert for logged in but unverified users', () => {
    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: false }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    const verifyLink = screen.getByRole('link', { name: /verify your email/i })
    expect(verifyLink).toBeInTheDocument()
    expect(verifyLink).toHaveAttribute('href', '/email-verification')
    expect(screen.getByText('sidebar-logged-in:false')).toBeInTheDocument()
  })

  it('fetches history for verified users and updates sidebar count', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [{ id: 's1' }, { id: 's2' }] })
    })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    expect(await screen.findByText('history-count:2')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('http://test-server/api/chat/history', {
      credentials: 'include'
    })
    expect(screen.getByText('sidebar-logged-in:true')).toBeInTheDocument()
  })

  it('lets user pick sample question and send message successfully', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [], remainingUnansweredCount: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'ETF means exchange-traded fund.' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [{ id: 'new-session' }] })
      })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'pick-sample-question' }))
    expect(screen.getByLabelText('chat-input')).toHaveValue('What is an ETF?')

    await user.click(screen.getByRole('button', { name: 'send-message' }))

    expect(await screen.findByText('assistant:ETF means exchange-traded fund.')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://test-server/api/chat/send',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          message: 'What is an ETF?',
          userId: 'u-1',
          sessionId: 'session-after-user-change'
        })
      })
    )
  })

  it('shows fallback assistant message when send fails', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] })
      })
      .mockResolvedValueOnce({ ok: false })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    await user.type(screen.getByLabelText('chat-input'), 'Help me budget')
    await user.click(screen.getByRole('button', { name: 'send-message' }))

    expect(
      await screen.findByText(
        'assistant:Sorry, I encountered an error while processing your request. Please try again.'
      )
    ).toBeInTheDocument()
  })

  it('loads selected session messages from sidebar action', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [], remainingUnansweredCount: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [
            { role: 'user', content: 'old question' },
            { role: 'assistant', content: 'old answer' }
          ]
        })
      })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'load-session' }))

    expect(await screen.findByText('user:old question')).toBeInTheDocument()
    expect(screen.getByText('assistant:old answer')).toBeInTheDocument()
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://test-server/api/chat/session/session-abc', {
        credentials: 'include'
      })
    })
  })

  it('deletes selected session and clears active chat when deleting current session', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessions: [{ sessionId: 'session-abc' }, { sessionId: 'session-2' }] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ questions: [], remainingUnansweredCount: 0 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messages: [
            { role: 'user', content: 'old question' },
            { role: 'assistant', content: 'old answer' }
          ]
        })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, deletedCount: 2 }) })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    expect(await screen.findByText('history-count:2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'load-session' }))
    expect(await screen.findByText('user:old question')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'delete-session' }))

    expect(await screen.findByText('Delete chat session?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete Session' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://test-server/api/chat/session/session-abc', {
        method: 'DELETE',
        credentials: 'include'
      })
    })

    expect(await screen.findByText('history-count:1')).toBeInTheDocument()
    expect(screen.queryByText('user:old question')).not.toBeInTheDocument()
  })

  it('shows reminder toast when toggling to streaming mode', async () => {
    const user = userEvent.setup()

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sessions: [] })
    })

    render(
      <ChatPage
        user={{ userId: 'u-1', isVerified: true }}
        logout={vi.fn()}
        loggedIn={true}
        setLoggedIn={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'toggle-stream-mode' }))

    expect(toastHelperMock).toHaveBeenCalledWith(
      'info',
      'Streaming enabled. Recommendation table may appear slightly after text.'
    )
  })
})
