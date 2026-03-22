import { render, screen } from '@testing-library/react'
import { InfoAlert } from './InfoAlert'

describe('InfoAlert', () => {
  it('renders children content', () => {
    render(
      <InfoAlert topOffset="2rem">
        <span>alert-content</span>
      </InfoAlert>
    )

    expect(screen.getByText('alert-content')).toBeInTheDocument()
  })
})
