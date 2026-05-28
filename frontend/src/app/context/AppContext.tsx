import axios from 'axios';
import React, { createContext, useContext, useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export type IncidentType = 'Graffiti' | 'Anti-Social Behaviour' | 'Safety Hazard' | 'Maintenance Issue';
export type IncidentStatus = 'PENDING_REVIEW' | 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface Photo {
  id: string;
  url: string;
  approved?: boolean;
  file?: File;
}

export interface Incident {
  id: string;
  type: IncidentType;
  location: string;
  description: string;
  reporterEmail?: string;
  status: IncidentStatus;
  date: string;
  photos: Photo[];
  typeSpecificData?: Record<string, any>;
}

export interface User {
  email: string;
  name: string;
}

interface AppContextType {
  incidents: Incident[];
  isLoadingIncidents: boolean;
  refreshIncidents: () => Promise<void>;
  addIncident: (incident: Omit<Incident, 'id' | 'date'>) => Promise<string>;
  updateIncidentStatus: (id: string, status: IncidentStatus) => Promise<void>;
  deleteIncident: (id: string) => Promise<void>;
  getIncidentById: (id: string) => Incident | undefined;
  pendingIncidents: Incident[];
  refreshPendingIncidents: () => Promise<void>;
  reviewIncident: (id: string, action: 'approve' | 'reject') => Promise<void>;
  reviewPhoto: (incidentId: string, photoId: string, approved: boolean) => Promise<void>;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    photos: (api.photos || []).map((p: any) => ({ id: p._id || p.url, url: p.url, approved: p.approved })),
    typeSpecificData: Object.keys(typeSpecificData).length > 0 ? typeSpecificData : undefined,
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [pendingIncidents, setPendingIncidents] = useState<Incident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('charlemont-user');
    return saved ? JSON.parse(saved) : null;
  });

  const refreshIncidents = async () => {
    setIsLoadingIncidents(true);
    try {
      const response = await axios.get(`${API_BASE}/incidents`);
      setIncidents(response.data.map(mapApiToIncident));
    } catch {
      // silently fail — network may be unavailable
    } finally {
      setIsLoadingIncidents(false);
    }
  };

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

  useEffect(() => {
    refreshIncidents();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('charlemont-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('charlemont-user');
    }
  }, [user]);

  const addIncident = async (incident: Omit<Incident, 'id' | 'date'>): Promise<string> => {
    const form = new FormData();
    form.append('incidentType', typeToApi[incident.type]);
    form.append('location', incident.location);
    form.append('description', incident.description);
    if (incident.reporterEmail) form.append('reporterEmail', incident.reporterEmail);

    if (incident.typeSpecificData) {
      Object.entries(incident.typeSpecificData).forEach(([key, value]) => {
        if (value != null) form.append(key, String(value));
      });
    }

    incident.photos.forEach(photo => {
      if (photo.file) form.append('photos', photo.file);
    });

    const response = await axios.post(`${API_BASE}/incidents/report`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // Incident is now PENDING_REVIEW — not added to public incidents state
    return response.data.incidentId;
  };

  const updateIncidentStatus = async (id: string, status: IncidentStatus): Promise<void> => {
    await axios.patch(
      `${API_BASE}/incidents/admin/${id}/status`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteIncident = async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/incidents/admin/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setIncidents(prev => prev.filter(i => i.id !== id));
    setPendingIncidents(prev => prev.filter(i => i.id !== id));
  };

  const reviewIncident = async (id: string, action: 'approve' | 'reject'): Promise<void> => {
    await axios.patch(
      `${API_BASE}/incidents/admin/${id}/review`,
      { action },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setPendingIncidents(prev => prev.filter(i => i.id !== id));
    if (action === 'approve') await refreshIncidents();
  };

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

  const getIncidentById = (id: string) => {
    return incidents.find(i => i.id.toLowerCase() === id.toLowerCase());
  };

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

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
