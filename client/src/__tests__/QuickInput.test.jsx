import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import QuickInput from '../components/QuickInput.jsx'

describe('QuickInput', () => {
  it('renders input placeholder', () => {
    render(<QuickInput onAdd={vi.fn()} />)
    expect(screen.getByPlaceholderText(/add task/i)).toBeInTheDocument()
  })

  it('calls onAdd with title and detected type on Enter', async () => {
    const onAdd = vi.fn()
    render(<QuickInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'wait pipeline{Enter}')
    expect(onAdd).toHaveBeenCalledWith({ title: 'wait pipeline', type: 'waiting' })
  })

  it('clears input after submit', async () => {
    render(<QuickInput onAdd={vi.fn()} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'some task{Enter}')
    expect(input).toHaveValue('')
  })

  it('does not call onAdd for empty input', async () => {
    const onAdd = vi.fn()
    render(<QuickInput onAdd={onAdd} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, '{Enter}')
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('shows type badge preview as user types', async () => {
    render(<QuickInput onAdd={vi.fn()} />)
    const input = screen.getByPlaceholderText(/add task/i)
    await userEvent.type(input, 'wait')
    expect(screen.getByText('waiting')).toBeInTheDocument()
  })
})
