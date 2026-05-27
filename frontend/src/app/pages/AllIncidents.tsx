import { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { IncidentCard } from '../components/IncidentCard';
import { useApp, IncidentType, IncidentStatus } from '../context/AppContext';
import { FileX, Filter, Search, Layers } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

const typeColors: Record<IncidentType, { bg: string; text: string; border: string }> = {
  'Graffiti': { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  'Anti-Social Behaviour': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  'Safety Hazard': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  'Maintenance Issue': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
};

export function AllIncidents() {
  const { incidents } = useApp();
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<IncidentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'all'>('all');

  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const typeMatch = selectedTypeFilter === 'all' || incident.type === selectedTypeFilter;
      const statusMatch = statusFilter === 'all' || incident.status === statusFilter;
      return typeMatch && statusMatch;
    });
  }, [incidents, selectedTypeFilter, statusFilter]);

  const incidentTypes: IncidentType[] = ['Graffiti', 'Anti-Social Behaviour', 'Safety Hazard', 'Maintenance Issue'];

  const stats = [
    { label: 'Total', value: incidents.length, color: 'text-slate-600' },
    { label: 'New', value: incidents.filter(i => i.status === 'NEW').length, color: 'text-blue-600' },
    { label: 'In Progress', value: incidents.filter(i => i.status === 'IN_PROGRESS').length, color: 'text-amber-600' },
    { label: 'Resolved', value: incidents.filter(i => i.status === 'RESOLVED').length, color: 'text-emerald-600' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">All Incidents</h1>
            <p className="text-muted-foreground">Browse and filter community reports</p>
          </div>

          <div className="flex gap-3">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Button
            variant={selectedTypeFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedTypeFilter('all')}
            className={selectedTypeFilter === 'all' ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
          >
            <Layers className="w-4 h-4 mr-2" />
            All Types
          </Button>
          {incidentTypes.map(type => {
            const colors = typeColors[type];
            const isSelected = selectedTypeFilter === type;
            return (
              <Button
                key={type}
                variant="outline"
                onClick={() => setSelectedTypeFilter(type)}
                className={`flex-shrink-0 ${isSelected ? `${colors.bg} ${colors.text} ${colors.border} border-2` : ''}`}
              >
                {type}
              </Button>
            );
          })}
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold">Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="status-filter" className="mb-2 block">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as IncidentStatus | 'all')}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type-filter" className="mb-2 block">Type</Label>
                <Select
                  value={selectedTypeFilter}
                  onValueChange={(value) => setSelectedTypeFilter(value as IncidentType | 'all')}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Graffiti">Graffiti</SelectItem>
                    <SelectItem value="Anti-Social Behaviour">Anti-Social Behaviour</SelectItem>
                    <SelectItem value="Safety Hazard">Safety Hazard</SelectItem>
                    <SelectItem value="Maintenance Issue">Maintenance Issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedTypeFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <Badge variant="secondary" className="text-xs">
                  {filteredIncidents.length} result{filteredIncidents.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTypeFilter('all');
                    setStatusFilter('all');
                  }}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {filteredIncidents.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                  <FileX className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No incidents found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or check back later for new reports
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTypeFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredIncidents.length} of {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredIncidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
