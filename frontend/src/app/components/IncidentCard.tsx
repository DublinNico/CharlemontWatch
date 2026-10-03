import { useState } from 'react';
import { Incident, IncidentType } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Calendar, Image as ImageIcon, X, ChevronLeft, ChevronRight, Copy, Check, AlertTriangle, SprayCan, Megaphone, TriangleAlert, Hammer } from 'lucide-react';

const recipientNames: Record<'tuath' | 'dcc', string> = {
  tuath: 'Túath Housing',
  dcc: 'Dublin City Council',
};

const deliveryIssueMessages: Record<string, string> = {
  'email.bounced': 'could not be delivered',
  'email.complained': 'was marked as spam',
  'email.delivery_delayed': 'is delayed',
};

// One line per recipient, keeping only the most recent issue if a recipient
// shows up more than once (e.g. delayed, then later bounced)
function latestIssuePerRecipient(issues: NonNullable<Incident['complaintDeliveryIssues']>) {
  const latest = new Map<string, (typeof issues)[number]>();
  for (const issue of issues) {
    const existing = latest.get(issue.recipientType);
    if (!existing || new Date(issue.occurredAt) > new Date(existing.occurredAt)) {
      latest.set(issue.recipientType, issue);
    }
  }
  return Array.from(latest.values());
}

const recipientBadgeStyles = {
  pending: 'bg-muted text-muted-foreground border-transparent',
  onTrack: 'bg-status-done-bg text-status-done border-transparent',
  responseOverdue: 'bg-status-none-bg text-status-none border-transparent',
};

// Compact per-recipient complaint status. Only rendered in the expanded
// /track view (showFullDetails) — kept off the compact browse-feed cards so
// the list view stays scannable and this detail only surfaces once someone
// actually opens a report.
function ComplaintStatusBadges({ incident }: { incident: Incident }) {
  if (!incident.sendComplaintTo || incident.sendComplaintTo.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {incident.sendComplaintTo.map(recipient => {
        const timeline = incident.complaintTimeline?.find(t => t.recipientType === recipient);
        const name = recipientNames[recipient];

        if (!timeline) {
          return (
            <Badge key={recipient} variant="outline" className={`${recipientBadgeStyles.pending} border text-xs font-normal`}>
              {name}: not yet confirmed sent
            </Badge>
          );
        }

        const { businessDaysElapsed, responseThresholdDays, responseOverdue, estimated } = timeline;
        const estimatedSuffix = estimated ? ' (est.)' : '';
        if (responseOverdue) {
          return (
            <Badge key={recipient} className={`${recipientBadgeStyles.responseOverdue} border text-xs font-normal`}>
              {name}: {responseThresholdDays}-day response overdue{estimatedSuffix}
            </Badge>
          );
        }
        return (
          <Badge key={recipient} className={`${recipientBadgeStyles.onTrack} border text-xs font-normal`}>
            {name}: Day {businessDaysElapsed}/{responseThresholdDays}{estimatedSuffix}
          </Badge>
        );
      })}
    </div>
  );
}

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
  showFullDetails?: boolean;
  showTrackingBadge?: boolean;
}

// Icon per incident type, shown in the neutral type pill
const typeIcons: Record<IncidentType, typeof MapPin> = {
  'Graffiti': SprayCan,
  'Anti-Social Behaviour': Megaphone,
  'Safety Hazard': TriangleAlert,
  'Maintenance Issue': Hammer,
};

// Displays a single incident. In compact mode (default) it's a summary card
// for lists; showFullDetails expands it into the full tracking view with a
// copyable ID, type-specific fields, and a photo lightbox.
export function IncidentCard({ incident, onClick, showFullDetails = false, showTrackingBadge = true }: IncidentCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Copies the incident's shortId to the clipboard and flashes a checkmark
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(incident.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // clipboard write failed — silently ignore (permission denied, insecure context)
    });
  };
  const TypeIcon = typeIcons[incident.type] ?? MapPin;
  const formattedDate = new Date(incident.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
    <Card
      className={`gap-4 transition-colors ${onClick ? 'cursor-pointer hover:border-subtle-foreground' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-muted text-foreground border-transparent gap-1.5">
            <TypeIcon className="size-3.5" />
            {incident.type}
          </Badge>
          <StatusBadge status={incident.status} />
        </div>

        {showFullDetails && incident.sendComplaintTo && incident.sendComplaintTo.length > 0 && (
          <div className="mt-3">
            <ComplaintStatusBadges incident={incident} />
          </div>
        )}

        {showTrackingBadge && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-subtle-foreground">{showFullDetails ? 'Track Your Report:' : 'ID:'}</span>
            <Badge variant="secondary" className="font-mono text-[13px] h-7">
              {incident.id}
            </Badge>
            <button
              onClick={handleCopy}
              title="Copy ID"
              aria-label="Copy ID"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-status-done" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {showFullDetails && incident.complaintDeliveryIssues && incident.complaintDeliveryIssues.length > 0 && (
          <div className="flex items-start gap-3 bg-status-none-bg text-foreground rounded-lg p-4 text-sm">
            <AlertTriangle className="w-5 h-5 mt-px flex-shrink-0 text-status-none" />
            <div>
              {latestIssuePerRecipient(incident.complaintDeliveryIssues).map(issue => (
                <p key={issue.recipientType}>
                  Your formal complaint to <strong>{recipientNames[issue.recipientType]}</strong> {deliveryIssueMessages[issue.eventType] || 'had a delivery problem'}.
                  You may want to follow up with them directly.
                </p>
              ))}
            </div>
          </div>
        )}

        {showFullDetails && incident.complaintTimeline && incident.complaintTimeline.some(t => t.responseOverdue) && (
          <div className="flex items-start gap-3 bg-status-progress-bg text-foreground rounded-lg p-4 text-sm">
            <AlertTriangle className="w-5 h-5 mt-px flex-shrink-0 text-status-progress" />
            <div>
              {incident.complaintTimeline.filter(t => t.responseOverdue).map(t => (
                <p key={t.recipientType}>
                  Your formal complaint to <strong>{recipientNames[t.recipientType]}</strong> was sent {t.businessDaysElapsed} working days ago with no response logged. That's past the {t.responseThresholdDays} working day threshold for a full written response. You may want to escalate.
                </p>
              ))}
            </div>
          </div>
        )}

        {incident.title && (
          <h3 className={`font-semibold leading-snug tracking-[-0.015em] ${showFullDetails ? 'text-2xl' : 'text-lg'}`}>{incident.title}</h3>
        )}

        <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{incident.location}</span>
        </div>

        <p className={`text-[15px] text-muted-foreground leading-relaxed max-w-[70ch] ${showFullDetails ? '' : 'line-clamp-2'}`}>
          {incident.description}
        </p>

        {!showFullDetails && incident.photos.length > 0 && (
          <div className="flex gap-2">
            {incident.photos.slice(0, 3).map((photo, index) => {
              const isLast = index === 2 && incident.photos.length > 3;
              return (
                <div key={photo.id} className="relative w-16 h-16 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={photo.url}
                    alt={photo.caption || 'Incident photo'}
                    className="w-full h-full object-cover"
                  />
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">+{incident.photos.length - 3}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-subtle-foreground pt-3 border-t border-border">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          {incident.photos.length > 0 && showFullDetails && (
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{incident.photos.length} photo{incident.photos.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {showFullDetails && incident.typeSpecificData && Object.keys(incident.typeSpecificData).length > 0 && (
          <div className="mt-4 p-4 bg-background rounded-md border border-border">
            <h4 className="font-semibold text-sm mb-3">Additional Details</h4>
            <dl className="space-y-2 text-sm">
              {Object.entries(incident.typeSpecificData).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="text-muted-foreground capitalize min-w-[120px]">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </dt>
                  <dd className="font-medium">{value as string}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {showFullDetails && incident.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {incident.photos.map((photo, index) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-zoom-in"
                onClick={e => { e.stopPropagation(); setLightboxIndex(index); }}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Incident evidence'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Full-screen photo lightbox with prev/next navigation, shown when a thumbnail is clicked */}
    {lightboxIndex !== null && (
      <div
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
        onClick={() => setLightboxIndex(null)}
      >
        <button
          aria-label="Close"
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          onClick={() => setLightboxIndex(null)}
        >
          <X className="w-8 h-8" />
        </button>

        {lightboxIndex > 0 && (
          <button
            aria-label="Previous"
            className="absolute left-4 text-white hover:text-gray-300 transition-colors"
            onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
        )}

        <img
          src={incident.photos[lightboxIndex].url}
          alt={incident.photos[lightboxIndex].caption || 'Incident evidence'}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
          onClick={e => e.stopPropagation()}
        />

        {lightboxIndex < incident.photos.length - 1 && (
          <button
            aria-label="Next"
            className="absolute right-4 text-white hover:text-gray-300 transition-colors"
            onClick={e => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
          >
            <ChevronRight className="w-10 h-10" />
          </button>
        )}

        <div className="absolute bottom-4 text-white text-sm">
          {lightboxIndex + 1} / {incident.photos.length}
        </div>
      </div>
    )}
    </>
  );
}
