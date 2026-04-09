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
})
