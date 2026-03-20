import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

vi.mock('./utils/constants', () => ({ SERVERURL: 'http://test-server' }))
vi.mock('react-hot-toast', () => ({ Toaster: () => <div>toaster</div> }))

vi.mock('./pages/home/HomePage', () => ({ HomePage: () => <div>home-page</div> }))
vi.mock('./pages/portfolio/PortfolioPage', () => ({ PortfolioPage: () => <div>portfolio-page</div> }))
vi.mock('./pages/plaid/PlaidConnectPage', () => ({ PlaidConnectPage: () => <div>plaid-page</div> }))
vi.mock('./pages/questionnaire/QuestionnairePage', () => ({ QuestionnairePage: () => <div>questionnaire-page</div> }))
vi.mock('./pages/profile/ProfilePage', () => ({ default: () => <div>profile-page</div> }))
vi.mock('./pages/googleRedirectPage/GoogleRedirectPage', () => ({ GoogleRedirectPage: () => <div>google-redirect-page</div> }))
vi.mock('./pages/chat/ChatPage', () => ({ ChatPage: () => <div>chat-page</div> }))
vi.mock('./pages/notFound/NotFoundPage', () => ({ NotFoundPage: () => <div>not-found-page</div> }))
vi.mock('./pages/emailVerification/EmailVerificationPage', () => ({ EmailVerificationPage: () => <div>email-verification-page</div> }))
vi.mock('./pages/emailVerification/VerifyingEmailPage', () => ({ VerifyingEmailPage: () => <div>verifying-email-page</div> }))

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('renders home page for unauthenticated user', async () => {
    window.history.pushState({}, '', '/')
    fetch.mockResolvedValueOnce({ ok: false })

    render(<App />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('home-page')).toBeInTheDocument()
    })
  })

  it('renders protected profile route for verified user', async () => {
    window.history.pushState({}, '', '/profile')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'u-1', isVerified: true })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('profile-page')).toBeInTheDocument()
    })
  })

  it('redirects unverified user to email verification route', async () => {
    window.history.pushState({}, '', '/profile')
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'u-1', isVerified: false })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('email-verification-page')).toBeInTheDocument()
    })
  })
})
