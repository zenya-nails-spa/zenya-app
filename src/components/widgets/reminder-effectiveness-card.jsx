import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import StatCard from './stat-card';

const CATEGORY_META = {
  retouch: {
    label: 'Retoque',
    icon: 'TrendingUp',
    successWord: 'volvieron a agendar',
    info: 'De las clientas a las que se les mandó el recordatorio de retoque, qué porcentaje volvió a comprar después.',
  },
  reminder: {
    label: 'Recordatorio de cita',
    icon: 'Calendar',
    successWord: 'asistieron',
    info: 'De las clientas a las que se les recordó su cita de mañana, qué porcentaje sí asistió ese día.',
  },
  feedback: {
    label: 'Encuesta clienta nueva',
    icon: 'Star',
    successWord: 'regresaron',
    info: 'De las clientas nuevas a las que se les mandó la encuesta, qué porcentaje volvió a visitarnos después.',
  },
};

const ReminderEffectivenessCard = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.reminderEffectiveness().then((data) => setCategories(data?.categories ?? []));
  }, []);

  return (
    <div className="z-status-row">
      {Object.entries(CATEGORY_META).map(([key, meta]) => {
        const row = categories.find((c) => c.category === key);
        return (
          <StatCard
            key={key}
            label={meta.label}
            value={row?.sent ? `${Math.round((row.rate ?? 0) * 100)}%` : '—'}
            caption={row?.sent ? `${row.successful} de ${row.sent} ${meta.successWord}` : 'Sin envíos todavía'}
            icon={meta.icon}
            info={meta.info}
            numeralStyle="sans"
          />
        );
      })}
    </div>
  );
};

export default ReminderEffectivenessCard;
