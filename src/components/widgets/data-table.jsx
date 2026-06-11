const DataTable = ({ columns = [], rows = [], renderCell, style }) => (
  <div style={{ overflowX: 'auto', ...style }}>
    <table
      style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)' }}
    >
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={{
                textAlign: col.align || 'left',
                padding: '8px 12px',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--fw-semibold)',
                letterSpacing: 'var(--ls-label)',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                borderBottom: '1px solid var(--border-subtle)',
                whiteSpace: col.nowrap ? 'nowrap' : undefined,
                background: 'var(--surface-sunken)',
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="z-row">
            {columns.map((col) => (
              <td
                key={col.key}
                style={{
                  textAlign: col.align || 'left',
                  padding: '10px 12px',
                  borderBottom: rowIndex < rows.length - 1 ? '1px solid var(--border-subtle)' : 'none',
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

export default DataTable;
