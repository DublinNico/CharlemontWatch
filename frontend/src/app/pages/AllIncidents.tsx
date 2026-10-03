import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { IncidentCard } from '../components/IncidentCard';
import { useApp, IncidentType, IncidentStatus } from '../context/AppContext';
import { FileX, Layers, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { StatsCard } from '../components/StatsCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

// Public "browse all reports" page — filterable by type and status
export function AllIncidents() {
  const { incidents } = useApp();
  const navigate = useNavigate();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<IncidentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');

  // Recomputed only when the incident list or either filter changes
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const typeMatch = selectedTypeFilter === 'all' || incident.type === selectedTypeFilter;
      const statusMatch = statusFilter === 'all' || incident.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [incidents, selectedTypeFilter, statusFilter]);

  const incidentTypes: IncidentType[] = ['Graffiti', 'Anti-Social Behaviour', 'Safety Hazard', 'Maintenance Issue'];

  const clearFilters = () => {
    setSelectedTypeFilter('all');
    setStatusFilter('all');
  };
  const filtersActive = selectedTypeFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="bg-background">
      <Header />

      <main className="page-container">
        <div className="pt-10 md:pt-16 pb-8">
          <h1 className="text-[36px] md:text-[52px] 2xl:text-[60px] leading-[1.04] tracking-[-0.035em] font-bold">All Incidents</h1>
          <p className="mt-3.5 text-lg md:text-[19px] text-muted-foreground">Browse and filter community reports</p>
        </div>

        <StatsCard />

        {/* Type pills + status filter */}
        <div className="mt-10 mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide" role="group" aria-label="Filter by type">
            <Button
              variant={selectedTypeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedTypeFilter('all')}
              aria-pressed={selectedTypeFilter === 'all'}
              className={`shrink-0 ${selectedTypeFilter === 'all' ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-card'}`}
            >
              <Layers className="size-4" />
              All Types
            </Button>
            {incidentTypes.map(type => {
              const isSelected = selectedTypeFilter === type;
              return (
                <Button
                  key={type}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => setSelectedTypeFilter(type)}
                  aria-pressed={isSelected}
                  className={`shrink-0 font-medium ${isSelected ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-card'}`}
                >
                  {type}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="status-filter" className="sr-only">Status</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as IncidentStatus | 'all')}
            >
              <SelectTrigger id="status-filter" size="sm" className="w-full lg:w-[210px] rounded-md bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="AWAITING_RESPONSE">Awaiting Response</SelectItem>
                <SelectItem value="NO_RESPONSE">No Response</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4 min-h-9">
          <p className="text-sm text-subtle-foreground">
            Showing {filteredIncidents.length} of {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
          </p>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-3 text-[13px]">
              <X className="size-3.5" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Results */}
        {filteredIncidents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
            <div className="max-w-sm mx-auto">
              <div className="size-14 rounded-full bg-muted grid place-items-center mx-auto mb-5">
                <FileX className="size-6 text-subtle-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No incidents found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or check back later for new reports
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
            {filteredIncidents.map(incident => (
              <IncidentCard
                key={incident.id}
                incident={incident}
                onClick={() => navigate(`/track?id=${incident.id}&source=list`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
