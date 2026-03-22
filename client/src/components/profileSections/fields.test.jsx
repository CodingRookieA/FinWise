import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Fields from './fields'

vi.mock('./field', () => ({
  default: ({ meta, value, onChange }) => (
    <input
      aria-label={meta.field}
      value={value ?? ''}
      onChange={(e) => onChange(meta.field, e.target.value)}
    />
  )
}))

describe('Profile Fields', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('loads fields and profile values, then saves transformed payload', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: [
            {
              field: 'monthlyIncome',
              section: 'general',
              type: 'fill',
              inputType: 'number'
            },
            {
              field: 'riskLevel',
              section: 'risk',
              type: 'mcq',
              options: ['Low', 'High']
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ monthlyIncome: '', riskLevel: 'Low' })
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<Fields activeSection="general" />)

    expect(await screen.findByLabelText('monthlyIncome')).toBeInTheDocument()
    expect(screen.queryByLabelText('riskLevel')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('monthlyIncome'), '3000')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(
        3,
        'http://localhost:9000/api/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            monthlyIncome: 3000,
            riskLevel: 'Low'
          })
        })
      )
    })

    expect(await screen.findByText('Saved!')).toBeInTheDocument()
  })

  it('shows load error when meta request fails', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

    render(<Fields activeSection="general" />)

    expect(await screen.findByText('Failed to load profile fields (meta).')).toBeInTheDocument()
  })

  it('shows no fields available when active section has no fields', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: [
            {
              field: 'riskLevel',
              section: 'risk',
              type: 'mcq',
              options: ['Low', 'High']
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ riskLevel: 'Low' })
      })

    render(<Fields activeSection="general" />)

    expect(await screen.findByText('No fields available.')).toBeInTheDocument()
  })
})
