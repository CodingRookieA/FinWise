import { render, screen } from '@testing-library/react'
import ProfileContent from './placeholder_content'

vi.mock('./account_info', () => ({
  default: ({ email }) => <div>{`account:${email}`}</div>
}))

vi.mock('./fields', () => ({
  default: ({ activeSection }) => <div>{`fields:${activeSection}`}</div>
}))

describe('ProfileContent', () => {
  it('renders account info and fields for active section', () => {
    render(
      <ProfileContent
        user={{ name: 'Alice', email: 'alice@example.com', picture: '' }}
        activeSection="general"
      />
    )

    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('account:alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('fields:general')).toBeInTheDocument()
  })
})
