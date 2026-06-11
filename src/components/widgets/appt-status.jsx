import Badge from '../ui/badge';

const STATUS_CONFIG = {
  paid: { tone: 'positive', label: 'Pagada', dot: true },
  pending: { tone: 'caution', label: 'Pendiente', dot: true },
  unpaid: { tone: 'negative', label: 'Sin pagar', dot: true },
  confirmed: { tone: 'lavender', label: 'Confirmada', dot: true },
  cancelled: { tone: 'neutral', label: 'Cancelada', dot: false },
};

const ApptStatus = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <Badge tone={cfg.tone} dot={cfg.dot} size="sm">
      {cfg.label}
    </Badge>
  );
};

export default ApptStatus;
