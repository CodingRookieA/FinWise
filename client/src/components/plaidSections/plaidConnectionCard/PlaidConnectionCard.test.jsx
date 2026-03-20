import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaidConnectionCard } from './PlaidConnectionCard'

describe('PlaidConnectionCard', () => {
  it('renders connect button and calls onConnect', async () => {
    const user = userEvent.setup()
    const onConnect = vi.fn()

    render(<PlaidConnectionCard onConnect={onConnect} />)

    await user.click(screen.getByRole('button', { name: /connect with plaid/i }))
    expect(onConnect).toHaveBeenCalledTimes(1)
  })
})
