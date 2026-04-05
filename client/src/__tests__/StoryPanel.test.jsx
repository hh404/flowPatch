import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StoryPanel from '../components/StoryPanel.jsx'

const stories = [
  {
    id: 'story-1',
    mvp: 'Core Platform MVP',
    title: 'Implement FlowPatch board',
    link: 'https://dev.azure.com/example/story-1',
    status: 'Ready for Develop',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z'
  },
  {
    id: 'story-2',
    mvp: 'Search MVP',
    title: 'Polish story tracker',
    link: 'https://dev.azure.com/example/story-2',
    status: 'Merged',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-05T09:30:00Z'
  }
]

describe('StoryPanel', () => {
  it('renders the active mvp and its stories', () => {
    render(<StoryPanel stories={stories} onAdd={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByRole('tab', { name: /core platform mvp/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /search mvp/i })).toBeInTheDocument()
    expect(screen.getByText('Implement FlowPatch board')).toBeInTheDocument()
    expect(screen.queryByText('Polish story tracker')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Implement FlowPatch board' })).toHaveAttribute('href', stories[0].link)
  })

  it('shows empty state when no stories exist', () => {
    render(<StoryPanel stories={[]} onAdd={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText(/no stories yet/i)).toBeInTheDocument()
  })

  it('calls onAdd when add story button clicked', async () => {
    const onAdd = vi.fn()
    render(<StoryPanel stories={stories} onAdd={onAdd} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /^add story$/i }))
    expect(onAdd).toHaveBeenCalledWith()
  })

  it('passes the active mvp name when adding inside the current view', async () => {
    const onAdd = vi.fn()
    render(<StoryPanel stories={stories} onAdd={onAdd} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /add to core platform mvp/i }))
    expect(onAdd).toHaveBeenCalledWith('Core Platform MVP')
  })

  it('switches to another mvp tab', async () => {
    render(<StoryPanel stories={stories} onAdd={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('tab', { name: /search mvp/i }))
    expect(screen.getByText('Polish story tracker')).toBeInTheDocument()
    expect(screen.queryByText('Implement FlowPatch board')).not.toBeInTheDocument()
  })

  it('calls onEdit when edit clicked', async () => {
    const onEdit = vi.fn()
    render(<StoryPanel stories={stories} onAdd={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /edit story implement flowpatch board/i }))
    expect(onEdit).toHaveBeenCalledWith(stories[0])
  })
})
