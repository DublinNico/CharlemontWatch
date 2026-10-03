import { useApp } from '../context/AppContext';

// Compact row of total/per-status counts. Numbers are set in mono so the
// columns line up; each status keeps its semantic colour.
export function StatsCard() {
  const { incidents } = useApp();

  const stats = [
    { label: 'Total Reports', value: incidents.length, color: 'text-foreground' },
    { label: 'Awaiting Response', value: incidents.filter(i => i.status === 'AWAITING_RESPONSE').length, color: 'text-status-await' },
    { label: 'No Response', value: incidents.filter(i => i.status === 'NO_RESPONSE').length, color: 'text-status-none' },
    { label: 'In Progress', value: incidents.filter(i => i.status === 'IN_PROGRESS').length, color: 'text-status-progress' },
    { label: 'Resolved', value: incidents.filter(i => i.status === 'RESOLVED').length, color: 'text-status-done' },
  ];

  return (
    <div className="bg-card border border-border rounded-lg grid grid-cols-2 md:grid-cols-5 overflow-hidden">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`px-5 py-5 md:px-6 md:py-6 border-border ${index === 0 ? 'col-span-2 md:col-span-1' : ''} ${index > 0 ? 'border-t md:border-t-0 md:border-l' : ''} ${index % 2 === 0 && index > 0 ? 'border-l md:border-l' : ''}`}
        >
          <div className={`font-mono text-3xl md:text-[34px] leading-none font-semibold tracking-[-0.04em] ${stat.color}`}>{stat.value}</div>
          <div className="text-sm text-muted-foreground mt-2.5">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
