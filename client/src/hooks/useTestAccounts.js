import { useCallback, useEffect, useState } from 'react'
import { createTestAccount, fetchTestAccounts, patchTestAccount, removeTestAccount } from '../api.js'

function normalizeRequiredText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeOptionalText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeTestAccount(testAccount) {
  return {
    ...testAccount,
    env: normalizeRequiredText(testAccount?.env),
    account: normalizeRequiredText(testAccount?.account),
    password: normalizeRequiredText(testAccount?.password),
    note: normalizeRequiredText(testAccount?.note),
    simulator: normalizeOptionalText(testAccount?.simulator)
  }
}

export function useTestAccounts() {
  const [testAccounts, setTestAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTestAccounts()
      .then(items => setTestAccounts(items.map(normalizeTestAccount)))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const addTestAccount = useCallback(async data => {
    const testAccount = await createTestAccount(data)
    const normalized = normalizeTestAccount(testAccount)
    setTestAccounts(prev => [...prev, normalized])
    return normalized
  }, [])

  const updateTestAccount = useCallback(async (id, changes) => {
    const testAccount = await patchTestAccount(id, changes)
    const normalized = normalizeTestAccount(testAccount)
    setTestAccounts(prev => prev.map(item => (item.id === id ? normalized : item)))
    return normalized
  }, [])

  const deleteTestAccount = useCallback(async id => {
    await removeTestAccount(id)
    setTestAccounts(prev => prev.filter(item => item.id !== id))
  }, [])

  return { testAccounts, loading, error, addTestAccount, updateTestAccount, deleteTestAccount }
}
