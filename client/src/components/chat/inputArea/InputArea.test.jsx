import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InputArea } from './InputArea'

describe('InputArea', () => {
  it('disables send button when message is empty or loading', () => {
    const onSendMessage = vi.fn()

    const { rerender } = render(
      <InputArea
        message=""
        loading={false}
        onMessageChange={vi.fn()}
        onSendMessage={onSendMessage}
        onKeyPress={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()

    rerender(
      <InputArea
        message="   "
        loading={false}
        onMessageChange={vi.fn()}
        onSendMessage={onSendMessage}
        onKeyPress={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()

    rerender(
      <InputArea
        message="hello"
        loading={true}
        onMessageChange={vi.fn()}
        onSendMessage={onSendMessage}
        onKeyPress={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows ellipsis on send button while streaming response is in progress', () => {
    render(
      <InputArea
        message="hello"
        loading={true}
        streamingResponse={true}
        onMessageChange={vi.fn()}
        onSendMessage={vi.fn()}
        onKeyPress={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Response streaming' })).toHaveTextContent('...')
  })

  it('calls onSendMessage when send button is clicked', async () => {
    const user = userEvent.setup()
    const onSendMessage = vi.fn()

    render(
      <InputArea
        message="hello"
        loading={false}
        onMessageChange={vi.fn()}
        onSendMessage={onSendMessage}
        onKeyPress={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    expect(onSendMessage).toHaveBeenCalledTimes(1)
  })

  it('passes keyboard and change events to handlers', () => {
    const onMessageChange = vi.fn()
    const onKeyPress = vi.fn()

    render(
      <InputArea
        message="hello"
        loading={false}
        onMessageChange={onMessageChange}
        onSendMessage={vi.fn()}
        onKeyPress={onKeyPress}
      />
    )

    const textbox = screen.getByPlaceholderText('What would you like to know?')

    fireEvent.change(textbox, { target: { value: 'new value' } })
    expect(onMessageChange).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(textbox, { key: 'Enter', code: 'Enter' })
    expect(onKeyPress).toHaveBeenCalledTimes(1)
  })
})
