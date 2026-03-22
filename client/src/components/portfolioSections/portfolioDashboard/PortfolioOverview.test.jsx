import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortfolioOverview } from './PortfolioOverview'

describe('PortfolioOverview', () => {
  it('renders totals and handles add asset action', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()

    render(<PortfolioOverview totalAssets={3} totalShares={120} onAdd={onAdd} />)

    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add asset/i }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })
})
