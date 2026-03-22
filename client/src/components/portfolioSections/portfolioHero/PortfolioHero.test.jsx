import { render, screen } from '@testing-library/react'
import { PortfolioHero } from './PortfolioHero'

describe('PortfolioHero', () => {
  it('renders portfolio hero heading', () => {
    render(<PortfolioHero />)

    expect(screen.getByText('Your')).toBeInTheDocument()
    expect(screen.getByText('Portfolio')).toBeInTheDocument()
  })
})
