import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import StoryPanel from '../components/StoryPanel.jsx'
import { openStoryLocalLink } from '../api.js'

vi.mock('../api.js', () => ({
  openStoryLocalLink: vi.fn(() => Promise.resolve({}))
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const stories = [
  {
    id: 'story-1',
    mvp: 'Core Platform MVP',
    title: 'Implement FlowPatch board',
    link: 'https://dev.azure.com/example/story-1',
    folder: '/Users/hans/workspaces/core-platform/implement-flowpatch-board',
    description: 'Draft in [spec](/Users/hans/specs/flowpatch.md) and [tracker](https://example.com/spec)',
    status: 'Ready for Develop',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-04-05T11:00:00Z'
  },
  {
    id: 'story-2',
    mvp: 'Search MVP',
    title: 'Polish story tracker',
    link: 'https://dev.azure.com/example/story-2',
    description: '',
    status: 'Merged',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-04-05T09:30:00Z'
  },
  {
    id: 'story-3',
    mvp: 'Core Platform MVP',
    title: 'Open prototype',
    link: '/Users/hans/mockups/prototype.html',
    description: 'See also /Users/hans/mockups/notes.md',
    status: 'In Review',
    createdAt: '2026-04-05T08:00:00Z',
    updatedAt: '2026-04-05T08:30:00Z'
  }
]

const mvpFolders = [
  {
    name: 'Core Platform MVP',
    folder: '/Users/hans/workspaces/core-platform'
  }
]

describe('StoryPanel', () => {
  it('renders the active mvp and its stories', () => {
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    expect(screen.getByRole('tab', { name: /core platform mvp/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /search mvp/i })).toBeInTheDocument()
    expect(screen.getByText('Implement FlowPatch board')).toBeInTheDocument()
    expect(screen.getByText('Open prototype')).toBeInTheDocument()
    expect(screen.getAllByText('Description')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /open folder for core platform mvp/i })).toHaveTextContent('MVP Folder: core-platform')
    expect(screen.getByRole('button', { name: /open folder for implement flowpatch board/i })).toHaveTextContent('Folder: implement-flowpatch-board')
    expect(screen.getByRole('link', { name: 'tracker' })).toHaveAttribute('href', 'https://example.com/spec')
    expect(screen.queryByText('Polish story tracker')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Implement FlowPatch board' })).toHaveAttribute('href', stories[0].link)
  })

  it('shows empty state when no stories exist', () => {
    render(
      <StoryPanel
        stories={[]}
        mvpFolders={[]}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    expect(screen.getByText(/no stories yet/i)).toBeInTheDocument()
  })

  it('calls onAdd when add story button clicked', async () => {
    const onAdd = vi.fn()
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /^add story$/i }))
    expect(onAdd).toHaveBeenCalledWith()
  })

  it('passes the active mvp name when adding inside the current view', async () => {
    const onAdd = vi.fn()
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={onAdd}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /add to core platform mvp/i }))
    expect(onAdd).toHaveBeenCalledWith('Core Platform MVP')
  })

  it('switches to another mvp tab', async () => {
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('tab', { name: /search mvp/i }))
    expect(screen.getByText('Polish story tracker')).toBeInTheDocument()
    expect(screen.queryByText('Implement FlowPatch board')).not.toBeInTheDocument()
    expect(screen.getByText(/no mvp folder linked yet/i)).toBeInTheDocument()
  })

  it('opens and reveals local filesystem links', async () => {
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /open folder for core platform mvp/i }))
    await userEvent.click(screen.getByRole('button', { name: /open folder for implement flowpatch board/i }))
    await userEvent.click(screen.getByRole('button', { name: 'spec' }))
    await userEvent.click(screen.getByRole('button', { name: /reveal spec/i }))
    await userEvent.click(screen.getByRole('button', { name: /open local path for open prototype/i }))
    await userEvent.click(screen.getByRole('button', { name: /reveal local path for open prototype/i }))

    expect(openStoryLocalLink).toHaveBeenNthCalledWith(1, '/Users/hans/workspaces/core-platform', 'open')
    expect(openStoryLocalLink).toHaveBeenNthCalledWith(2, '/Users/hans/workspaces/core-platform/implement-flowpatch-board', 'open')
    expect(openStoryLocalLink).toHaveBeenNthCalledWith(3, '/Users/hans/specs/flowpatch.md', 'open')
    expect(openStoryLocalLink).toHaveBeenNthCalledWith(4, '/Users/hans/specs/flowpatch.md', 'reveal')
    expect(openStoryLocalLink).toHaveBeenNthCalledWith(5, '/Users/hans/mockups/prototype.html', 'open')
    expect(openStoryLocalLink).toHaveBeenNthCalledWith(6, '/Users/hans/mockups/prototype.html', 'reveal')
  })

  it('lets the active mvp choose and clear its folder', async () => {
    const onSetMvpFolder = vi.fn(() => Promise.resolve())
    const onClearMvpFolder = vi.fn(() => Promise.resolve())

    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSetMvpFolder={onSetMvpFolder}
        onClearMvpFolder={onClearMvpFolder}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: /change mvp folder/i }))
    await userEvent.click(screen.getByRole('button', { name: /^clear$/i }))

    expect(onSetMvpFolder).toHaveBeenCalledWith('Core Platform MVP', '/Users/hans/workspaces/core-platform')
    expect(onClearMvpFolder).toHaveBeenCalledWith('Core Platform MVP')
  })

  it('calls onEdit when edit clicked', async () => {
    const onEdit = vi.fn()
    render(
      <StoryPanel
        stories={stories}
        mvpFolders={mvpFolders}
        onAdd={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onSetMvpFolder={vi.fn()}
        onClearMvpFolder={vi.fn()}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /edit story implement flowpatch board/i }))
    expect(onEdit).toHaveBeenCalledWith(stories[0])
  })
})
