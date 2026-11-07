// Previous/Next buttons driven directly by the backend's pagination metadata.
function Pagination({ currentPage, totalPages, onPageChange, disabled }) {
  const lastPage = Math.max(1, totalPages)

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={disabled || currentPage <= 1}
      >
        ← Previous
      </button>

      <span className="text-sm text-muted">
        Page {currentPage} of {lastPage}
      </span>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={disabled || currentPage >= lastPage}
      >
        Next →
      </button>
    </div>
  )
}

export default Pagination
