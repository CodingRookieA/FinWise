import { render, screen } from '@testing-library/react'
import { GoalSection } from './GoalSection'

describe('GoalSection', () => {
  it('renders all goal steps', () => {
    render(<GoalSection />)

    expect(screen.getByText('Our')).toBeInTheDocument()
    expect(screen.getByText('Goal')).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
  })
})
