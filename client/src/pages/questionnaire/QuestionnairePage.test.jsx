import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuestionnairePage } from './QuestionnairePage'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../../components/questionnaireSections/card', () => ({
  default: ({ title, type, currentIndex, total, onSubmit, onPrev, loading }) => (
    <div>
      <h2>{title}</h2>
      <p>{`type:${type}`}</p>
      <p>{`progress:${currentIndex + 1}/${total}`}</p>
      <button onClick={() => onSubmit(type === 'number' ? 42 : 'Option A')} disabled={loading}>
        submit-answer
      </button>
      <button onClick={onPrev} disabled={!onPrev}>
        prev-question
      </button>
    </div>
  )
}))

describe('QuestionnairePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    global.fetch = vi.fn()
  })

  it('loads questions and renders the first question card', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        questions: [
          {
            field: 'riskPreference',
            title: 'Risk Preference',
            prompt: 'How much risk can you tolerate?',
            type: 'mcq',
            options: ['Option A', 'Option B']
          }
        ]
      })
    })

    render(<QuestionnairePage />)

    expect(screen.getByText(/loading questions/i)).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Risk Preference' })).toBeInTheDocument()
    expect(screen.getByText('progress:1/1')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('submits answers, advances questions, and navigates to chat on completion', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: [
            {
              field: 'riskPreference',
              title: 'Risk Preference',
              prompt: 'How much risk can you tolerate?',
              type: 'mcq',
              options: ['Option A', 'Option B']
            },
            {
              field: 'monthlyIncome',
              title: 'Monthly Income',
              prompt: 'Enter monthly income',
              type: 'fill'
            }
          ]
        })
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })

    render(<QuestionnairePage />)

    expect(await screen.findByRole('heading', { name: 'Risk Preference' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'submit-answer' }))

    expect(await screen.findByRole('heading', { name: 'Monthly Income' })).toBeInTheDocument()
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:9000/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ riskPreference: 'Option A' })
      })
    )

    await user.click(screen.getByRole('button', { name: 'submit-answer' }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/chat', { replace: true })
    })

    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:9000/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ monthlyIncome: 42 })
      })
    )
  })

  it('navigates directly to chat when questionnaire is empty', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: [] })
    })

    render(<QuestionnairePage />)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/chat', { replace: true })
    })
  })

  it('shows an error message when question fetch fails', async () => {
    fetch.mockResolvedValueOnce({ ok: false })

    render(<QuestionnairePage />)

    expect(await screen.findByText('Failed to fetch questions')).toBeInTheDocument()
  })

  it('shows an error message when submit fails', async () => {
    const user = userEvent.setup()

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          questions: [
            {
              field: 'riskPreference',
              title: 'Risk Preference',
              prompt: 'How much risk can you tolerate?',
              type: 'mcq',
              options: ['Option A', 'Option B']
            }
          ]
        })
      })
      .mockResolvedValueOnce({ ok: false })

    render(<QuestionnairePage />)

    expect(await screen.findByRole('heading', { name: 'Risk Preference' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'submit-answer' }))

    expect(await screen.findByText('Failed to save answer')).toBeInTheDocument()
  })

  it('allows skipping questionnaire to chat', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        questions: [
          {
            field: 'riskPreference',
            title: 'Risk Preference',
            prompt: 'How much risk can you tolerate?',
            type: 'mcq',
            options: ['Option A', 'Option B']
          }
        ]
      })
    })

    const user = userEvent.setup()
    render(<QuestionnairePage />)

    await screen.findByRole('heading', { name: 'Risk Preference' })
    await user.click(screen.getByRole('button', { name: 'Skip for now' }))

    expect(mockNavigate).toHaveBeenCalledWith('/chat', { replace: true })
  })
})
