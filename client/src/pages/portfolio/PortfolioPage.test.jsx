import { render, screen } from '@testing-library/react'
import { PortfolioPage } from './PortfolioPage'

vi.mock('../../components/sidebar/sidebar', () => ({
  default: ({ user }) => <div>{`sidebar-user:${user.name}`}</div>
}))

vi.mock('../../components/portfolioSections/portfolioHero/PortfolioHero', () => ({
  PortfolioHero: () => <div>portfolio-hero</div>
}))

vi.mock('../../components/portfolioSections/portfolioDashboard/PortfolioDashboard', () => ({
  PortfolioDashboard: () => <div>portfolio-dashboard</div>
}))

describe('PortfolioPage', () => {
  it('renders sidebar and portfolio sections', () => {
    render(<PortfolioPage user={{ name: 'Alice' }} logout={vi.fn()} />)

    expect(screen.getByText('sidebar-user:Alice')).toBeInTheDocument()
    expect(screen.getByText('portfolio-hero')).toBeInTheDocument()
    expect(screen.getByText('portfolio-dashboard')).toBeInTheDocument()
  })
})
