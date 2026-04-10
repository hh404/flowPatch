import { useEffect, useState } from 'react'

const ENV_ORDER = ['dev', 'qa', 'staging', 'uat', 'prod', 'production']

function copyTextFallback(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    const copied = document.execCommand('copy')
    if (!copied) throw new Error('copy failed')
  } finally {
    document.body.removeChild(textarea)
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  copyTextFallback(text)
}

function getEnvRank(env) {
  const normalized = env.trim().toLowerCase()
  const index = ENV_ORDER.indexOf(normalized)
  return index === -1 ? ENV_ORDER.length : index
}

function compareEnv(left, right) {
  const rankDiff = getEnvRank(left) - getEnvRank(right)
  if (rankDiff !== 0) return rankDiff
  return left.localeCompare(right)
}

function compareTestAccounts(left, right) {
  const leftTagged = left.simulator ? 0 : 1
  const rightTagged = right.simulator ? 0 : 1

  if (leftTagged !== rightTagged) return leftTagged - rightTagged

  const envDiff = compareEnv(left.env, right.env)
  if (envDiff !== 0) return envDiff

  const updatedDiff = new Date(right.updatedAt ?? 0).getTime() - new Date(left.updatedAt ?? 0).getTime()
  if (updatedDiff !== 0) return updatedDiff

  return left.account.localeCompare(right.account)
}

function getSearchHaystack(testAccount) {
  return [
    testAccount.env,
    testAccount.account,
    testAccount.password,
    testAccount.note,
    testAccount.simulator,
    testAccount.usedBy,
    testAccount.bankId
  ]
    .join('\n')
    .toLowerCase()
}

function filterTestAccounts(testAccounts, { query, env, onlyTagged }) {
  const normalizedQuery = query.trim().toLowerCase()

  return testAccounts.filter(testAccount => {
    if (env && testAccount.env !== env) return false
    if (onlyTagged && !testAccount.simulator) return false
    if (normalizedQuery && !getSearchHaystack(testAccount).includes(normalizedQuery)) return false
    return true
  })
}

function formatUpdatedAt(value) {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString()
}

function CopyButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {children}
    </button>
  )
}

function TestAccountRow({ testAccount, onEdit, onDelete, onCopy }) {
  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm lg:grid-cols-[88px_minmax(0,1.7fr)_minmax(0,1.25fr)_minmax(0,1.6fr)_auto] lg:items-start">
      <div className="flex flex-wrap items-center gap-2 lg:block lg:space-y-2">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
          {testAccount.env}
        </span>
        {testAccount.simulator ? (
          <div className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 lg:flex">
            {testAccount.simulator}
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 lg:block">No simulator</div>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 break-all font-mono text-sm text-slate-800">
            {testAccount.account}
          </div>
          <CopyButton onClick={() => onCopy(testAccount.account, `Copied account for ${testAccount.env}.`)}>
            Copy Account
          </CopyButton>
        </div>
        <div
          data-testid={`test-account-meta-${testAccount.id}`}
          className="mb-2 flex flex-wrap items-center gap-2"
        >
          {testAccount.usedBy ? (
            <div className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-700">
              {testAccount.usedBy}
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">Unassigned</div>
          )}
          {testAccount.bankId ? (
            <div className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
              <span className="font-mono">{testAccount.bankId}</span>
              <CopyButton onClick={() => onCopy(testAccount.bankId, `Copied bank ID for ${testAccount.account}.`)}>
                Copy Bank ID
              </CopyButton>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400">No bank ID</div>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          Updated {formatUpdatedAt(testAccount.updatedAt ?? testAccount.createdAt)}
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Password</div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1 break-all rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-mono text-sm text-slate-800">
            {testAccount.password}
          </div>
          <CopyButton onClick={() => onCopy(testAccount.password, `Copied password for ${testAccount.account}.`)}>
            Copy
          </CopyButton>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Note</div>
        <div className={`rounded-xl border px-3 py-2 text-sm leading-6 ${testAccount.note ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-200 bg-slate-50 italic text-slate-400'}`}>
          {testAccount.note || 'No note'}
        </div>
      </div>

      <div className="flex items-center gap-1 lg:justify-end">
        <button
          type="button"
          aria-label={`Edit test account ${testAccount.account}`}
          onClick={() => onEdit(testAccount)}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          Edit
        </button>
        <button
          type="button"
          aria-label={`Delete test account ${testAccount.account}`}
          onClick={() => onDelete(testAccount.id)}
          className="rounded-lg px-2 py-1 text-xs text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </article>
  )
}

export default function TestAccountPanel({ testAccounts, onAdd, onEdit, onDelete }) {
  const [panelError, setPanelError] = useState('')
  const [panelStatus, setPanelStatus] = useState('')
  const [filterQuery, setFilterQuery] = useState('')
  const [filterEnv, setFilterEnv] = useState('')
  const [onlyTagged, setOnlyTagged] = useState(false)
  const envOptions = [...new Set(testAccounts.map(testAccount => testAccount.env))].sort(compareEnv)
  const sortedAccounts = [...testAccounts].sort(compareTestAccounts)
  const filteredAccounts = filterTestAccounts(sortedAccounts, {
    query: filterQuery,
    env: filterEnv,
    onlyTagged
  })
  const taggedCount = testAccounts.filter(testAccount => testAccount.simulator).length
  const activeFilterCount = [Boolean(filterQuery.trim()), Boolean(filterEnv), onlyTagged].filter(Boolean).length

  useEffect(() => {
    if (!panelStatus) return undefined

    const timer = window.setTimeout(() => {
      setPanelStatus('')
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [panelStatus])

  async function handleCopy(value, message) {
    try {
      await copyTextToClipboard(value)
      setPanelError('')
      setPanelStatus(message)
    } catch {
      setPanelError('Could not copy this value to the clipboard.')
    }
  }

  function clearFilters() {
    setFilterQuery('')
    setFilterEnv('')
    setOnlyTagged(false)
  }

  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Test Accounts</h2>
          <p className="mt-1 text-xs text-slate-500">
            Compact login list with env, simulator marker, and quick copy actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{envOptions.length} envs</span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm">{testAccounts.length} accounts</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">{taggedCount} tagged</span>
          <button
            type="button"
            onClick={() => onAdd()}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
          >
            Add Account
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_180px_auto_auto] lg:items-center">
          <div>
            <label htmlFor="test-account-filter-query" className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>
            <input
              id="test-account-filter-query"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={filterQuery}
              onChange={event => setFilterQuery(event.target.value)}
              placeholder="Filter account, password, simulator, user, bank ID, note..."
            />
          </div>

          <div>
            <label htmlFor="test-account-filter-env" className="mb-1 block text-xs font-medium text-slate-500">
              Env
            </label>
            <select
              id="test-account-filter-env"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={filterEnv}
              onChange={event => setFilterEnv(event.target.value)}
            >
              <option value="">All envs</option>
              {envOptions.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={onlyTagged}
              onChange={event => setOnlyTagged(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Only tagged simulators
          </label>

          <button
            type="button"
            onClick={clearFilters}
            disabled={activeFilterCount === 0}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear Filters
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span>Showing {filteredAccounts.length} of {testAccounts.length}</span>
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-white px-2.5 py-1 font-medium text-slate-600 shadow-sm">
              {activeFilterCount} active filters
            </span>
          )}
        </div>
      </div>

      {panelError && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{panelError}</span>
          <button
            type="button"
            onClick={() => setPanelError('')}
            className="rounded-full border border-rose-200 px-3 py-1 text-xs font-medium transition-colors hover:bg-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {panelStatus && (
        <div className="pointer-events-none fixed right-4 top-4 z-[60]">
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm text-emerald-700 shadow-lg shadow-emerald-900/10 backdrop-blur"
          >
            {panelStatus}
          </div>
        </div>
      )}

      {testAccounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          No test accounts yet. Add the shared credentials you need for simulators and env-specific QA work.
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-500">
          No accounts match the current filters.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="hidden rounded-2xl bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 lg:grid lg:grid-cols-[88px_minmax(0,1.7fr)_minmax(0,1.25fr)_minmax(0,1.6fr)_auto] lg:gap-3">
            <span>Env</span>
            <span>Account</span>
            <span>Password</span>
            <span>Note</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredAccounts.map(testAccount => (
            <TestAccountRow
              key={testAccount.id}
              testAccount={testAccount}
              onEdit={onEdit}
              onDelete={onDelete}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </section>
  )
}
