import { useEffect, useRef, useState } from 'react'
import Pagination from '../components/Pagination'
import TaskForm from '../components/TaskForm'
import TaskItem from '../components/TaskItem'
import * as api from '../services/api'

const PAGE_SIZE = 5 // small page size so pagination is easy to demonstrate
const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed']

function TasksPage() {
  // --- list state ---
  const [tasks, setTasks] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, totalPages: 0, totalTasks: 0, limit: PAGE_SIZE })
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0) // bump to force a refetch

  // --- form state ---
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null) // null = create mode
  const [saving, setSaving] = useState(false)

  // --- feedback / delete state ---
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message }
  const [deletingId, setDeletingId] = useState(null)

  // Guards against out-of-order responses when the user clicks pages quickly:
  // only the most recent request may update the state.
  const requestIdRef = useRef(0)

  async function loadTasks() {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setLoadError('')

    try {
      const response = await api.listTasks({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
      })

      if (requestId !== requestIdRef.current) return // a newer request started

      setTasks(response.data)
      setMeta(response.meta)

      // After deleting the last task on a page, this page no longer exists —
      // step back to the last page that still has tasks.
      if (response.data.length === 0 && page > 1) {
        setPage(Math.max(1, Math.ceil(response.meta.totalTasks / response.meta.limit)))
      }
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setLoadError(error.message)
    } finally {
      if (requestId === requestIdRef.current) setLoading(false)
    }
  }

  // Re-fetch the list. Always changes exactly ONE piece of state so the
  // effect below runs exactly once (no double requests).
  function refetch({ toFirstPage = false } = {}) {
    if (toFirstPage && page !== 1) {
      setPage(1) // effect refetches because `page` changed
    } else {
      setRefreshKey((key) => key + 1) // effect refetches because `refreshKey` changed
    }
  }

  // Load the list whenever the page, the filter, or refreshKey changes.
  useEffect(() => {
    loadTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, refreshKey])

  // Auto-hide feedback banners after 4 seconds.
  useEffect(() => {
    if (!feedback) return undefined
    const timer = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timer)
  }, [feedback])

  // --- handlers ---

  function handleFilterChange(value) {
    setStatusFilter(value)
    setPage(1) // filtering always restarts at page 1
  }

  function openCreateForm() {
    setEditingTask(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingTask(null)
  }

  async function handleFormSubmit(formData) {
    setSaving(true)
    try {
      if (editingTask) {
        await api.updateTask(editingTask._id, formData)
        setFeedback({ type: 'success', message: 'Task updated successfully.' })
        closeForm()
        refetch() // task stays on the same page (sorting uses createdAt)
      } else {
        await api.createTask(formData)
        setFeedback({ type: 'success', message: 'Task created successfully.' })
        closeForm()
        refetch({ toFirstPage: true }) // new tasks appear first
      }
    } catch (error) {
      // The form stays open so the user can fix the input.
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(task) {
    setDeletingId(task._id)
    try {
      await api.deleteTask(task._id)
      setFeedback({ type: 'success', message: `Deleted "${task.title}".` })
      refetch() // loadTasks steps back a page automatically if this page is now empty
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    } finally {
      setDeletingId(null)
    }
  }

  function handleEdit(task) {
    setEditingTask(task)
    setShowForm(true)
  }

  // --- render ---

  return (
    <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      {/* success / error feedback banner */}
      {feedback && (
        <div
          role="status"
          className={`rounded-md border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger'
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* toolbar: status filter, total count, create button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(event) => handleFilterChange(event.target.value)}
            aria-label="Filter tasks by status"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className="text-sm text-muted">
            {meta.totalTasks} {meta.totalTasks === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {!showForm && (
          <button type="button" className="btn btn-primary" onClick={openCreateForm}>
            + New Task
          </button>
        )}
      </div>

      {/* create / edit form */}
      {showForm && (
        <TaskForm
          key={editingTask?._id || 'create'} // switch modes = fresh form state
          initialTask={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          saving={saving}
        />
      )}

      {/* task list with loading, error and empty states */}
      {loading ? (
        <div className="card flex items-center justify-center gap-3 p-8">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm text-muted">Loading tasks…</span>
        </div>
      ) : loadError ? (
        <div className="card border-danger/30 p-8 text-center">
          <p className="font-medium text-danger">Could not load tasks</p>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
          <button
            type="button"
            className="btn btn-primary mt-4"
            onClick={() => setRefreshKey((key) => key + 1)}
          >
            Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-medium">No tasks found</p>
          <p className="mt-1 text-sm text-muted">
            {statusFilter
              ? 'No tasks match the selected status filter.'
              : 'Create your first task to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deletingId === task._id}
            />
          ))}
        </div>
      )}

      {/* pagination controls (backend drives the numbers) */}
      <Pagination
        currentPage={page}
        totalPages={meta.totalPages}
        onPageChange={setPage}
        disabled={loading}
      />
    </main>
  )
}

export default TasksPage
