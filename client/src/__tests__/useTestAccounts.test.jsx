import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTestAccounts } from '../hooks/useTestAccounts.js'

const mockTestAccounts = [
  {
    id: 'account-1',
    env: 'staging',
    account: 'qa.flowpatch@example.com',
    password: 'Secret123!',
    note: 'Use for smoke tests',
    simulator: 'iPhone 16 Pro',
    usedBy: 'Hans',
    bankId: 'bankid-001',
    createdAt: '2026-04-09T10:00:00Z',
    updatedAt: '2026-04-09T10:00:00Z'
  }
]

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useTestAccounts', () => {
  it('fetches test accounts on mount', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => mockTestAccounts })
    const { result } = renderHook(() => useTestAccounts())

    await waitFor(() => expect(result.current.testAccounts).toHaveLength(1))
    expect(result.current.testAccounts[0].env).toBe('staging')
    expect(result.current.testAccounts[0].account).toBe('qa.flowpatch@example.com')
    expect(result.current.testAccounts[0].simulator).toBe('iPhone 16 Pro')
    expect(result.current.testAccounts[0].usedBy).toBe('Hans')
    expect(result.current.testAccounts[0].bankId).toBe('bankid-001')
  })

  it('addTestAccount posts and appends the returned account', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTestAccounts[0] })

    const { result } = renderHook(() => useTestAccounts())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.addTestAccount({
        env: 'staging',
        account: 'qa.flowpatch@example.com',
        password: 'Secret123!',
        note: 'Use for smoke tests',
        simulator: 'iPhone 16 Pro',
        usedBy: 'Hans',
        bankId: 'bankid-001'
      })
    })

    expect(result.current.testAccounts).toHaveLength(1)
    expect(fetch).toHaveBeenCalledWith('/api/test-accounts', expect.objectContaining({ method: 'POST' }))
  })

  it('updateTestAccount patches and replaces the account in state', async () => {
    const updated = {
      ...mockTestAccounts[0],
      env: 'prod',
      password: 'Updated123!',
      note: 'Prod verification account',
      simulator: '',
      usedBy: '',
      bankId: ''
    }

    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTestAccounts })
      .mockResolvedValueOnce({ ok: true, json: async () => updated })

    const { result } = renderHook(() => useTestAccounts())
    await waitFor(() => expect(result.current.testAccounts).toHaveLength(1))

    await act(async () => {
      await result.current.updateTestAccount('account-1', {
        env: 'prod',
        password: 'Updated123!',
        note: 'Prod verification account',
        simulator: '',
        usedBy: '',
        bankId: ''
      })
    })

    expect(result.current.testAccounts[0].env).toBe('prod')
    expect(result.current.testAccounts[0].password).toBe('Updated123!')
    expect(result.current.testAccounts[0].note).toBe('Prod verification account')
    expect(result.current.testAccounts[0].simulator).toBe('')
    expect(result.current.testAccounts[0].usedBy).toBe('')
    expect(result.current.testAccounts[0].bankId).toBe('')
  })

  it('deleteTestAccount removes the account from state', async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockTestAccounts })
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null })

    const { result } = renderHook(() => useTestAccounts())
    await waitFor(() => expect(result.current.testAccounts).toHaveLength(1))

    await act(async () => {
      await result.current.deleteTestAccount('account-1')
    })

    expect(result.current.testAccounts).toHaveLength(0)
  })
})
