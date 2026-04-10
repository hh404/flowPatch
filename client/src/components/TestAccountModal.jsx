import { useEffect, useRef, useState } from 'react'

function buildInitialState(testAccount) {
  return {
    env: testAccount?.env ?? '',
    account: testAccount?.account ?? '',
    password: testAccount?.password ?? '',
    note: testAccount?.note ?? '',
    simulator: testAccount?.simulator ?? '',
    usedBy: testAccount?.usedBy ?? '',
    bankId: testAccount?.bankId ?? ''
  }
}

export default function TestAccountModal({ mode = 'create', initialTestAccount, onConfirm, onClose }) {
  const [form, setForm] = useState(() => buildInitialState(initialTestAccount))
  const accountRef = useRef(null)
  const allowBackdropClose = mode !== 'edit'

  useEffect(() => {
    accountRef.current?.focus()
    accountRef.current?.select()
  }, [])

  useEffect(() => {
    setForm(buildInitialState(initialTestAccount))
  }, [initialTestAccount])

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(event) {
    event.preventDefault()

    const env = form.env.trim()
    const account = form.account.trim()
    const password = form.password.trim()
    const note = form.note.trim()
    const simulator = form.simulator.trim()
    const usedBy = form.usedBy.trim()
    const bankId = form.bankId.trim()

    if (!env || !account || !password) return

    onConfirm({ env, account, password, note, simulator, usedBy, bankId })
  }

  return (
    <div
      data-testid="test-account-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm"
      onClick={event => {
        if (allowBackdropClose && event.target === event.currentTarget) onClose()
      }}
    >
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
        <div
          data-testid="test-account-modal-surface"
          className="flex w-full max-w-md max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          <div className="border-b border-gray-100 px-5 pb-4 pt-5">
            <h2 className="text-base font-semibold text-gray-800">
              {mode === 'edit' ? 'Edit Test Account' : 'Add Test Account'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div
              data-testid="test-account-modal-scroll-body"
              className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 pt-4"
            >
              <div>
                <label htmlFor="test-account-env" className="mb-1 block text-xs font-medium text-gray-500">Env</label>
                <input
                  id="test-account-env"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.env}
                  onChange={event => setForm(current => ({ ...current, env: event.target.value }))}
                  placeholder="dev / qa / staging / prod"
                />
              </div>

              <div>
                <label htmlFor="test-account-account" className="mb-1 block text-xs font-medium text-gray-500">Account</label>
                <input
                  id="test-account-account"
                  ref={accountRef}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.account}
                  onChange={event => setForm(current => ({ ...current, account: event.target.value }))}
                  placeholder="qa.flowpatch@example.com"
                />
              </div>

              <div>
                <label htmlFor="test-account-password" className="mb-1 block text-xs font-medium text-gray-500">Password</label>
                <input
                  id="test-account-password"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.password}
                  onChange={event => setForm(current => ({ ...current, password: event.target.value }))}
                  placeholder="Secret123!"
                />
              </div>

              <div>
                <label htmlFor="test-account-simulator" className="mb-1 block text-xs font-medium text-gray-500">
                  Simulator Marker <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="test-account-simulator"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.simulator}
                  onChange={event => setForm(current => ({ ...current, simulator: event.target.value }))}
                  placeholder="iPhone 16 Pro / Android Pixel 8"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mark which simulator is currently logged into this account.
                </p>
              </div>

              <div>
                <label htmlFor="test-account-used-by" className="mb-1 block text-xs font-medium text-gray-500">
                  In Use By <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="test-account-used-by"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.usedBy}
                  onChange={event => setForm(current => ({ ...current, usedBy: event.target.value }))}
                  placeholder="Hans / QA team / nobody"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Track who is currently using or holding this shared account.
                </p>
              </div>

              <div>
                <label htmlFor="test-account-bank-id" className="mb-1 block text-xs font-medium text-gray-500">
                  Bank ID <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  id="test-account-bank-id"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.bankId}
                  onChange={event => setForm(current => ({ ...current, bankId: event.target.value }))}
                  placeholder="bankid-123456"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional bank identifier for this account. It will be copyable from the list.
                </p>
              </div>

              <div>
                <label htmlFor="test-account-note" className="mb-1 block text-xs font-medium text-gray-500">
                  Note <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="test-account-note"
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={form.note}
                  onChange={event => setForm(current => ({ ...current, note: event.target.value }))}
                  placeholder="Where this account is used, reset rules, MFA notes..."
                />
              </div>
            </div>

            <div
              data-testid="test-account-modal-actions"
              className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4"
            >
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.env.trim() || !form.account.trim() || !form.password.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode === 'edit' ? 'Save Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
