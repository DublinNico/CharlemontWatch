import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Shield, FileText, Eye, CheckCircle } from 'lucide-react';
import { Header } from '../components/Header';
import { StatsCard } from '../components/StatsCard';
import { IncidentCard } from '../components/IncidentCard';
import { useApp, IncidentType, Incident } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router';

const API_BASE = 'http://localhost:5000/api';

const typeColors: Record<IncidentType, string> = {
  'Graffiti': '#f57c00',
  'Anti-Social Behaviour': '#d32f2f',
  'Safety Hazard': '#fbc02d',
  'Maintenance Issue': '#388e3c',
};

const typeFromApi: Record<string, IncidentType> = {
  graffiti: 'Graffiti',
  antisocial: 'Anti-Social Behaviour',
  safetyhazard: 'Safety Hazard',
  maintenance: 'Maintenance Issue',
};

function mapApiToIncident(api: any): Incident {
  const typeSpecificData: Record<string, any> = {};
  switch (api.incidentType) {
    case 'graffiti':
      if (api.surfaceType) typeSpecificData.surfaceType = api.surfaceType;
      if (api.estimatedArea != null) typeSpecificData.estimatedArea = api.estimatedArea;
      if (api.isProfane != null) typeSpecificData.isProfane = api.isProfane;
      break;
    case 'antisocial':
      if (api.antisocialType) typeSpecificData.antisocialType = api.antisocialType;
      if (api.estimatedPeopleInvolved != null) typeSpecificData.estimatedPeopleInvolved = api.estimatedPeopleInvolved;
      if (api.reportedToGarda != null) typeSpecificData.reportedToGarda = api.reportedToGarda;
      break;
    case 'safetyhazard':
      if (api.hazardType) typeSpecificData.hazardType = api.hazardType;
      if (api.riskLevel) typeSpecificData.riskLevel = api.riskLevel;
      if (api.causedInjury != null) typeSpecificData.causedInjury = api.causedInjury;
      break;
    case 'maintenance':
      if (api.issueType) typeSpecificData.issueType = api.issueType;
      if (api.priority) typeSpecificData.priority = api.priority;
      if (api.workCategory) typeSpecificData.workCategory = api.workCategory;
      if (api.customIssueDescription) typeSpecificData.customIssueDescription = api.customIssueDescription;
      break;
  }
  return {
    id: api.shortId || api._id,
    type: typeFromApi[api.incidentType] || 'Maintenance Issue',
    location: api.location,
    description: api.description,
    reporterEmail: api.reporterEmail,
    status: api.status,
    date: api.reportedDate || api.createdAt,
    photos: (api.photos || []).map((p: any) => ({ id: p._id || p.url, url: p.url })),
    typeSpecificData: Object.keys(typeSpecificData).length > 0 ? typeSpecificData : undefined,
  };
}

export function TrackReport() {
  const { getIncidentById } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchId, setSearchId] = useState('');
  const [searchedIncident, setSearchedIncident] = useState<Incident | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchId(id);
      doSearch(id);
    }
  }, []);

  const doSearch = async (id: string) => {
    const normalized = id.trim().toUpperCase();
    if (!normalized) return;

    setIsSearching(true);
    setNotFound(false);
    setSearchedIncident(null);

    const cached = getIncidentById(normalized);
    if (cached) {
      setSearchedIncident(cached);
      setIsSearching(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/incidents/${normalized}`);
      setSearchedIncident(mapApiToIncident(response.data));
    } catch {
      setNotFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchId);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <StatsCard />

        <div className="bg-white rounded shadow-sm p-6">
          <h2 className="text-[#333333] mb-4">Track Your Report</h2>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-[#eeeeee] rounded focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
              placeholder="Enter Incident ID (e.g. CW-A3F9B2)"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </form>
        </div>

        {notFound && (
          <div className="bg-white rounded shadow-sm p-6 text-center">
            <p className="text-[#d32f2f]">No incident found with ID: <strong>{searchId.toUpperCase()}</strong></p>
          </div>
        )}

        {searchedIncident && (
          <div className="max-w-3xl mx-auto">
            <IncidentCard incident={searchedIncident} showFullDetails={true} />
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-[#333333] mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { number: 1, title: 'Report', description: 'Submit an incident with photos and details', icon: FileText },
              { number: 2, title: 'Track', description: 'Use your incident ID to monitor progress', icon: Eye },
              { number: 3, title: 'Review', description: 'Admin reviews and updates status', icon: Shield },
              { number: 4, title: 'Resolve', description: 'Issue is addressed and marked complete', icon: CheckCircle },
            ].map(step => (
              <div key={step.number} className="bg-white rounded shadow-sm p-6 text-center">
                <div className="w-12 h-12 bg-[#1976d2] text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
                  {step.number}
                </div>
                <step.icon className="w-8 h-8 text-[#1976d2] mx-auto mb-2" />
                <h3 className="text-[#333333] mb-1">{step.title}</h3>
                <p className="text-xs text-[#666666]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-[#333333] mb-6 text-center">Incident Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(typeColors) as IncidentType[]).map(type => (
              <div
                key={type}
                className="bg-white rounded shadow-sm border-l-4 p-4"
                style={{ borderLeftColor: typeColors[type] }}
              >
                <h3 className="text-sm text-[#333333] mb-2">{type}</h3>
                <p className="text-xs text-[#666666]">
                  {type === 'Graffiti' && 'Report vandalism and graffiti'}
                  {type === 'Anti-Social Behaviour' && 'Report disturbances and noise'}
                  {type === 'Safety Hazard' && 'Report dangerous conditions'}
                  {type === 'Maintenance Issue' && 'Report building maintenance needs'}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded shadow-sm p-8 text-center">
          <h2 className="text-[#333333] mb-4">Ready to report?</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/report')}
              className="px-6 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors"
            >
              Report an Incident
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="px-6 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors"
            >
              View All Incidents
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
