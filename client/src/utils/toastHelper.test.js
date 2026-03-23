import toast from 'react-hot-toast'
import toastHelper from './toastHelper'

vi.mock('react-hot-toast', () => {
  const toastFn = vi.fn()
  toastFn.dismiss = vi.fn()
  toastFn.success = vi.fn()
  toastFn.error = vi.fn()
  toastFn.loading = vi.fn()
  return { default: toastFn }
})

describe('toastHelper', () => {
  beforeEach(() => {
    toast.dismiss.mockClear()
    toast.success.mockClear()
    toast.error.mockClear()
    toast.loading.mockClear()
  })

  it('handles success and error toasts', () => {
    toastHelper('success', 'done')
    expect(toast.dismiss).toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith('done', expect.any(Object))

    toastHelper('error', 'bad')
    expect(toast.error).toHaveBeenCalledWith('bad', expect.any(Object))
  })

  it('handles loading and default toasts', () => {
    toastHelper('loading', 'wait')
    expect(toast.loading).toHaveBeenCalledWith('wait', expect.any(Object))

    toastHelper('other', 'hello')
    expect(toast).toHaveBeenCalledWith('hello', expect.any(Object))
  })
})
