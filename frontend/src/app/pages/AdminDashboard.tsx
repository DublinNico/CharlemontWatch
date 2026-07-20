import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { useApp, IncidentStatus, Incident, IncidentType } from '../context/AppContext';

// Left-border accent color per incident type in the dashboard rows
const typeColors: Record<IncidentType, string> = {
  'Graffiti': '#f57c00',
  'Anti-Social Behaviour': '#d32f2f',
  'Safety Hazard': '#fbc02d',
  'Maintenance Issue': '#388e3c',
};

type ActiveTab = 'queue' | 'manage';

interface IncidentRowProps {
  incident: Incident;
  isQueue?: boolean;
  reviewingId: string | null;
  onReview: (id: string, action: 'approve' | 'reject') => void;
  onPhotoReview: (incidentId: string, photoId: string, approved: boolean) => void;
  onDelete: (id: string) => void;
  onSelectIncident: (incident: Incident) => void;
}

// A single incident's row in either the review queue or the manage-incidents
// list. isQueue toggles between approve/reject/delete actions (queue) and
// update-status/delete actions (manage), and whether photos are individually
// toggleable for approval.
function IncidentRow({ incident, isQueue = false, reviewingId, onReview, onPhotoReview, onDelete, onSelectIncident }: IncidentRowProps) {
  const formattedDate = new Date(incident.date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      className="bg-white rounded shadow-sm border-l-4 p-4"
      style={{ borderLeftColor: typeColors[incident.type] }}
    >
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-sm uppercase tracking-wide" style={{ color: typeColors[incident.type] }}>
              {incident.type}
            </h3>
            <span className="text-xs text-white bg-indigo-600 px-2 py-1 rounded">{incident.id}</span>
            {!isQueue && <StatusBadge status={incident.status} />}
            {incident.sendComplaintTo && incident.sendComplaintTo.length > 0 && (
              <span
                className="text-xs font-semibold text-white bg-[#d32f2f] px-2 py-1 rounded"
                title={isQueue ? 'Approving this will email a formal complaint' : 'A formal complaint was sent when this was approved'}
              >
                Complaint: {incident.sendComplaintTo.map(o => o === 'tuath' ? 'Túath' : 'DCC').join(', ')}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-800 mb-2">
            <span className="font-medium">Location:</span> {incident.location}
          </p>
          <p className="text-sm text-gray-500 mb-2">{incident.description}</p>

          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-2">
            <span>Reported: {formattedDate}</span>
            {incident.reporterEmail
              ? <span>Email: {incident.reporterEmail}</span>
              : <span className="italic">Anonymous</span>}
          </div>

          {incident.typeSpecificData && Object.keys(incident.typeSpecificData).length > 0 && (
            <div className="bg-gray-50 rounded p-2 text-xs text-gray-500 mb-3">
              {Object.entries(incident.typeSpecificData).map(([key, value]) => (
                <span key={key} className="mr-3">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value as string}
                </span>
              ))}
            </div>
          )}

          {incident.photos.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Photos ({incident.photos.length})
                {isQueue && ': toggle to approve before publishing'}
              </p>
              <div className="flex flex-wrap gap-2">
                {incident.photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Incident photo'}
                      className={`w-20 h-20 object-cover rounded border-2 transition-all ${
                        isQueue
                          ? photo.approved
                            ? 'border-green-500 opacity-100'
                            : 'border-red-300 opacity-60'
                          : 'border-border'
                      }`}
                    />
                    {isQueue && (
                      <button
                        onClick={() => onPhotoReview(incident.id, photo.id, !photo.approved)}
                        title={photo.approved ? 'Click to reject photo' : 'Click to approve photo'}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow text-white transition-colors ${
                          photo.approved ? 'bg-green-500 hover:bg-red-500' : 'bg-red-400 hover:bg-green-500'
                        }`}
                      >
                        {photo.approved
                          ? <Eye className="w-3 h-3" />
                          : <EyeOff className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-row lg:flex-col gap-2 shrink-0">
          {isQueue ? (
            <>
              <button
                onClick={() => onReview(incident.id, 'approve')}
                disabled={reviewingId === incident.id}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => onReview(incident.id, 'reject')}
                disabled={reviewingId === incident.id}
                className="px-4 py-2 border border-destructive text-destructive hover:bg-destructive/10 rounded transition-colors text-sm whitespace-nowrap flex items-center gap-2 disabled:opacity-60"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="px-4 py-2 border border-gray-400 text-gray-500 hover:bg-gray-100 rounded transition-colors text-sm whitespace-nowrap flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectIncident(incident)}
                className="px-4 py-2 border border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded transition-colors text-sm whitespace-nowrap"
              >
                Update Status
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="px-4 py-2 border border-destructive text-destructive hover:bg-destructive/10 rounded transition-colors text-sm whitespace-nowrap flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin-only dashboard: a moderation queue for PENDING_REVIEW incidents and
// a status-management view for already-approved ones. Redirects to login if
// not authenticated.
export function AdminDashboard() {
  const navigate = useNavigate();
  const {
    incidents,
    updateIncidentStatus,
    deleteIncident,
    isAuthenticated,
    pendingIncidents,
    refreshPendingIncidents,
    reviewIncident,
    reviewPhoto,
  } = useApp();

  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus>('NEW');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('NEW');
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Guard: bounce unauthenticated visitors back to the (hidden) login page
  useEffect(() => {
    if (!isAuthenticated) navigate(`/cw-admin?key=${import.meta.env.VITE_ADMIN_KEY}`);
  }, [isAuthenticated, navigate]);

  // Refresh the moderation queue whenever it becomes the active tab
  useEffect(() => {
    if (activeTab === 'queue') refreshPendingIncidents();
  }, [activeTab]);

  const filteredIncidents = incidents.filter(i => i.status === statusFilter);

  // Tab-pill counts for the Manage Incidents view
  const statusCounts = {
    NEW: incidents.filter(i => i.status === 'NEW').length,
    IN_PROGRESS: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    RESOLVED: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  // Submits the status change picked in the modal for selectedIncident
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

  // Permanently deletes an incident, after a native confirm() prompt
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    setActionError('');
    try {
      await deleteIncident(id);
    } catch {
      setActionError('Failed to delete incident. Please try again.');
    }
  };

  // Approves or rejects a pending incident from the moderation queue
  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setReviewingId(id);
    setActionError('');
    try {
      await reviewIncident(id, action);
    } catch {
      setActionError(`Failed to ${action} incident. Please try again.`);
    } finally {
      setReviewingId(null);
    }
  };

  // Toggles a single photo's approval state on a pending incident
  const handlePhotoReview = async (incidentId: string, photoId: string, approved: boolean) => {
    try {
      await reviewPhoto(incidentId, photoId, approved);
    } catch {
      setActionError('Failed to update photo. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <div className="bg-white shadow-sm border-b border-[#eeeeee]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-[#333333]">Admin Dashboard</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {actionError && (
          <div className="bg-[#ffebee] border border-[#d32f2f] text-[#d32f2f] rounded px-4 py-3 text-sm">
            {actionError}
          </div>
        )}

        {/* Top-level tabs */}
        <div className="flex gap-3 border-b border-[#eeeeee] pb-0">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-5 py-2 rounded-t transition-colors text-sm font-medium flex items-center gap-2 ${
              activeTab === 'queue'
                ? 'bg-white border border-b-white border-[#eeeeee] -mb-px text-[#1976d2]'
                : 'text-[#666666] hover:text-[#333333]'
            }`}
          >
            Review Queue
            {pendingIncidents.length > 0 && (
              <span className="bg-[#d32f2f] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingIncidents.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-2 rounded-t transition-colors text-sm font-medium ${
              activeTab === 'manage'
                ? 'bg-white border border-b-white border-[#eeeeee] -mb-px text-[#1976d2]'
                : 'text-[#666666] hover:text-[#333333]'
            }`}
          >
            Manage Incidents
          </button>
        </div>

        {/* ── Review Queue ── */}
        {activeTab === 'queue' && (
          <>
            {pendingIncidents.length === 0 ? (
              <div className="bg-white rounded shadow-sm p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-[#666666]">No incidents awaiting review</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[#666666]">
                  {pendingIncidents.length} incident{pendingIncidents.length !== 1 ? 's' : ''} awaiting review.
                  Toggle individual photos before approving, or approve all at once.
                </p>
                {pendingIncidents.map(incident => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    isQueue
                    reviewingId={reviewingId}
                    onReview={handleReview}
                    onPhotoReview={handlePhotoReview}
                    onDelete={handleDelete}
                    onSelectIncident={(i) => { setSelectedIncident(i); setNewStatus(i.status); }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Manage Incidents ── */}
        {activeTab === 'manage' && (
          <>
            <div className="flex flex-wrap gap-3">
              {(['NEW', 'IN_PROGRESS', 'RESOLVED'] as IncidentStatus[]).map(s => {
                const colors: Record<string, string> = {
                  NEW: '#1976d2', IN_PROGRESS: '#f57c00', RESOLVED: '#388e3c'
                };
                const color = colors[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-6 py-2 rounded-full transition-colors text-sm"
                    style={
                      statusFilter === s
                        ? { backgroundColor: color, color: '#fff' }
                        : { border: `1px solid ${color}`, color }
                    }
                  >
                    {s.replace('_', ' ')} ({statusCounts[s as keyof typeof statusCounts]})
                  </button>
                );
              })}
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="bg-white rounded shadow-sm p-12 text-center">
                <p className="text-[#666666]">No incidents with status {statusFilter}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIncidents.map(incident => (
                  <IncidentRow
                    key={incident.id}
                    incident={incident}
                    reviewingId={reviewingId}
                    onReview={handleReview}
                    onPhotoReview={handlePhotoReview}
                    onDelete={handleDelete}
                    onSelectIncident={(i) => { setSelectedIncident(i); setNewStatus(i.status); }}
                  />
                ))}
              </div>
            )}
          </>
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
