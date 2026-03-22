import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HomePage } from './HomePage'

vi.mock('../../components/navbar/Navbar', () => ({
  Navbar: ({ handleModalOpen }) => (
    <div>
      <button onClick={handleModalOpen}>open-login-from-navbar</button>
    </div>
  )
}))

vi.mock('../../components/homepageSections/heroSection/HeroSection', () => ({
  HeroSection: ({ handleModalOpen }) => (
    <button onClick={handleModalOpen}>open-login-from-hero</button>
  )
}))

vi.mock('../../components/homepageSections/productSection/ProductSection', () => ({
  ProductSection: () => <div>product-section</div>
}))

vi.mock('../../components/homepageSections/goalSection/GoalSection', () => ({
  GoalSection: () => <div>goal-section</div>
}))

vi.mock('../../components/homepageSections/aboutSection/AboutSection', () => ({
  AboutSection: () => <div>about-section</div>
}))

vi.mock('../../components/homepageSections/bottomSection/BottomSection', () => ({
  BottomSection: ({ handleModalOpen }) => (
    <button onClick={handleModalOpen}>open-login-from-bottom</button>
  )
}))

vi.mock('../../components/loginModal/loginModal', () => ({
  LoginModal: ({ handleModalClose }) => (
    <div>
      <p>mock-login-modal</p>
      <button onClick={handleModalClose}>close-login-modal</button>
    </div>
  )
}))

vi.mock('../../components/alerts/InfoAlert', () => ({
  InfoAlert: ({ children }) => <div>{children}</div>
}))

describe('HomePage', () => {
  const logout = vi.fn()

  it('shows verify email alert for logged in but unverified users', () => {
    render(<HomePage user={{ userId: 'u-1', isVerified: false }} logout={logout} />)

    const verifyLink = screen.getByRole('link', { name: /verify your email/i })
    expect(verifyLink).toBeInTheDocument()
    expect(verifyLink).toHaveAttribute('href', '/email-verification')
  })

  it('does not show verify email alert for verified users', () => {
    render(<HomePage user={{ userId: 'u-1', isVerified: true }} logout={logout} />)

    expect(screen.queryByRole('link', { name: /verify your email/i })).not.toBeInTheDocument()
  })

  it('opens and closes login modal from CTA actions', async () => {
    const user = userEvent.setup()
    render(<HomePage user={{}} logout={logout} />)

    expect(screen.queryByText('mock-login-modal')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'open-login-from-navbar' }))
    expect(screen.getByText('mock-login-modal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'close-login-modal' }))
    await waitFor(() => {
      expect(screen.queryByText('mock-login-modal')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'open-login-from-hero' }))
    expect(screen.getByText('mock-login-modal')).toBeInTheDocument()
  })
})
