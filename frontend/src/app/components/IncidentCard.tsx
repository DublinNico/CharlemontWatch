import { Incident, IncidentType } from '../context/AppContext';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { MapPin, Calendar, Image as ImageIcon } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick?: () => void;
  showFullDetails?: boolean;
}

const typeStyles: Record<IncidentType, { badge: string; accent: string }> = {
  'Graffiti': { badge: 'bg-orange-100 text-orange-700 border-orange-300', accent: 'border-l-orange-500' },
  'Anti-Social Behaviour': { badge: 'bg-red-100 text-red-700 border-red-300', accent: 'border-l-red-500' },
  'Safety Hazard': { badge: 'bg-amber-100 text-amber-700 border-amber-300', accent: 'border-l-amber-500' },
  'Maintenance Issue': { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300', accent: 'border-l-emerald-500' },
};

export function IncidentCard({ incident, onClick, showFullDetails = false }: IncidentCardProps) {
  const styles = typeStyles[incident.type];
  const formattedDate = new Date(incident.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card
      className={`border-l-4 ${styles.accent} transition-all hover:shadow-lg ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <Badge variant="outline" className={`${styles.badge} border font-medium`}>
            {incident.type}
          </Badge>
          <StatusBadge status={incident.status} />
        </div>

        {showFullDetails && (
          <div className="mt-3">
            <Badge variant="secondary" className="text-xs font-mono">
              {incident.id}
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{incident.location}</span>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {incident.description}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
          {incident.photos.length > 0 && (
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{incident.photos.length} photo{incident.photos.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {showFullDetails && incident.typeSpecificData && Object.keys(incident.typeSpecificData).length > 0 && (
          <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
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
            {incident.photos.map(photo => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100">
                <img
                  src={photo.url}
                  alt="Incident evidence"
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
