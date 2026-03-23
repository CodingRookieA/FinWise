import { render, screen } from '@testing-library/react'
import { PlaidHero } from './PlaidHero'

describe('PlaidHero', () => {
  it('renders plaid heading', () => {
    render(<PlaidHero />)

    expect(screen.getByText('Connect Your')).toBeInTheDocument()
    expect(screen.getByText('Bank')).toBeInTheDocument()
  })
})
