import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders hero content and calls CTA handler', async () => {
    const user = userEvent.setup()
    const handleModalOpen = vi.fn()

    render(<HeroSection handleModalOpen={handleModalOpen} />)

    expect(screen.getByText(/your ai-powered/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try finwise/i }))
    expect(handleModalOpen).toHaveBeenCalledTimes(1)
  })
})
