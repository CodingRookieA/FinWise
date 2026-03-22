import { render, screen, fireEvent } from '@testing-library/react'
import { EmailVerificationPage } from './EmailVerificationPage'

vi.mock('../../utils/constants', () => ({ SERVERURL: 'http://test-server' }))

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true })
  })

  it('sends resend request and starts cooldown timer', async () => {
    render(<EmailVerificationPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Resend verification email' }))

    expect(fetch).toHaveBeenCalledWith(
      'http://test-server/api/email/sendVerificationEmail',
      expect.objectContaining({ method: 'POST' })
    )

    expect(screen.getByRole('button', { name: /resend in 15s/i })).toBeDisabled()
  })
})
