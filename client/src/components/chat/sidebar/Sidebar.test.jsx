import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('Chat Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('renders nothing when user is not logged in', () => {
    const { container } = render(
      <Sidebar
        user={{}}
        chatHistory={[]}
        sidebarOpen={true}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        onLoadSession={vi.fn()}
        loggedIn={false}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders empty history and handles new chat and close actions', async () => {
    const user = userEvent.setup()
    const onNewChat = vi.fn()
    const onToggleSidebar = vi.fn()

    render(
      <Sidebar
        user={{ name: 'Alice', email: 'alice@example.com' }}
        chatHistory={[]}
        sidebarOpen={true}
        onToggleSidebar={onToggleSidebar}
        onNewChat={onNewChat}
        onLoadSession={vi.fn()}
        loggedIn={true}
      />
    )

    expect(screen.getAllByText(/no chat history yet/i).length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: /new chat/i })[0])
    expect(onNewChat).toHaveBeenCalledTimes(1)

    await user.click(screen.getAllByRole('button')[0])
    expect(onToggleSidebar).toHaveBeenCalled()
  })

  it('loads selected session and navigates to profile from user card', async () => {
    const user = userEvent.setup()
    const onLoadSession = vi.fn()

    render(
      <Sidebar
        user={{ name: 'Alice', email: 'alice@example.com' }}
        chatHistory={[{ sessionId: 's-1', title: 'Budget chat', date: 'Today' }]}
        sidebarOpen={true}
        onToggleSidebar={vi.fn()}
        onNewChat={vi.fn()}
        onLoadSession={onLoadSession}
        loggedIn={true}
      />
    )

    await user.click(screen.getAllByText('Budget chat')[0])
    expect(onLoadSession).toHaveBeenCalledWith('s-1')

    await user.click(screen.getAllByText('alice@example.com')[0])
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })
})
