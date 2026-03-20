import { render, screen, waitFor } from '@testing-library/react'
import { VerifyingEmailPage } from './VerifyingEmailPage'

vi.mock('../../utils/constants', () => ({ SERVERURL: 'http://test-server' }))

describe('VerifyingEmailPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    window.history.pushState({}, '', '/verifying-email?token=t-123')
  })

  it('shows server error message when verification fails', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ error: 'Token expired' })
    })

    render(<VerifyingEmailPage />)

    await waitFor(() => {
      expect(screen.getByText('Token expired')).toBeInTheDocument()
    })
  })
})
