import { ChevronLeft, ChevronRight } from 'lucide-react';
import Select from './select';
import Button from './button';

const PAGE_SIZE_OPTIONS = [
  { value: '25', label: '25 por página' },
  { value: '50', label: '50 por página' },
  { value: '100', label: '100 por página' },
];

const Pagination = ({ page, totalPages, pageSize, onPageChange, onPageSizeChange, hasPrev, hasNext, rangeLabel }) => (
  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)' }}>
    <div
      style={{
        textAlign: 'right',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-muted)',
        marginBottom: 10,
      }}
    >
      {rangeLabel ? `${rangeLabel} · ` : ''}
      {totalPages != null ? `página ${page} de ${totalPages}` : `página ${page}`}
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 14 }}>
      <Button
        variant="ghost"
        size="sm"
        iconLeft={ChevronLeft}
        disabled={!hasPrev}
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 28,
          padding: '2px 4px',
          fontFamily: 'var(--font-sans)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--fw-semibold)',
          color: 'var(--brand-primary)',
          borderBottom: '2px solid var(--brand-primary)',
        }}
      >
        {page}
      </span>
      <Button
        variant="ghost"
        size="sm"
        iconRight={ChevronRight}
        disabled={!hasNext}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente
      </Button>
      <Select
        size="sm"
        value={String(pageSize)}
        onChange={(v) => onPageSizeChange(Number(v))}
        options={PAGE_SIZE_OPTIONS}
      />
    </div>
  </div>
);

export default Pagination;
