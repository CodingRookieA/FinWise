import { render, screen } from '@testing-library/react'
import { MessagesList } from './MessagesList'

describe('MessagesList', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: vi.fn()
    })
  })

  it('renders user and assistant messages and loading state', () => {
    render(
      <MessagesList
        user={{ name: 'Alice' }}
        loading={true}
        messages={[
          { role: 'user', content: 'Hello there' },
          { role: 'assistant', content: 'Hi **Alice**' }
        ]}
      />
    )

    expect(screen.getByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
