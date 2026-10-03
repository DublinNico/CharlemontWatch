import React from 'react';
import { IncidentStatus } from '../context/AppContext';
import { Badge } from './ui/badge';
import { Clock, CheckCircle2, Hourglass, AlertTriangle, Eye, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: IncidentStatus;
}

// Renders a colored pill + icon for an incident's status
export function StatusBadge({ status }: StatusBadgeProps) {
  // Label, color, and icon per status value
  const configs: Record<IncidentStatus, { label: string; className: string; icon: React.ElementType }> = {
    PENDING_REVIEW: {
      label: 'Pending Review',
      className: 'bg-status-review-bg text-status-review',
      icon: Eye,
    },
    AWAITING_RESPONSE: {
      label: 'Awaiting Response',
      className: 'bg-status-await-bg text-status-await',
      icon: Hourglass,
    },
    NO_RESPONSE: {
      label: 'No Response',
      className: 'bg-status-none-bg text-status-none',
      icon: AlertTriangle,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      className: 'bg-status-progress-bg text-status-progress',
      icon: Clock,
    },
    RESOLVED: {
      label: 'Resolved',
      className: 'bg-status-done-bg text-status-done',
      icon: CheckCircle2,
    },
    REJECTED: {
      label: 'Rejected',
      className: 'bg-muted text-muted-foreground',
      icon: XCircle,
    },
  };

  // Falls back to Awaiting Response for any status this build doesn't know
  // (e.g. a legacy NEW record not yet migrated) instead of crashing — see BUG-006
  const config = configs[status] ?? configs.AWAITING_RESPONSE;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} border-transparent gap-1.5`}>
      <Icon className="size-3.5" />
      {config.label}
    </Badge>
  );
}
