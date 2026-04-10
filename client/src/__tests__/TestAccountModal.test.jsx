import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import TestAccountModal from '../components/TestAccountModal.jsx'

const baseTestAccount = {
  env: 'staging',
  account: 'qa.flowpatch@example.com',
  password: 'Secret123!',
  note: 'Use for smoke tests',
  simulator: 'iPhone 16 Pro'
}

describe('TestAccountModal', () => {
  it('closes on backdrop click while creating', async () => {
    const onClose = vi.fn()

    render(
      <TestAccountModal
        mode="create"
        initialTestAccount={null}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByTestId('test-account-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click while editing', () => {
    const onClose = vi.fn()

    render(
      <TestAccountModal
        mode="edit"
        initialTestAccount={baseTestAccount}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByTestId('test-account-modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits env, credentials, optional note, and simulator marker', async () => {
    const onConfirm = vi.fn()

    render(
      <TestAccountModal
        mode="create"
        initialTestAccount={null}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/^env$/i), 'staging')
    await userEvent.type(screen.getByLabelText(/^account$/i), 'qa.flowpatch@example.com')
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Secret123!')
    await userEvent.type(screen.getByLabelText(/simulator marker/i), 'iPhone 16 Pro')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(onConfirm).toHaveBeenCalledWith({
      env: 'staging',
      account: 'qa.flowpatch@example.com',
      password: 'Secret123!',
      note: '',
      simulator: 'iPhone 16 Pro'
    })
  })

  it('keeps the form body scrollable while separating the action row', () => {
    render(
      <TestAccountModal
        mode="edit"
        initialTestAccount={baseTestAccount}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId('test-account-modal-surface')).toHaveClass('max-h-[calc(100vh-2rem)]')
    expect(screen.getByTestId('test-account-modal-scroll-body')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('test-account-modal-actions')).toHaveClass('border-t')
    expect(screen.getByRole('button', { name: /save account/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
