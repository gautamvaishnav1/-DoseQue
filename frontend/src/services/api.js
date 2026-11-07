// All API calls for the app live here — components never call fetch directly.
// Base URL comes from the VITE_API_URL environment variable
// (see .env for local development, docker-compose for the container build).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Shared request helper: performs the fetch, parses the JSON body,
// and throws a readable Error when the backend answers with an error status.
async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    // Response had no JSON body — handled by the status check below.
  }

  if (!response.ok) {
    // Backend errors look like: { success: false, message, errors?: [...] }
    const message = body?.message || `Request failed with status ${response.status}`
    const details = Array.isArray(body?.errors)
      ? body.errors.map((e) => `${e.field}: ${e.message}`).join(', ')
      : ''
    const error = new Error(details ? `${message} (${details})` : message)
    error.status = response.status
    throw error
  }

  return body
}

// GET /api/tasks?page=1&limit=5&status=Pending
export function listTasks({ page = 1, limit = 5, status = '' } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  return request(`/tasks?${params.toString()}`)
}

// POST /api/tasks
export function createTask(taskData) {
  return request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  })
}

// PUT /api/tasks/:id
export function updateTask(id, taskData) {
  return request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  })
}

// DELETE /api/tasks/:id
export function deleteTask(id) {
  return request(`/tasks/${id}`, { method: 'DELETE' })
}
