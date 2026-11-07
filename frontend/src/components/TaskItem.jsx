// One task displayed as a card: title, description, status/priority badges,
// creation date and edit/delete actions.
const STATUS_STYLES = {
  Pending: 'bg-warning/10 text-warning',
  'In Progress': 'bg-primary/10 text-primary',
  Completed: 'bg-success/10 text-success',
}

const PRIORITY_STYLES = {
  Low: 'bg-muted/10 text-muted',
  Medium: 'bg-warning/10 text-warning',
  High: 'bg-danger/10 text-danger',
}

function TaskItem({ task, onEdit, onDelete, deleting }) {
  // The browser's built-in confirm() provides the required
  // "are you sure?" step before deleting — simple and dependable.
  function handleDelete() {
    const confirmed = window.confirm(`Delete task "${task.title}"? This cannot be undone.`)
    if (confirmed) {
      onDelete(task)
    }
  }

  return (
    <article className="card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-text">{task.title}</h3>
          {task.description ? (
            <p className="mt-1 text-sm text-muted">{task.description}</p>
          ) : (
            <p className="mt-1 text-sm italic text-muted">No description</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => onEdit(task)}
            disabled={deleting}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`badge ${STATUS_STYLES[task.status] || 'bg-muted/10 text-muted'}`}>
          {task.status}
        </span>
        <span className={`badge ${PRIORITY_STYLES[task.priority] || 'bg-muted/10 text-muted'}`}>
          {task.priority} priority
        </span>
        <span className="ml-auto text-xs text-muted">
          Created {new Date(task.createdAt).toLocaleString()}
        </span>
      </div>
    </article>
  )
}

export default TaskItem
