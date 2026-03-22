import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Field from './field'

describe('Field', () => {
  it('renders text input and emits change events', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <Field
        meta={{ field: 'income', title: 'Income', type: 'fill', inputType: 'number' }}
        value=""
        onChange={onChange}
      />
    )

    await user.type(screen.getByRole('spinbutton'), '2000')
    expect(onChange).toHaveBeenCalled()
  })

  it('renders mcq select and supports selecting options', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <Field
        meta={{ field: 'risk', title: 'Risk', type: 'mcq', options: ['Low', 'High'] }}
        value=""
        onChange={onChange}
      />
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: 'High' }))
    expect(onChange).toHaveBeenCalledWith('risk', 'High')
  })
})
