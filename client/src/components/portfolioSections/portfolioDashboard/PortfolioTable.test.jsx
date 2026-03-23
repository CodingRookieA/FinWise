import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortfolioTable } from './PortfolioTable'

describe('PortfolioTable', () => {
  it('shows empty state when no assets', () => {
    render(<PortfolioTable assets={[]} onEdit={vi.fn()} onDelete={vi.fn()} />)

    expect(screen.getByText(/no assets found/i)).toBeInTheDocument()
  })

  it('renders rows and handles edit/delete callbacks', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()

    render(
      <PortfolioTable
        assets={[{ _id: 'a1', symbol: 'VFV', quantity: 10 }]}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    )

    expect(screen.getByText('VFV')).toBeInTheDocument()

    const buttons = screen.getAllByRole('button')
    await user.click(buttons[0])
    expect(onEdit).toHaveBeenCalledWith({ _id: 'a1', symbol: 'VFV', quantity: 10 })

    await user.click(buttons[1])
    expect(onDelete).toHaveBeenCalledWith('a1')
  })
})
