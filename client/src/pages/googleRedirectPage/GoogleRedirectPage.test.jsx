import { render, screen, act } from '@testing-library/react'
import { GoogleRedirectPage } from './GoogleRedirectPage'

vi.mock('../../utils/constants', () => ({ SERVERURL: 'http://test-server' }))

describe('GoogleRedirectPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    global.fetch = vi.fn()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows oauth error from url params', () => {
    window.history.pushState({}, '', '/google-redirect?error=access_denied')

    render(<GoogleRedirectPage />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByText('There was a problem signing you in with google')).toBeInTheDocument()
    expect(screen.getByText('Error: access_denied')).toBeInTheDocument()
  })

  it('shows backend error when google login fails', async () => {
    window.history.pushState({}, '', '/google-redirect?code=abc123')
    fetch.mockResolvedValueOnce({
      json: async () => ({ error: 'Invalid code' })
    })

    render(<GoogleRedirectPage />)

    await act(async () => {
      vi.advanceTimersByTime(1000)
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(screen.getByText('Invalid code')).toBeInTheDocument()
  })
})
