import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomSection } from './BottomSection'

describe('BottomSection', () => {
  it('renders CTA and calls modal handler', async () => {
    const user = userEvent.setup()
    const handleModalOpen = vi.fn()

    render(<BottomSection handleModalOpen={handleModalOpen} />)

    await user.click(screen.getByRole('button', { name: /try finwise now/i }))
    expect(handleModalOpen).toHaveBeenCalledTimes(1)
  })
})
