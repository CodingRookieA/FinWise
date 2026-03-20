import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navbar } from './Navbar'

describe('Navbar', () => {
  it('opens login modal for guest and supports chat action', async () => {
    const user = userEvent.setup()
    const handleModalOpen = vi.fn()
    const handleGoToChat = vi.fn()

    render(
      <Navbar
        handleModalOpen={handleModalOpen}
        user={{}}
        handleGoToChat={handleGoToChat}
        logout={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Log in' }))
    expect(handleModalOpen).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Chat as guest' }))
    expect(handleGoToChat).toHaveBeenCalledTimes(1)
  })

  it('calls logout for logged-in user', async () => {
    const user = userEvent.setup()
    const logout = vi.fn()

    render(
      <Navbar
        handleModalOpen={vi.fn()}
        user={{ userId: 'u-1' }}
        handleGoToChat={vi.fn()}
        logout={logout}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Log out' }))
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
