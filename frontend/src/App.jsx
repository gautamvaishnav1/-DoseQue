import TasksPage from './pages/TasksPage'

// App only provides the page shell (header + main area).
// All task logic lives in TasksPage.
function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">DoseQue</h1>
            <p className="text-sm text-muted">Task Management Dashboard</p>
          </div>
          <span className="badge bg-primary/10 text-primary">Node · Express · MongoDB · Redis</span>
        </div>
      </header>

      <TasksPage />
    </div>
  )
}

export default App
