import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddAssetModal } from './AddAssetModal'

describe('AddAssetModal', () => {
  it('creates asset with entered values', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(<AddAssetModal open={true} onClose={vi.fn()} onSave={onSave} />)

    await user.type(screen.getByLabelText(/stock symbol/i), 'VFV')
    await user.type(screen.getByLabelText('Quantity'), '10')
    await user.click(screen.getByRole('button', { name: 'Save Asset' }))

    expect(onSave).toHaveBeenCalledWith({ symbol: 'VFV', quantity: '10' })
  })

  it('prefills values when editing', () => {
    render(
      <AddAssetModal
        open={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        initialData={{ symbol: 'XQQ', quantity: 3 }}
      />
    )

    expect(screen.getByDisplayValue('XQQ')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })
})
