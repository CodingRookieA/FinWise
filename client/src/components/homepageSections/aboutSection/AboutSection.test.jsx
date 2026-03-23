import { render, screen } from '@testing-library/react'
import { AboutSection } from './AboutSection'

describe('AboutSection', () => {
  it('renders about content and stats', () => {
    render(<AboutSection />)

    expect(screen.getByText('About Us')).toBeInTheDocument()
    expect(screen.getByText('4K+')).toBeInTheDocument()
    expect(screen.getByText('24HR')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
