import { useState } from 'react'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High']

// Create/edit form used for both operations:
// - initialTask is null        -> create mode
// - initialTask is a task      -> edit mode (fields start with its values)
// Client-side validation (empty title) is shown inline; API errors and
// success messages are shown by the parent page's feedback banner.
function TaskForm({ initialTask, onSubmit, onCancel, saving }) {
  const [title, setTitle] = useState(initialTask?.title || '')
  const [description, setDescription] = useState(initialTask?.description || '')
  const [status, setStatus] = useState(initialTask?.status || 'Pending')
  const [priority, setPriority] = useState(initialTask?.priority || 'Medium')
  const [formError, setFormError] = useState('')

  const isEditMode = Boolean(initialTask)

  async function handleSubmit(event) {
    event.preventDefault()

    if (!title.trim()) {
      setFormError('Title is required.')
      return
    }

    setFormError('')
    // The parent handles the API call itself: on success it shows a success
    // banner and refreshes the list; on failure it shows an error banner.
    // It never throws, so no try/catch is needed here.
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
    })
  }

  return (
    <form className="card p-4" onSubmit={handleSubmit}>
      <h2 className="mb-4 font-semibold">
        {isEditMode ? `Edit task: ${initialTask.title}` : 'Create a new task'}
      </h2>

      {formError && (
        <p className="mb-3 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {formError}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="task-title">
            Title *
          </label>
          <input
            id="task-title"
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Finish assignment report"
            maxLength={200}
            disabled={saving}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label" htmlFor="task-description">
            Description
          </label>
          <textarea
            id="task-description"
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details…"
            maxLength={2000}
            disabled={saving}
          />
        </div>

        <div>
          <label className="label" htmlFor="task-status">
            Status
          </label>
          <select
            id="task-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor="task-priority">
            Priority
          </label>
          <select
            id="task-priority"
            className="input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={saving}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : isEditMode ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </form>
  )
}

export default TaskForm
