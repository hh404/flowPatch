import TaskCard from './TaskCard.jsx'

const HEADER_COLORS = {
  'Inbox': 'border-slate-300',
  'Doing': 'border-indigo-300',
  'Waiting': 'border-yellow-300',
  'Done': 'border-green-300'
}

const EMPTY_STATES = {
  Inbox: 'Fast capture lands here first.',
  Doing: 'Move the few things you are actively pushing right now.',
  Waiting: 'Blocked or delegated items belong here.',
  Done: 'Completed work lands here until you clear it.'
}

export default function Column({
  title,
  status,
  tasks,
  onUpdate,
  onDelete,
  onEdit,
  onQuickRemind,
  onDropTask,
  onDragStart,
  onDragEnd,
  draggedTaskId,
  isDragActive,
  onDragEnter,
  onDragLeave
}) {
  const borderColor = HEADER_COLORS[title] ?? 'border-gray-300'

  return (
    <div
      aria-label={`${title} column`}
      onDragOver={event => event.preventDefault()}
      onDragEnter={() => onDragEnter(status)}
      onDragLeave={() => onDragLeave(status)}
      onDrop={() => onDropTask(status)}
      className={`flex flex-col flex-1 min-w-0 rounded-2xl border border-transparent p-2 transition-colors ${isDragActive ? 'border-indigo-300 bg-indigo-50/60' : ''}`}
    >
      <div className={`flex items-center gap-2 pb-2 mb-3 border-b-2 ${borderColor}`}>
        <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">{title}</h2>
        <span className="text-xs font-bold bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {tasks.length === 0
          ? <p className="text-xs text-gray-400 italic text-center py-6">{EMPTY_STATES[title] ?? 'Nothing here'}</p>
          : tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onEdit={onEdit}
                onQuickRemind={onQuickRemind}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedTaskId === task.id}
              />
            ))
        }
      </div>
    </div>
  )
}
