import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export interface ComplaintData {
  name: string;
  address: string;
  sendTo: ('tuath' | 'dcc')[];
}

export type SatisfactionRating = 'low' | 'medium' | 'high';

export interface SatisfactionSummary {
  low: number;
  medium: number;
  high: number;
  total: number;
}

export type IncidentType = 'Graffiti' | 'Anti-Social Behaviour' | 'Safety Hazard' | 'Maintenance Issue';
export type IncidentStatus = 'PENDING_REVIEW' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Photo {
  id: string;
  url: string;
  approved?: boolean;
  file?: File;
  caption?: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  location: string;
  description: string;
  // Optional because legacy records predate this field being made mandatory
  // on submission — new reports always have it, but old fetched rows may not.
  reporterEmail?: string;
  status: IncidentStatus;
  date: string;
  photos: Photo[];
  typeSpecificData?: Record<string, any>;
  // Present only when the resident requested a formal complaint; approving a
  // PENDING_REVIEW incident with this set sends real emails to those orgs
  sendComplaintTo?: ('tuath' | 'dcc')[];
  // Populated by the Resend bounce webhook when a complaint email to Túath/DCC
  // bounces, gets marked spam, or is delayed — empty/absent means no known issue
  complaintDeliveryIssues?: { recipientType: 'tuath' | 'dcc'; eventType: string; occurredAt: string }[];
}

export interface User {
  email: string;
  name: string;
}

// Shape of the shared app context — global incident/auth/satisfaction state
// plus the actions that mutate it, exposed to every page via useApp()
interface AppContextType {
  incidents: Incident[];
  isLoadingIncidents: boolean;
  refreshIncidents: () => Promise<void>;
  addIncident: (incident: Omit<Incident, 'id' | 'date'>, complaint?: ComplaintData, turnstileToken?: string) => Promise<string>;
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  getIncidentById: (id: string) => Incident | undefined;
  pendingIncidents: Incident[];
  refreshPendingIncidents: () => Promise<void>;
  reviewIncident: (id: string, action: 'approve' | 'reject') => Promise<void>;
  reviewPhoto: (incidentId: string, photoId: string, approved: boolean) => Promise<void>;
  satisfactionSummary: SatisfactionSummary | null;
  refreshSatisfactionSummary: () => Promise<void>;
  submitSatisfactionVote: (email: string, rating: SatisfactionRating) => Promise<void>;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Frontend-facing incident type labels <-> the lowercase enum values the API expects
const typeToApi: Record<IncidentType, string> = {
  'Graffiti': 'graffiti',
  'Anti-Social Behaviour': 'antisocial',
  'Safety Hazard': 'safetyhazard',
  'Maintenance Issue': 'maintenance',
};

const typeFromApi: Record<string, IncidentType> = {
  graffiti: 'Graffiti',
  antisocial: 'Anti-Social Behaviour',
  safetyhazard: 'Safety Hazard',
  maintenance: 'Maintenance Issue',
};

// Converts a raw API incident document into the shape the frontend uses,
// picking out only the type-specific fields relevant to that incident's type
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
    location: api.location,
    description: api.description,
    reporterEmail: api.reporterEmail,
    status: api.status,
    date: api.reportedDate || api.createdAt,
    photos: (api.photos || []).map((p: any) => ({ id: p._id || p.url, url: p.url, approved: p.approved, caption: p.caption })),
    typeSpecificData: Object.keys(typeSpecificData).length > 0 ? typeSpecificData : undefined,
    sendComplaintTo: api.sendComplaintTo,
    complaintDeliveryIssues: api.complaintDeliveryIssues,
  };
}

// Provides global app state (incidents, admin auth, satisfaction votes) to
// the whole component tree — mounted once in App.tsx around the router
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingIncidents, setPendingIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [satisfactionSummary, setSatisfactionSummary] = useState<SatisfactionSummary | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('charlemont-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Loads the incident feed (used by Home/AllIncidents/TrackReport, and by
  // AdminDashboard's manage-incidents tab). Sends the admin token when present
  // so the API includes reporterEmail — anonymous callers get it stripped.
  const refreshIncidents = async () => {
    setIsLoadingIncidents(true);
    try {
      const response = await axios.get(`${API_BASE}/incidents`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setIncidents(response.data.map(mapApiToIncident));
    } catch {
      // silently fail — network may be unavailable
    } finally {
      setIsLoadingIncidents(false);
    }
  };

  // Loads the admin moderation queue — requires a token, so it's a no-op when logged out
  const refreshPendingIncidents = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_BASE}/incidents/admin/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingIncidents(response.data.map(mapApiToIncident));
    } catch {
      // silently fail
    }
  };

  // Loads the public satisfaction vote aggregate shown on the Home page
  const refreshSatisfactionSummary = async () => {
    try {
      const response = await axios.get(`${API_BASE}/satisfaction/summary`);
      setSatisfactionSummary(response.data);
    } catch {
      // silently fail — network may be unavailable
    }
  };

  // Submits (or overwrites) the caller's satisfaction vote, then re-fetches
  // the aggregate so the results bar reflects the change immediately
  const submitSatisfactionVote = async (email: string, rating: SatisfactionRating): Promise<void> => {
    await axios.post(`${API_BASE}/satisfaction`, { email, rating });
    await refreshSatisfactionSummary();
  };

  // Initial data load on mount
  useEffect(() => {
    refreshIncidents();
    refreshSatisfactionSummary();
  }, []);

  // Persists the logged-in user's display info across page reloads
  useEffect(() => {
    if (user) {
      localStorage.setItem('charlemont-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('charlemont-user');
    }
  }, [user]);

  // Submits a new incident report as multipart/form-data (photos require it).
  // Complaint fields are only appended if the resident opted to escalate.
  const addIncident = async (incident: Omit<Incident, 'id' | 'date'>, complaint?: ComplaintData, turnstileToken?: string): Promise<string> => {
    const form = new FormData();
    form.append('incidentType', typeToApi[incident.type]);
    form.append('location', incident.location);
    form.append('description', incident.description);
    form.append('reporterEmail', incident.reporterEmail ?? '');
    form.append('turnstileToken', turnstileToken ?? '');

    if (incident.typeSpecificData) {
      Object.entries(incident.typeSpecificData).forEach(([key, value]) => {
        if (value != null) form.append(key, String(value));
      });
    }

    incident.photos.forEach(photo => {
      if (photo.file) form.append('photos', photo.file);
    });

    if (complaint && complaint.sendTo.length > 0) {
      form.append('complainantName', complaint.name);
      form.append('complainantAddress', complaint.address);
      form.append('sendComplaintTo', complaint.sendTo.join(','));
    }

    const response = await axios.post(`${API_BASE}/incidents/report`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Incident is now PENDING_REVIEW — not added to public incidents state
    return response.data.incidentId;
  };

  // Admin action: progress an incident's status (NEW -> IN_PROGRESS -> RESOLVED)
  const updateIncidentStatus = async (id: string, status: IncidentStatus): Promise<void> => {
    await axios.patch(
      `${API_BASE}/incidents/admin/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  // Admin action: permanently delete an incident
  const deleteIncident = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/incidents/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setIncidents(prev => prev.filter(i => i.id !== id));
    setPendingIncidents(prev => prev.filter(i => i.id !== id));
  };

  // Admin action: approve or reject a pending incident from the moderation queue
  const reviewIncident = async (id: string, action: 'approve' | 'reject'): Promise<void> => {
    await axios.patch(
      `${API_BASE}/incidents/admin/${id}/review`,
      { action },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPendingIncidents(prev => prev.filter(i => i.id !== id));
    if (action === 'approve') await refreshIncidents();
  };

  // Admin action: approve or reject a single photo on a pending incident
  const reviewPhoto = async (incidentId: string, photoId: string, approved: boolean): Promise<void> => {
    await axios.patch(
      `${API_BASE}/incidents/admin/${incidentId}/photos/${photoId}/review`,
      { approved },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPendingIncidents(prev => prev.map(i => {
      if (i.id !== incidentId) return i;
      return { ...i, photos: i.photos.map(p => p.id === photoId ? { ...p, approved } : p) };
    }));
  };

  // Looks up an already-loaded public incident by shortId (case-insensitive)
  const getIncidentById = (id: string) => {
    return incidents.find(i => i.id.toLowerCase() === id.toLowerCase());
  };

  // Admin login — stores the JWT and a minimal user object in localStorage on success
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { token: newToken, user: apiUser } = response.data;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser({ email, name: apiUser?.name || email.split('@')[0] });
      return true;
    } catch {
      return false;
    }
  };

  // Clears auth state and any admin-only data held in memory/localStorage
  const logout = () => {
    setToken(null);
    setUser(null);
    setPendingIncidents([]);
    localStorage.removeItem('token');
    localStorage.removeItem('charlemont-user');
  };

  return (
    <AppContext.Provider
      value={{
        incidents,
        isLoadingIncidents,
        refreshIncidents,
        addIncident,
        updateIncidentStatus,
        deleteIncident,
        getIncidentById,
        pendingIncidents,
        refreshPendingIncidents,
        reviewIncident,
        reviewPhoto,
        satisfactionSummary,
        refreshSatisfactionSummary,
        submitSatisfactionVote,
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook for accessing the shared app context — throws if used outside AppProvider
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
