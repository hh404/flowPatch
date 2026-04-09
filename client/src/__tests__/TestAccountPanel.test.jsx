import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TestAccountPanel from '../components/TestAccountPanel.jsx'

const testAccounts = [
  {
    id: 'account-1',
    env: 'staging',
    account: 'qa.flowpatch@example.com',
    password: 'Secret123!',
    note: 'Use for smoke tests',
    simulator: 'iPhone 16 Pro',
    createdAt: '2026-04-09T10:00:00Z',
    updatedAt: '2026-04-09T10:00:00Z'
  },
  {
    id: 'account-2',
    env: 'prod',
    account: 'prod.flowpatch@example.com',
    password: 'Prod123!',
    note: '',
    simulator: '',
    createdAt: '2026-04-09T09:00:00Z',
    updatedAt: '2026-04-09T09:00:00Z'
  }
]

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn(() => Promise.resolve())
    }
  })
})

describe('TestAccountPanel', () => {
  it('filters by env, query, and tagged toggle', async () => {
    render(
      <TestAccountPanel
        testAccounts={testAccounts}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    expect(screen.getAllByText('qa.flowpatch@example.com').length).toBeGreaterThan(0)
    expect(screen.getAllByText('prod.flowpatch@example.com').length).toBeGreaterThan(0)

    await userEvent.selectOptions(screen.getByLabelText(/^env$/i), 'prod')
    expect(screen.queryByText('iPhone 16 Pro')).not.toBeInTheDocument()
    expect(screen.getAllByText('prod.flowpatch@example.com').length).toBeGreaterThan(0)

    await userEvent.clear(screen.getByLabelText(/^search$/i))
    await userEvent.type(screen.getByLabelText(/^search$/i), 'qa.flowpatch')
    expect(screen.getByText(/no accounts match the current filters/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))
    await userEvent.click(screen.getByLabelText(/only tagged simulators/i))

    expect(screen.getAllByText('qa.flowpatch@example.com').length).toBeGreaterThan(0)
    expect(screen.queryByText('prod.flowpatch@example.com')).not.toBeInTheDocument()
  })

  it('copies account and password values', async () => {
    render(
      <TestAccountPanel
        testAccounts={testAccounts}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    await userEvent.click(screen.getAllByRole('button', { name: 'Copy Account' })[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('qa.flowpatch@example.com')

    await userEvent.click(screen.getAllByRole('button', { name: 'Copy' })[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Secret123!')
  })
})
