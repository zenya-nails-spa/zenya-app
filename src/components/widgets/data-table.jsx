import { useState, useMemo, useEffect } from 'react';

const SortArrows = ({ dir }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-flex',
      flexDirection: 'column',
      lineHeight: 0,
      marginLeft: 5,
      verticalAlign: 'middle',
      fontSize: 8,
    }}
  >
    <span style={{ color: dir === 'asc' ? 'var(--text-brand)' : 'var(--border-strong)' }}>▲</span>
    <span style={{ color: dir === 'desc' ? 'var(--text-brand)' : 'var(--border-strong)' }}>▼</span>
  </span>
);

function compareByRule(a, b, rule, columns) {
  const col = columns.find((c) => c.key === rule.key);
  if (!col) return 0;
  const getValue = col.sortValue ?? ((row) => row[col.key]);
  const va = getValue(a);
  const vb = getValue(b);
  if (va == null && vb == null) return 0;
  if (va == null) return 1; // nulls always last, regardless of direction
  if (vb == null) return -1;
  const factor = rule.dir === 'asc' ? 1 : -1;
  if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb), 'es') * factor;
  return (va - vb) * factor;
}

// maxSortKeys=1 (default) is the original single-column behavior: click
// cycles desc → asc → cleared, and clicking a different column replaces it.
// maxSortKeys>1 lets multiple columns stay active at once, in click order —
// click an unsorted column to add it as the next-priority rule (bumping the
// lowest-priority rule out once at capacity); click an already-active column
// to cycle its direction in place, clearing it (and shifting the rest up)
// on the third click.
const DataTable = ({
  columns = [],
  rows = [],
  renderCell,
  style,
  onSortedRowsChange,
  onSortChange,
  page,
  pageSize,
  maxSortKeys = 1,
}) => {
  const multi = maxSortKeys > 1;
  const [sort, setSort] = useState(multi ? [] : null);

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    if (!multi) {
      setSort((prev) => {
        if (prev?.key !== col.key) return { key: col.key, dir: 'desc' };
        if (prev.dir === 'desc') return { key: col.key, dir: 'asc' };
        return null; // third click restores original order
      });
      return;
    }
    setSort((prev) => {
      const list = prev ?? [];
      const idx = list.findIndex((r) => r.key === col.key);
      if (idx === -1) {
        const next = [...list, { key: col.key, dir: 'desc' }];
        if (next.length > maxSortKeys) {
          // keep the higher-priority rules intact, replace the lowest-priority slot
          return [...next.slice(0, maxSortKeys - 1), { key: col.key, dir: 'desc' }];
        }
        return next;
      }
      if (list[idx].dir === 'desc') {
        return list.map((r, i) => (i === idx ? { ...r, dir: 'asc' } : r));
      }
      return list.filter((_, i) => i !== idx); // third click on this column clears it
    });
  };

  useEffect(() => {
    onSortChange?.(sort);
    // eslint-disable-next-line
  }, [sort]);

  const sortedRows = useMemo(() => {
    const rules = multi ? sort : sort ? [sort] : [];
    if (!rules.length) return rows;
    return [...rows].sort((a, b) => {
      for (const rule of rules) {
        const cmp = compareByRule(a, b, rule, columns);
        if (cmp !== 0) return cmp;
      }
      return 0;
    });
  }, [rows, columns, sort, multi]);

  // Lets parent components (e.g. an export button) mirror the full sorted
  // set, independent of the current page — export should never be limited
  // to what's currently visible on screen.
  useEffect(() => {
    onSortedRowsChange?.(sortedRows);
  }, [sortedRows]);

  // Pagination (optional) slices for display only, after sorting — it never
  // affects onSortedRowsChange above.
  const displayRows = useMemo(() => {
    if (page == null || pageSize == null) return sortedRows;
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize]);

  const sortInfo = (col) => {
    if (!multi) return sort?.key === col.key ? { dir: sort.dir, priority: null } : null;
    const idx = (sort ?? []).findIndex((r) => r.key === col.key);
    return idx === -1 ? null : { dir: sort[idx].dir, priority: sort.length > 1 ? idx + 1 : null };
  };

  return (
    <div style={{ overflowX: 'auto', ...style }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => {
              const info = sortInfo(col);
              return (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  title={
                    col.sortable
                      ? multi
                        ? 'Clic para ordenar por esta columna; clic en otra para agregarla como siguiente criterio (hasta 3); clic 3 veces para quitarla'
                        : 'Ordenar'
                      : undefined
                  }
                  style={{
                    textAlign: col.align || 'left',
                    padding: '8px 12px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--fw-semibold)',
                    letterSpacing: 'var(--ls-label)',
                    textTransform: 'uppercase',
                    color: info ? 'var(--text-brand)' : 'var(--text-muted)',
                    borderBottom: '1px solid var(--border-subtle)',
                    whiteSpace: col.nowrap ? 'nowrap' : undefined,
                    background: 'var(--surface-sunken)',
                    cursor: col.sortable ? 'pointer' : undefined,
                    userSelect: col.sortable ? 'none' : undefined,
                  }}
                >
                  {col.label}
                  {col.sortable && <SortArrows dir={info?.dir ?? null} />}
                  {info?.priority && (
                    <span
                      style={{
                        marginLeft: 4,
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'var(--text-brand)',
                        verticalAlign: 'super',
                      }}
                    >
                      {info.priority}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="z-row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '10px 12px',
                    borderBottom: rowIndex < displayRows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    color: 'var(--text-body)',
                    whiteSpace: col.nowrap ? 'nowrap' : undefined,
                    verticalAlign: 'middle',
                  }}
                >
                  {renderCell ? renderCell(row, col.key, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
