import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilePage from './ProfilePage'

vi.mock('../../components/sidebar/sidebar', () => ({
  default: ({ activeSection, onSectionChange, user, logout }) => (
    <div>
      <p>{`sidebar-active:${activeSection}`}</p>
      <p>{`sidebar-user:${user.name}`}</p>
      <button onClick={() => onSectionChange('security')}>switch-section</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}))

vi.mock('../../components/profileSections/placeholder_content', () => ({
  default: ({ user, activeSection }) => (
    <div>
      <p>{`content-user:${user.name}`}</p>
      <p>{`content-section:${activeSection}`}</p>
    </div>
  )
}))

describe('ProfilePage', () => {
  it('starts on general section and updates section after sidebar interaction', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    render(
      <ProfilePage
        user={{ name: 'Alice', email: 'alice@example.com' }}
        logout={logout}
      />
    )

    expect(screen.getByText('sidebar-active:general')).toBeInTheDocument()
    expect(screen.getByText('content-section:general')).toBeInTheDocument()
    expect(screen.getByText('sidebar-user:Alice')).toBeInTheDocument()
    expect(screen.getByText('content-user:Alice')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'switch-section' }))
    expect(screen.getByText('content-section:security')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'logout' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
