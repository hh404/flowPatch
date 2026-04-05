import TaskCard from './TaskCard.jsx'

const HEADER_COLORS = {
  'Doing': 'border-indigo-300',
  'Waiting': 'border-yellow-300',
  'Done': 'border-green-300'
}

export default function Column({ title, tasks, onUpdate, onDelete }) {
  const borderColor = HEADER_COLORS[title] ?? 'border-gray-300'

  return (
    <div className="flex flex-col flex-1 min-w-0">
      <div className={`flex items-center gap-2 pb-2 mb-3 border-b-2 ${borderColor}`}>
        <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-700">{title}</h2>
        <span className="text-xs font-bold bg-gray-100 rounded-full px-2 py-0.5 text-gray-600">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto">
        {tasks.length === 0
          ? <p className="text-xs text-gray-400 italic text-center py-6">Nothing here</p>
          : tasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
            ))
        }
      </div>
    </div>
  )
}
