import { useEffect, useState } from 'react'
import { useTasks } from './hooks/useTasks.js'
import { useMvpFolders } from './hooks/useMvpFolders.js'
import { useStories } from './hooks/useStories.js'
import { useTaskReminders } from './hooks/useTaskReminders.js'
import { selectStoryLocalFolder } from './api.js'
import QuickInput from './components/QuickInput.jsx'
import Column from './components/Column.jsx'
import TaskModal from './components/TaskModal.jsx'
import StoryPanel from './components/StoryPanel.jsx'
import StoryModal from './components/StoryModal.jsx'
import { compareTasksByPriority, normalizePriority } from './utils/priority.js'
import { normalizeTaskStatus } from './utils/taskStatus.js'
import { plusHours } from './utils/reminders.js'
import { DEFAULT_STORY_MVP, normalizeStoryMvp } from './utils/storyMvp.js'

const COLUMNS = [
  { title: 'Inbox', status: 'inbox' },
  { title: 'Doing', status: 'doing' },
  { title: 'Waiting', status: 'waiting' },
  { title: 'Done', status: 'done' },
]

const PAGES = {
  board: 'board',
  stories: 'stories'
}

function getPageFromHash() {
  const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase()
  return hash === PAGES.stories ? PAGES.stories : PAGES.board
}

function getPageHash(page) {
  return page === PAGES.stories ? '#stories' : '#board'
}

function ShellHeader({ currentPage, onNavigate, summary }) {
  const tabs = [
    { key: PAGES.board, label: 'Task Board' },
    { key: PAGES.stories, label: 'Story List' }
  ]

  return (
    <header className="border-b border-slate-800 bg-slate-900 px-4 py-4 text-white shadow">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold tracking-tight">FlowPatch</span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
            {currentPage === PAGES.board ? 'Task Board' : 'Story List'}
          </span>
          <nav className="flex items-center gap-2" aria-label="Primary">
            {tabs.map(tab => {
              const isActive = currentPage === tab.key

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onNavigate(tab.key)}
                  aria-pressed={isActive}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-slate-900'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          {summary.map(item => (
            <span key={item.label} className={item.className ?? 'rounded-full bg-white/10 px-2.5 py-1'}>
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}

function BoardPage({ currentPage, onNavigate }) {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useTasks()
  const [editor, setEditor] = useState(null)
  const [draggedTaskId, setDraggedTaskId] = useState(null)
  const [dragOverStatus, setDragOverStatus] = useState(null)
  const normalizedTasks = tasks.map(task => ({
    ...task,
    status: normalizeTaskStatus(task.status),
    priority: normalizePriority(task.priority)
  }))
  const {
    alerts,
    dismissAlert,
    notificationsSupported,
    notificationPermission,
    requestPermission
  } = useTaskReminders(normalizedTasks, updateTask)
  const counts = {
    inbox: normalizedTasks.filter(task => task.status === 'inbox').length,
    doing: normalizedTasks.filter(task => task.status === 'doing').length,
    waiting: normalizedTasks.filter(task => task.status === 'waiting').length,
    done: normalizedTasks.filter(task => task.status === 'done').length
  }
  const openHighPriorityCount = normalizedTasks.filter(task => task.status !== 'done' && task.priority === 'high').length

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  async function handleConfirm(data) {
    if (editor?.mode === 'edit') {
      await updateTask(editor.task.id, data)
    } else {
      await addTask(data)
    }

    setEditor(null)
  }

  function openCreateEditor(draft) {
    setEditor({ mode: 'create', task: draft })
  }

  function openEditEditor(task) {
    setEditor({ mode: 'edit', task })
  }

  function handleDragStart(event, task) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    setDraggedTaskId(task.id)
  }

  function handleDragEnd() {
    setDraggedTaskId(null)
    setDragOverStatus(null)
  }

  function handleDragEnter(status) {
    setDragOverStatus(status)
  }

  function handleDragLeave(status) {
    setDragOverStatus(current => (current === status ? null : current))
  }

  async function handleDropTask(status) {
    if (!draggedTaskId) return

    const draggedTask = normalizedTasks.find(task => task.id === draggedTaskId)
    if (!draggedTask) {
      handleDragEnd()
      return
    }

    if (draggedTask.status !== status) {
      await updateTask(draggedTaskId, { status })
    }

    handleDragEnd()
  }

  async function handleQuickRemind(task) {
    await updateTask(task.id, {
      remindAt: plusHours(1),
      remindedAt: null
    })
  }

  const summary = [
    { label: `Inbox ${counts.inbox}` },
    { label: `Doing ${counts.doing}` },
    { label: `Waiting ${counts.waiting}` },
    { label: `Done ${counts.done}` },
    { label: `High ${openHighPriorityCount}`, className: 'rounded-full bg-rose-500/15 px-2.5 py-1 text-rose-200' }
  ]

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader currentPage={currentPage} onNavigate={onNavigate} summary={summary} />

      {notificationsSupported && notificationPermission !== 'granted' && (
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span>Enable browser notifications for pipeline and follow-up reminders.</span>
            <button
              type="button"
              onClick={requestPermission}
              className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-slate-700"
            >
              Enable Notifications
            </button>
          </div>
        </section>
      )}

      <QuickInput onAdd={addTask} onOpenDetails={openCreateEditor} />

      {alerts.length > 0 && (
        <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">Reminders</div>
          <div className="flex flex-col gap-2">
            {alerts.map(alert => (
              <div key={alert.key} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white px-3 py-2">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">{alert.title}</span>
                  <span className="text-slate-500"> needs attention now.</span>
                </div>
                <button
                  type="button"
                  onClick={() => dismissAlert(alert.key)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <main className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-4">
        {COLUMNS.map(({ title, status }) => (
          <Column
            key={title}
            title={title}
            status={status}
            tasks={normalizedTasks.filter(task => task.status === status).sort(compareTasksByPriority)}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onEdit={openEditEditor}
            onQuickRemind={handleQuickRemind}
            onDropTask={handleDropTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedTaskId={draggedTaskId}
            isDragActive={dragOverStatus === status}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          />
        ))}
      </main>

      {editor && (
        <TaskModal
          mode={editor.mode}
          initialTask={editor.task}
          onConfirm={handleConfirm}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  )
}

function StoriesPage({ currentPage, onNavigate }) {
  const { stories, loading, error, addStory, updateStory, deleteStory } = useStories()
  const {
    mvpFolders,
    loading: mvpFoldersLoading,
    error: mvpFoldersError,
    setMvpFolder,
    setMvpShortcuts,
    deleteMvpFolder
  } = useMvpFolders()
  const [storyEditor, setStoryEditor] = useState(null)
  const mvpNames = [...new Set([
    ...stories.map(story => normalizeStoryMvp(story.mvp)),
    ...mvpFolders.map(item => normalizeStoryMvp(item.name))
  ])].sort((left, right) => left.localeCompare(right))
  const storyCount = stories.length
  const shortcutCount = mvpFolders.reduce((total, item) => total + (item.shortcuts?.length ?? 0), 0)

  if (loading || mvpFoldersLoading) return <div className="flex h-screen items-center justify-center bg-slate-100 text-gray-400">Loading…</div>
  if (error || mvpFoldersError) return <div className="flex h-screen items-center justify-center bg-slate-100 text-red-400">Error loading data</div>

  async function handleStoryConfirm(data) {
    if (storyEditor?.mode === 'edit') {
      await updateStory(storyEditor.story.id, data)
    } else {
      await addStory(data)
    }

    setStoryEditor(null)
  }

  function openCreateStoryEditor(mvp = DEFAULT_STORY_MVP) {
    setStoryEditor({ mode: 'create', story: { mvp: normalizeStoryMvp(mvp) } })
  }

  function openEditStoryEditor(story) {
    setStoryEditor({ mode: 'edit', story })
  }

  async function handleChooseMvpFolder(name, currentFolder = '') {
    const result = await selectStoryLocalFolder(currentFolder)
    const path = result.path?.trim() ?? ''
    if (!path) return

    await setMvpFolder(name, path)
  }

  async function handleClearMvpFolder(name) {
    await deleteMvpFolder(name)
  }

  async function handleSetMvpShortcuts(name, shortcuts) {
    await setMvpShortcuts(name, shortcuts)
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 font-sans text-slate-900">
      <ShellHeader
        currentPage={currentPage}
        onNavigate={onNavigate}
        summary={[
          { label: `MVPs ${mvpNames.length}` },
          { label: `Stories ${storyCount}` },
          { label: `Shortcuts ${shortcutCount}` }
        ]}
      />

      <main className="flex-1 overflow-auto p-4">
        <StoryPanel
          stories={stories}
          mvpFolders={mvpFolders}
          onAdd={openCreateStoryEditor}
          onEdit={openEditStoryEditor}
          onDelete={deleteStory}
          onSetMvpFolder={handleChooseMvpFolder}
          onClearMvpFolder={handleClearMvpFolder}
          onSetMvpShortcuts={handleSetMvpShortcuts}
        />
      </main>

      {storyEditor && (
        <StoryModal
          mode={storyEditor.mode}
          initialStory={storyEditor.story}
          mvpOptions={mvpNames}
          onConfirm={handleStoryConfirm}
          onClose={() => setStoryEditor(null)}
        />
      )}
    </div>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(() => getPageFromHash())

  useEffect(() => {
    function handleHashChange() {
      setCurrentPage(getPageFromHash())
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  function navigateTo(page) {
    const nextPage = page === PAGES.stories ? PAGES.stories : PAGES.board
    setCurrentPage(nextPage)
    window.location.hash = getPageHash(nextPage)
  }

  return currentPage === PAGES.stories
    ? <StoriesPage currentPage={currentPage} onNavigate={navigateTo} />
    : <BoardPage currentPage={currentPage} onNavigate={navigateTo} />
}
