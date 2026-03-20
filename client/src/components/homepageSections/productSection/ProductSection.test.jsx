import { render, screen } from '@testing-library/react'
import { ProductSection } from './ProductSection'

describe('ProductSection', () => {
  it('renders product heading and feature cards', () => {
    render(<ProductSection />)

    expect(screen.getByText('Our')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('AI Analysis')).toBeInTheDocument()
    expect(screen.getByText('Smart Recommendations')).toBeInTheDocument()
    expect(screen.getByText('Risk Assessment')).toBeInTheDocument()
    expect(screen.getByText('Performance Tracking')).toBeInTheDocument()
  })
})
