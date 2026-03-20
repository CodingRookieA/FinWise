import { render, screen } from '@testing-library/react'
import { NotFoundPage } from './NotFoundPage'

describe('NotFoundPage', () => {
  it('renders not found message and return link', () => {
    render(<NotFoundPage />)

    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Return to Home' })).toHaveAttribute('href', '/')
  })
})
