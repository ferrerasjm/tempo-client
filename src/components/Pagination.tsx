function paginationPages(current: number, total: number) {
  const pages = new Set([1, total]);
  const start = Math.max(1, Math.min(current - 1, total - 4));
  for (
    let page = start;
    page <= Math.min(total, Math.max(5, current + 1));
    page++
  )
    pages.add(page);
  const result: (number | string)[] = [];
  const sorted = [...pages].sort((a, b) => a - b);
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push(`gap-${page}`);
    result.push(page);
  });
  return result;
}

export function Pagination({
  currentPage,
  pageCount,
  pageSize,
  label,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  pageCount: number;
  pageSize: number;
  label: string;
  itemLabel: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  return (
    <nav className="task-pagination" aria-label={label}>
      <button
        type="button"
        aria-label="Previous page"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14 7-5 5 5 5" />
        </svg>
      </button>
      {paginationPages(currentPage, pageCount).map((item) =>
        typeof item === "number" ? (
          <button
            type="button"
            key={item}
            aria-label={`Page ${item}`}
            aria-current={currentPage === item ? "page" : undefined}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="pagination-gap" aria-hidden="true">
            …
          </span>
        ),
      )}
      <button
        type="button"
        aria-label="Next page"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m10 7 5 5-5 5" />
        </svg>
      </button>
      <label className="task-page-size">
        <span className="sr-only">{itemLabel}</span>
        <select
          aria-label={itemLabel}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {[5, 10, 20].map((size) => (
            <option value={size} key={size}>
              {size} / page
            </option>
          ))}
        </select>
      </label>
      <span className="sr-only" role="status">
        Page {currentPage} of {pageCount}
      </span>
    </nav>
  );
}
