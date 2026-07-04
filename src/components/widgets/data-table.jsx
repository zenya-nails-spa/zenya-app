import { useState, useMemo } from 'react';

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

const DataTable = ({ columns = [], rows = [], renderCell, style }) => {
  const [sort, setSort] = useState(null); // { key, dir: 'asc' | 'desc' }

  const handleHeaderClick = (col) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (prev?.key !== col.key) return { key: col.key, dir: 'desc' };
      if (prev.dir === 'desc') return { key: col.key, dir: 'asc' };
      return null; // third click restores original order
    });
  };

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const getValue = col.sortValue ?? ((row) => row[col.key]);
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // nulls always last
      if (vb == null) return -1;
      if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb), 'es') * factor;
      return (va - vb) * factor;
    });
  }, [rows, columns, sort]);

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
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleHeaderClick(col)}
                title={col.sortable ? 'Ordenar' : undefined}
                style={{
                  textAlign: col.align || 'left',
                  padding: '8px 12px',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--fw-semibold)',
                  letterSpacing: 'var(--ls-label)',
                  textTransform: 'uppercase',
                  color: sort?.key === col.key ? 'var(--text-brand)' : 'var(--text-muted)',
                  borderBottom: '1px solid var(--border-subtle)',
                  whiteSpace: col.nowrap ? 'nowrap' : undefined,
                  background: 'var(--surface-sunken)',
                  cursor: col.sortable ? 'pointer' : undefined,
                  userSelect: col.sortable ? 'none' : undefined,
                }}
              >
                {col.label}
                {col.sortable && <SortArrows dir={sort?.key === col.key ? sort.dir : null} />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="z-row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '10px 12px',
                    borderBottom: rowIndex < sortedRows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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
