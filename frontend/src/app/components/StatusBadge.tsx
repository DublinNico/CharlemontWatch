import { IncidentStatus } from '../context/AppContext';
import { Badge } from './ui/badge';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IncidentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    NEW: {
      label: 'New',
      className: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100',
      icon: AlertCircle,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-100',
      icon: Clock,
    },
    RESOLVED: {
      label: 'Resolved',
      className: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100',
      icon: CheckCircle2,
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} border gap-1.5`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}
