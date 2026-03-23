import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuestionnaireCard from './card'

describe('QuestionnaireCard', () => {
  it('enables submit after choosing an mcq option and submits selected value', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <QuestionnaireCard
        title="Risk Preference"
        prompt="How much risk can you tolerate?"
        type="mcq"
        options={['Low', 'High']}
        onSubmit={onSubmit}
        currentIndex={0}
        total={2}
      />
    )

    const submitBtn = screen.getByRole('button', { name: 'Submit' })
    expect(submitBtn).toBeDisabled()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Low' }))
    expect(submitBtn).toBeEnabled()

    await user.click(submitBtn)
    expect(onSubmit).toHaveBeenCalledWith('Low')
  })

  it('submits number values as numbers', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    render(
      <QuestionnaireCard
        title="Monthly Income"
        prompt="Enter monthly income"
        type="number"
        onSubmit={onSubmit}
      />
    )

    await user.type(screen.getByRole('spinbutton'), '3500')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith(3500)
  })

  it('shows loading state and disables interactions while saving', () => {
    render(
      <QuestionnaireCard
        title="Monthly Income"
        prompt="Enter monthly income"
        type="number"
        loading={true}
        onPrev={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
})
