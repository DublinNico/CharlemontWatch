import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { useApp, IncidentStatus, Incident, IncidentType } from '../context/AppContext';

const typeColors: Record<IncidentType, string> = {
  'Graffiti': '#f57c00',
  'Anti-Social Behaviour': '#d32f2f',
  'Safety Hazard': '#fbc02d',
  'Maintenance Issue': '#388e3c',
};

export function AdminDashboard() {
  const navigate = useNavigate();
  const { incidents, updateIncidentStatus, deleteIncident, isAuthenticated } = useApp();
  const [statusFilter, setStatusFilter] = useState<IncidentStatus>('NEW');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('NEW');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
    }
  }, [isAuthenticated, navigate]);

  const filteredIncidents = incidents.filter(i => i.status === statusFilter);

  const handleUpdateStatus = async () => {
    if (!selectedIncident) return;
    setIsUpdating(true);
    setActionError('');
    try {
      await updateIncidentStatus(selectedIncident.id, newStatus);
      setSelectedIncident(null);
    } catch {
      setActionError('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    setActionError('');
    try {
      await deleteIncident(id);
    } catch {
      setActionError('Failed to delete incident. Please try again.');
    }
  };

  const statusCounts = {
    NEW: incidents.filter(i => i.status === 'NEW').length,
    IN_PROGRESS: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <div className="bg-white shadow-sm border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-[#333333]">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {actionError && (
          <div className="bg-[#ffebee] border border-[#d32f2f] text-[#d32f2f] rounded px-4 py-3 text-sm">
            {actionError}
          </div>
        )}
        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setStatusFilter('NEW')}
            className={`px-6 py-2 rounded-full transition-colors ${
              statusFilter === 'NEW'
                ? 'bg-[#1976d2] text-white'
                : 'border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd]'
            }`}
          >
            NEW ({statusCounts.NEW})
          </button>
          <button
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`px-6 py-2 rounded-full transition-colors ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-[#f57c00] text-white'
                : 'border border-[#f57c00] text-[#f57c00] hover:bg-[#fff3e0]'
            }`}
          >
            IN PROGRESS ({statusCounts.IN_PROGRESS})
          </button>
          <button
            onClick={() => setStatusFilter('RESOLVED')}
            className={`px-6 py-2 rounded-full transition-colors ${
              statusFilter === 'RESOLVED'
                ? 'bg-[#388e3c] text-white'
                : 'border border-[#388e3c] text-[#388e3c] hover:bg-[#e8f5e9]'
            }`}
          >
            RESOLVED ({statusCounts.RESOLVED})
          </button>
        </div>

        {/* Incidents list */}
        {filteredIncidents.length === 0 ? (
          <div className="bg-white rounded shadow-sm p-12 text-center">
            <p className="text-[#666666]">No incidents with status {statusFilter}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map(incident => {
              const formattedDate = new Date(incident.date).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={incident.id}
                  className="bg-white rounded shadow-sm border-l-4 p-4"
                  style={{ borderLeftColor: typeColors[incident.type] }}
                >
                  <div className="flex flex-col lg:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3
                          className="text-sm uppercase tracking-wide"
                          style={{ color: typeColors[incident.type] }}
                        >
                          {incident.type}
                        </h3>
                        <span className="text-xs text-white bg-[#1976d2] px-2 py-1 rounded">
                          {incident.id}
                        </span>
                        <StatusBadge status={incident.status} />
                      </div>

                      <p className="text-sm text-[#333333] mb-2">
                        <span className="font-medium">Location:</span> {incident.location}
                      </p>
                      <p className="text-sm text-[#666666] mb-2">{incident.description}</p>

                      <div className="flex flex-wrap gap-4 text-xs text-[#666666] mb-2">
                        <span>Reported: {formattedDate}</span>
                        {incident.reporterEmail ? (
                          <span>Email: {incident.reporterEmail}</span>
                        ) : (
                          <span className="italic">Anonymous</span>
                        )}
                        {incident.photos.length > 0 && (
                          <span>{incident.photos.length} photo{incident.photos.length > 1 ? 's' : ''}</span>
                        )}
                      </div>

                      {incident.typeSpecificData && Object.keys(incident.typeSpecificData).length > 0 && (
                        <div className="bg-[#f5f5f5] rounded p-2 text-xs text-[#666666] mb-2">
                          {Object.entries(incident.typeSpecificData).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value as string}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2">
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setNewStatus(incident.status);
                        }}
                        className="px-4 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors text-sm whitespace-nowrap"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => handleDelete(incident.id)}
                        className="px-4 py-2 border border-[#d32f2f] text-[#d32f2f] hover:bg-[#ffebee] rounded transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Status Update Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h2 className="text-[#333333] mb-4">Update Status</h2>
            <p className="text-sm text-[#666666] mb-4">
              Incident ID: <span className="font-mono text-[#1976d2]">{selectedIncident.id}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm text-[#333333] mb-2">Select Status</label>
              <select
                className="w-full px-3 py-2 border border-[#eeeeee] rounded focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as IncidentStatus)}
              >
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors disabled:opacity-60"
              >
                {isUpdating ? 'Updating…' : 'Update Status'}
              </button>
              <button
                onClick={() => setSelectedIncident(null)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 border border-[#666666] text-[#666666] hover:bg-[#f5f5f5] rounded transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
