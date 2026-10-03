import { useState, useEffect } from 'react';
import { Search, SearchX, WifiOff } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { Header } from '../components/Header';
import { StatsCard } from '../components/StatsCard';
import { IncidentCard } from '../components/IncidentCard';
import { useApp, IncidentType, Incident } from '../context/AppContext';
import { useNavigate, useSearchParams } from 'react-router';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

const typeFromApi: Record<string, IncidentType> = {
  graffiti: 'Graffiti',
  antisocial: 'Anti-Social Behaviour',
  safetyhazard: 'Safety Hazard',
  maintenance: 'Maintenance Issue',
};

// Local copy of the API->Incident mapper (mirrors AppContext's) since a
// tracked search result may not be in the already-loaded public incident list
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
    title: api.title,
    location: api.location,
    description: api.description,
    reporterEmail: api.reporterEmail,
    status: api.status,
    date: api.reportedDate || api.createdAt,
    photos: (api.photos || []).map((p: any) => ({ id: p._id || p.url, url: p.url, caption: p.caption })),
    typeSpecificData: Object.keys(typeSpecificData).length > 0 ? typeSpecificData : undefined,
    sendComplaintTo: api.sendComplaintTo,
    complaintDeliveryIssues: api.complaintDeliveryIssues,
    complaintsSent: api.complaintsSent,
    complaintTimeline: api.complaintTimeline,
  };
}

// Lets a resident look up their own report by shortId/ObjectId — checks the
// already-loaded public incidents first, then falls back to a direct API call
// (needed since pending/unpublished reports aren't in that list)
export function TrackReport() {
  const { getIncidentById } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchId, setSearchId] = useState('');
  const [searchedIncident, setSearchedIncident] = useState<Incident | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searchError, setSearchError] = useState(false);
  // The normalized ID of the last completed lookup, so the not-found message
  // doesn't change as the resident edits the input afterwards
  const [lastSearchedId, setLastSearchedId] = useState('');

  // Auto-search if the page was loaded with a ?id= query param (e.g. from
  // the "Track This Report" link on the success page)
  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSearchId(id);
      doSearch(id);
    }
  }, [searchParams]);

  // Looks up an incident by ID: cache first, then the API. Distinguishes a
  // 404 (not found) from other errors (network/server) for a clearer message.
  const doSearch = async (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    // Only uppercase CW- shortIds; MongoDB ObjectIds (24 hex chars) must stay as-is
    const normalized = /^[0-9a-fA-F]{24}$/.test(trimmed) ? trimmed : trimmed.toUpperCase();

    setLastSearchedId(normalized);
    setIsSearching(true);
    setNotFound(false);
    setSearchError(false);
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
    } catch (err: any) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        setSearchError(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(searchId);
  };

  // Public-list clicks land here just to view an incident's details, not to
  // track "your" report — showing the search box would re-expose the ID via
  // its pre-filled value even with the card's own tracking badge hidden.
  const fromList = searchParams.get('source') === 'list';

  return (
    <div className="bg-background">
      <Header />

      <main className="page-container">
        {!fromList && (
          <div className="pt-10 md:pt-16 pb-8">
            <h1 className="text-[36px] md:text-[52px] 2xl:text-[60px] leading-[1.04] tracking-[-0.035em] font-bold">Track Your Report</h1>
            <p className="mt-3.5 text-lg md:text-[19px] text-muted-foreground max-w-[56ch]">
              Enter the Incident ID you received in your confirmation email when you submitted the report.
            </p>
            <form onSubmit={handleSubmit} className="mt-7 flex flex-col sm:flex-row gap-2.5 max-w-[560px]">
              <label htmlFor="track-search-id" className="sr-only">Incident ID</label>
              <input
                id="track-search-id"
                type="text"
                className="flex-1 h-14 px-[22px] rounded-md border border-border bg-card font-mono text-[17px] tracking-[0.02em] placeholder:font-sans placeholder:tracking-normal placeholder:text-subtle-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                placeholder="Enter Incident ID (e.g. CW-A3F9B2)"
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
              />
              <Button type="submit" size="lg" disabled={isSearching} className="h-14 px-7">
                <Search className="size-4" />
                {isSearching ? 'Searching…' : 'Search'}
              </Button>
            </form>
          </div>
        )}

        <div className={fromList ? 'pt-10 md:pt-16 space-y-6' : 'space-y-6'}>
          {notFound && (
            <div className="flex items-start gap-3 rounded-lg bg-status-none-bg p-5 max-w-3xl">
              <SearchX className="size-5 text-status-none shrink-0 mt-px" />
              <p>No incident found with ID: <strong className="font-mono">{lastSearchedId}</strong>. Check the reference in your confirmation email and try again.</p>
            </div>
          )}

          {searchError && (
            <div className="flex items-start gap-3 rounded-lg bg-status-progress-bg p-5 max-w-3xl">
              <WifiOff className="size-5 text-status-progress shrink-0 mt-px" />
              <p>Something went wrong. Please check your connection and try again.</p>
            </div>
          )}

          {isSearching && !searchedIncident && (
            <div className="max-w-3xl rounded-lg border border-border bg-card p-6 space-y-4 animate-pulse" aria-hidden="true">
              <div className="flex gap-2"><div className="h-7 w-36 rounded-md bg-muted" /><div className="h-7 w-28 rounded-full bg-muted" /></div>
              <div className="h-7 w-2/3 rounded-md bg-muted" />
              <div className="h-4 w-1/3 rounded-md bg-muted" />
              <div className="h-16 w-full rounded-md bg-muted" />
            </div>
          )}

          {searchedIncident && (
            <div className="max-w-3xl">
              <IncidentCard
                incident={searchedIncident}
                showFullDetails={true}
                showTrackingBadge={!fromList}
              />
            </div>
          )}

          <div className="pt-6">
            <h2 className="text-xl font-semibold tracking-[-0.02em] mb-4">Where reports stand</h2>
            <StatsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
