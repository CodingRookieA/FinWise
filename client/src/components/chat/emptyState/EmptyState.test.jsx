import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders quick actions and triggers sample question callback', async () => {
    const user = userEvent.setup()
    const onSampleQuestion = vi.fn()

    render(<EmptyState onSampleQuestion={onSampleQuestion} />)

    expect(screen.getByText(/how can i help you/i)).toBeInTheDocument()
    expect(screen.getByText('Quick Actions')).toBeInTheDocument()

    await user.click(screen.getByText('What should I invest in?'))
    expect(onSampleQuestion).toHaveBeenCalledWith('What should I invest in?')
  })
})
