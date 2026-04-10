import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { selectStoryLocalFolder } from '../api.js'
import StoryModal from '../components/StoryModal.jsx'

vi.mock('../api.js', () => ({
  selectStoryLocalFolder: vi.fn(() => Promise.resolve({ path: '' }))
}))

const baseStory = {
  mvp: 'Core Platform MVP',
  title: 'Story tracker',
  link: 'https://dev.azure.com/example/story-1',
  branch: 'feature/story-tracker',
  folder: '/Users/hans/workspaces/core-platform/story-tracker',
  status: 'In Progress'
}

describe('StoryModal', () => {
  it('closes on backdrop click while creating', async () => {
    const onClose = vi.fn()

    render(
      <StoryModal
        mode="create"
        initialStory={null}
        mvpOptions={['Core Platform MVP']}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    await userEvent.click(screen.getByTestId('story-modal-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close on backdrop click while editing', () => {
    const onClose = vi.fn()

    render(
      <StoryModal
        mode="edit"
        initialStory={baseStory}
        mvpOptions={['Core Platform MVP']}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByTestId('story-modal-backdrop'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('submits the local folder field', async () => {
    const onConfirm = vi.fn()
    selectStoryLocalFolder.mockResolvedValueOnce({
      path: '/Users/hans/workspaces/core-platform/folder-story'
    })

    render(
      <StoryModal
        mode="create"
        initialStory={null}
        mvpOptions={['Core Platform MVP']}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    )

    await userEvent.type(screen.getByLabelText(/^mvp$/i), 'Core Platform MVP')
    await userEvent.type(screen.getByLabelText(/title/i), 'Folder story')
    await userEvent.type(screen.getByLabelText(/link or path/i), 'https://example.com/story')
    await userEvent.type(screen.getByLabelText(/^branch/i), 'feature/folder-story')
    await userEvent.click(screen.getByRole('button', { name: /choose folder/i }))
    await userEvent.selectOptions(screen.getByLabelText(/status/i), 'In Progress')
    await userEvent.click(screen.getByRole('button', { name: /create story/i }))

    expect(selectStoryLocalFolder).toHaveBeenCalledWith('')
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({
      branch: 'feature/folder-story',
      folder: '/Users/hans/workspaces/core-platform/folder-story'
    }))
  })

  it('keeps the form body scrollable while separating the action row', () => {
    render(
      <StoryModal
        mode="edit"
        initialStory={baseStory}
        mvpOptions={['Core Platform MVP']}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByTestId('story-modal-surface')).toHaveClass('max-h-[calc(100vh-2rem)]')
    expect(screen.getByTestId('story-modal-scroll-body')).toHaveClass('overflow-y-auto')
    expect(screen.getByTestId('story-modal-actions')).toHaveClass('border-t')
    expect(screen.getByRole('button', { name: /save story/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })
})
