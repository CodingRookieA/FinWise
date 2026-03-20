import { render, screen } from '@testing-library/react'
import AccountInfo from './account_info'

describe('AccountInfo', () => {
  it('renders account details and initials fallback', () => {
    render(<AccountInfo name="Alice Brown" email="alice@example.com" />)

    expect(screen.getByText('Alice Brown')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('AB')).toBeInTheDocument()
  })

  it('uses U initials when name is missing', () => {
    render(<AccountInfo name="" email="unknown@example.com" />)

    expect(screen.getByText('U')).toBeInTheDocument()
  })
})
