import { renderHook, act, waitFor } from '@testing-library/react'
import { usePortfolio } from './usePortfolio'
import toastHelper from '../utils/toastHelper'

vi.mock('../utils/constants', () => ({
  SERVERURL: 'http://test-server'
}))

vi.mock('../utils/toastHelper', () => ({
  default: vi.fn()
}))

describe('usePortfolio', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    toastHelper.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('loads assets on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: '1', name: 'Asset A' }]
    })

    const { result } = renderHook(() => usePortfolio())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assets).toEqual([{ _id: '1', name: 'Asset A' }])
    expect(result.current.error).toBeNull()
  })

  it('adds an asset and refreshes the list', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, json: async () => [{ _id: '2', name: 'Asset B' }] })

    const { result } = renderHook(() => usePortfolio())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.addAsset({ name: 'Asset B' })
    })

    expect(success).toBe(true)
    expect(result.current.assets).toEqual([{ _id: '2', name: 'Asset B' }])
  })

  it('reports add asset error from server message', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Duplicate asset' })
      })

    const { result } = renderHook(() => usePortfolio())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.addAsset({ name: 'Asset B' })
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe('Duplicate asset')
    expect(toastHelper).toHaveBeenCalledWith('error', 'Duplicate asset')
  })

  it('deletes an asset from local state on success', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { _id: '1', name: 'Asset A' },
          { _id: '2', name: 'Asset B' }
        ]
      })
      .mockResolvedValueOnce({ ok: true })

    const { result } = renderHook(() => usePortfolio())

    await waitFor(() => {
      expect(result.current.assets.length).toBe(2)
    })

    await act(async () => {
      await result.current.deleteAsset('1')
    })

    expect(result.current.assets).toEqual([{ _id: '2', name: 'Asset B' }])
  })
})
