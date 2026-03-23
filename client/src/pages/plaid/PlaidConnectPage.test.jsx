import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlaidConnectPage } from './PlaidConnectPage'

vi.mock('../../components/sidebar/sidebar', () => ({
  default: ({ user }) => <div>{`sidebar-user:${user.name}`}</div>
}))

vi.mock('../../components/plaidSections/plaidHero/PlaidHero', () => ({
  PlaidHero: () => <div>plaid-hero</div>
}))

vi.mock('../../components/plaidSections/plaidConnectionCard/PlaidConnectionCard', () => ({
  PlaidConnectionCard: ({ onConnect }) => (
    <button onClick={onConnect}>connect-plaid</button>
  )
}))

describe('PlaidConnectPage', () => {
  it('renders sections and handles connect action', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    render(<PlaidConnectPage user={{ name: 'Alice' }} logout={vi.fn()} />)

    expect(screen.getByText('sidebar-user:Alice')).toBeInTheDocument()
    expect(screen.getByText('plaid-hero')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'connect-plaid' }))

    expect(logSpy).toHaveBeenCalledWith('Plaid connect button clicked')
    expect(alertSpy).toHaveBeenCalledWith('Plaid integration will be connected here')
  })
})
