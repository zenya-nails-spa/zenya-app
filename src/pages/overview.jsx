import { useState } from 'react';
import D from '../mocks/data';
import StatCard from '../components/widgets/stat-card';
import Card from '../components/ui/card';
import AreaChart from '../components/charts/area-chart';
import RankRow from '../components/widgets/rank-row';
import Avatar from '../components/ui/avatar';
import LegendRow from '../components/ui/legend-row';
import InsightCard from '../components/ui/insight-card';
import SegmentedControl from '../components/ui/segmented-control';
import { Clock } from 'lucide-react';

const maxRev = Math.max(...D.services.map((s) => s.rev));
const revDelta = ((D.totals.revMonth - D.totals.revPrevMonth) / D.totals.revPrevMonth) * 100;
const apptDelta = ((D.totals.appts - D.totals.apptsPrev) / D.totals.apptsPrev) * 100;
const ticketDelta = ((D.totals.avgTicket - D.totals.avgTicketPrev) / D.totals.avgTicketPrev) * 100;
const clientDelta = ((D.totals.newClients - D.totals.newClientsPrev) / D.totals.newClientsPrev) * 100;
const sparkRev = D.series(41, 12, 60000, 20000, 1400);

const Overview = () => {
  const [period, setPeriod] = useState('mes');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFade 0.3s var(--ease-out)' }}>
      <div className="z-kpi-grid">
        <StatCard
          label="Ingresos del mes"
          value={D.money(D.totals.revMonth)}
          delta={revDelta}
          caption="vs mes anterior"
          icon="TrendingUp"
          spark={sparkRev}
          sparkColor="var(--chart-1)"
        />
        <StatCard
          label="Citas completadas"
          value={D.totals.appts.toLocaleString('es-MX')}
          delta={apptDelta}
          caption="vs mes anterior"
          icon="Calendar"
          spark={D.series(42, 12, 450, 100, 10)}
          sparkColor="var(--chart-2)"
        />
        <StatCard
          label="Ticket promedio"
          value={D.money(D.totals.avgTicket)}
          delta={ticketDelta}
          caption="vs mes anterior"
          icon="DollarSign"
          spark={D.series(43, 12, 120, 20, 1)}
          sparkColor="var(--chart-3)"
        />
        <StatCard
          label="Clientas nuevas"
          value={D.totals.newClients}
          delta={clientDelta}
          caption="vs mes anterior"
          icon="Heart"
          spark={D.series(44, 12, 35, 15, 1)}
          sparkColor="var(--chart-4)"
        />
      </div>

      <div className="z-2col-wide">
        <Card
          eyebrow="Ingresos"
          title="Tendencia del mes"
          action={
            <SegmentedControl
              options={[
                { value: 'semana', label: 'Sem' },
                { value: 'mes', label: 'Mes' },
                { value: 'año', label: 'Año' },
              ]}
              value={period}
              onChange={setPeriod}
              size="sm"
            />
          }
        >
          <LegendRow
            items={[
              { label: 'Este mes', color: 'var(--chart-1)', line: true },
              { label: 'Mes anterior', color: 'var(--chart-compare)', line: true, dashed: true },
            ]}
            style={{ marginBottom: 14 }}
          />
          <AreaChart
            data={D.revToday}
            compare={D.revPrev}
            labels={D.revToday.map((_, i) => `Día ${i + 1}`)}
            yFormat={D.moneyK}
            height={210}
          />
        </Card>

        <Card eyebrow="Servicios" title="Top servicios">
          {D.services.slice(0, 5).map((s, i) => (
            <RankRow
              key={s.name}
              rank={i + 1}
              label={s.name}
              sublabel={s.cat}
              value={D.money(s.rev)}
              ratio={s.rev / maxRev}
              color={D.CHART[i % D.CHART.length]}
              last={i === 4}
            />
          ))}
        </Card>
      </div>

      <div className="z-2col">
        <Card eyebrow="Hoy" title="Actividad reciente">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {D.activity.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < D.activity.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      item.type === 'paid'
                        ? 'var(--green-500)'
                        : item.type === 'cancel'
                          ? 'var(--red-500)'
                          : item.type === 'new'
                            ? 'var(--chart-2)'
                            : 'var(--amber-500)',
                    flexShrink: 0,
                    marginTop: 5,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}
                  >
                    {item.text}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      marginTop: 3,
                      fontFamily: 'var(--font-sans)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Clock size={11} strokeWidth={1.5} />
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card eyebrow="Análisis" title="Insights">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {D.insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} tone={ins.tone} title={ins.title} body={ins.body} />
            ))}
          </div>
        </Card>
      </div>

      <Card eyebrow="Personal" title="Rendimiento del equipo">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {D.staff.map((s, i) => (
            <div
              key={s.name}
              className="z-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: i < D.staff.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <Avatar name={s.name} size="sm" tone={i === 0 ? 'rose' : i === 1 ? 'lavender' : 'ink'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-medium)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {s.role}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--text-heading)',
                  }}
                >
                  {D.money(s.rev)}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  {s.appts} citas
                </div>
              </div>
              <div
                style={{
                  width: 64,
                  textAlign: 'right',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                }}
              >
                ★ {s.rating}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Overview;
