import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './sidebar'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('Main Sidebar', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('navigates from profile item to profile when outside profile page', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/portfolio']}>
        <Sidebar user={{ name: 'Alice', email: 'alice@example.com' }} logout={vi.fn()} />
      </MemoryRouter>
    )

    await user.click(screen.getByText('Profile'))
    expect(mockNavigate).toHaveBeenCalledWith('/profile', { state: { section: 'general' } })
  })

  it('triggers section change on profile page and supports logout', async () => {
    const user = userEvent.setup()
    const onSectionChange = vi.fn()
    const logout = vi.fn()

    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Sidebar
          user={{ name: 'Alice', email: 'alice@example.com' }}
          logout={logout}
          activeSection="general"
          onSectionChange={onSectionChange}
        />
      </MemoryRouter>
    )

    await user.click(screen.getByText('Profile'))
    expect(onSectionChange).toHaveBeenCalledWith('general')

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
