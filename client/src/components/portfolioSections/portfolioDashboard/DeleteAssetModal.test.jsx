import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteAssetModal } from './DeleteAssetModal'

describe('DeleteAssetModal', () => {
  it('calls cancel and confirm handlers', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onConfirm = vi.fn()

    render(<DeleteAssetModal open={true} onClose={onClose} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
