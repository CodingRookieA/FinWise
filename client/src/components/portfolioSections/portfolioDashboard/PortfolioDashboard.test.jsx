import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PortfolioDashboard } from './PortfolioDashboard'

const hookState = {
  assets: [{ _id: '1', symbol: 'VFV', quantity: 10 }],
  loading: false,
  error: null,
  addAsset: vi.fn().mockResolvedValue(true),
  updateAsset: vi.fn().mockResolvedValue(true),
  deleteAsset: vi.fn().mockResolvedValue(true)
}

vi.mock('../../../hooks/usePortfolio', () => ({
  usePortfolio: () => hookState
}))

vi.mock('./PortfolioOverview', () => ({
  PortfolioOverview: ({ totalAssets, totalShares, onAdd }) => (
    <div>
      <p>{`overview:${totalAssets}:${totalShares}`}</p>
      <button onClick={onAdd}>open-add</button>
    </div>
  )
}))

vi.mock('./PortfolioTable', () => ({
  PortfolioTable: ({ onEdit, onDelete }) => (
    <div>
      <button onClick={() => onEdit({ _id: '1', symbol: 'VFV', quantity: 10 })}>edit-asset</button>
      <button onClick={() => onDelete('1')}>delete-asset</button>
    </div>
  )
}))

vi.mock('./AddAssetModal', () => ({
  AddAssetModal: ({ open, onSave, initialData }) => (
    <div>
      <p>{`add-modal-open:${String(open)}`}</p>
      <p>{`edit-symbol:${initialData?.symbol || ''}`}</p>
      <button onClick={() => onSave({ symbol: 'XQQ', quantity: 3 })}>save-asset</button>
    </div>
  )
}))

vi.mock('./DeleteAssetModal', () => ({
  DeleteAssetModal: ({ open, onConfirm }) => (
    <div>
      <p>{`delete-modal-open:${String(open)}`}</p>
      <button onClick={onConfirm}>confirm-delete</button>
    </div>
  )
}))

describe('PortfolioDashboard', () => {
  beforeEach(() => {
    hookState.loading = false
    hookState.error = null
    hookState.assets = [{ _id: '1', symbol: 'VFV', quantity: 10 }]
    hookState.addAsset.mockClear()
    hookState.updateAsset.mockClear()
    hookState.deleteAsset.mockClear()
  })

  it('shows loading state', () => {
    hookState.loading = true
    render(<PortfolioDashboard />)

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('renders overview and handles add/edit/delete flows', async () => {
    const user = userEvent.setup()

    render(<PortfolioDashboard />)

    expect(screen.getByText('overview:1:10')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'open-add' }))
    expect(screen.getByText('add-modal-open:true')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'save-asset' }))
    expect(hookState.addAsset).toHaveBeenCalledWith({ symbol: 'XQQ', quantity: 3 })

    await user.click(screen.getByRole('button', { name: 'edit-asset' }))
    expect(screen.getByText('edit-symbol:VFV')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'save-asset' }))
    expect(hookState.updateAsset).toHaveBeenCalledWith('1', { symbol: 'XQQ', quantity: 3 })

    await user.click(screen.getByRole('button', { name: 'delete-asset' }))
    expect(screen.getByText('delete-modal-open:true')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'confirm-delete' }))
    expect(hookState.deleteAsset).toHaveBeenCalledWith('1')
  })
})
