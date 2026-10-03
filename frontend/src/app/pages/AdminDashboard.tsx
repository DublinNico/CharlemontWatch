import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, CheckCircle, XCircle, Eye, EyeOff, AlertTriangle, Check, MapPin, Calendar, Mail, Send, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { useApp, IncidentStatus, Incident } from '../context/AppContext';
import { Button } from '../components/ui/button';

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
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="p-5 md:p-6 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <h3 className="h-7 px-3 rounded-md bg-muted text-[13px] font-medium inline-flex items-center tracking-normal">
              {incident.type}
            </h3>
            <span className="h-7 px-3 rounded-md bg-muted font-mono text-[13px] inline-flex items-center">{incident.id}</span>
            {!isQueue && <StatusBadge status={incident.status} />}
            {incident.sendComplaintTo && incident.sendComplaintTo.length > 0 && (
              isQueue ? (
                <span
                  className="h-7 px-3 rounded-md bg-status-await-bg text-status-await text-[13px] font-medium inline-flex items-center gap-1.5"
                  title="Approving this will email a formal complaint"
                >
                  <Send className="w-3.5 h-3.5" />
                  Complaint: {incident.sendComplaintTo.map(o => o === 'tuath' ? 'Túath' : 'DCC').join(', ')}
                </span>
              ) : (
                incident.sendComplaintTo.map(recipient => {
                  const sent = incident.complaintsSent?.some(c => c.recipientType === recipient);
                  const timeline = incident.complaintTimeline?.find(t => t.recipientType === recipient);
                  const label = recipient === 'tuath' ? 'Túath' : 'DCC';

                  const estimatedSuffix = timeline?.estimated ? ' (est.)' : '';
                  let colorClass = 'bg-muted text-muted-foreground';
                  let statusText = '';
                  let title = `Complaint to ${label} has not been confirmed sent yet`;
                  if (timeline?.responseOverdue) {
                    colorClass = 'bg-status-none-bg text-status-none';
                    statusText = ` Response Overdue${estimatedSuffix}`;
                    title = `Complaint to ${label} sent ${timeline.businessDaysElapsed} working days ago, past the ${timeline.responseThresholdDays}-day response threshold${timeline.estimated ? ' (sentAt is an estimate from the report date, not a confirmed send)' : ''}`;
                  } else if (sent) {
                    colorClass = 'bg-status-done-bg text-status-done';
                    statusText = ` Day ${timeline?.businessDaysElapsed ?? 0}/${timeline?.responseThresholdDays ?? 30}${estimatedSuffix}`;
                    title = timeline?.estimated
                      ? `Complaint to ${label}: sentAt is an estimate from the report date, not a confirmed send`
                      : `Complaint to ${label} sent ${timeline?.businessDaysElapsed} working days ago`;
                  }

                  return (
                    <span
                      key={recipient}
                      className={`h-7 px-3 rounded-md inline-flex items-center gap-1.5 text-[13px] font-medium ${colorClass}`}
                      title={title}
                    >
                      {timeline?.responseOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : sent ? <CheckCircle className="w-3.5 h-3.5" /> : null}
                      {label}{statusText}
                    </span>
                  );
                })
              )
            )}
          </div>

          {incident.title && (
            <h4 className="text-lg font-semibold tracking-[-0.015em] mb-1">{incident.title}</h4>
          )}
          <p className="text-sm text-muted-foreground mb-2 flex items-start gap-1.5">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span><span className="sr-only">Location:</span> {incident.location}</span>
          </p>
          <p className="text-[15px] text-muted-foreground mb-3 max-w-[75ch]">{incident.description}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-subtle-foreground mb-3">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Reported: {formattedDate}</span>
            {incident.reporterEmail
              ? <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email: {incident.reporterEmail}</span>
              : <span className="italic">Anonymous</span>}
          </div>

          {incident.typeSpecificData && Object.keys(incident.typeSpecificData).length > 0 && (
            <div className="bg-background border border-border rounded-md px-3 py-2 text-[13px] text-muted-foreground mb-3">
              {Object.entries(incident.typeSpecificData).map(([key, value]) => (
                <span key={key} className="mr-3">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {value as string}
                </span>
              ))}
            </div>
          )}

          {incident.photos.length > 0 && (
            <div className="mt-3">
              <p className="text-[13px] font-medium text-muted-foreground mb-2">
                Photos ({incident.photos.length})
                {isQueue && ': toggle to approve before publishing'}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {incident.photos.map(photo => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Incident photo'}
                      className={`w-20 h-20 md:w-[92px] md:h-[92px] object-cover rounded-md transition-opacity ${
                        isQueue && !photo.approved ? 'opacity-40' : 'opacity-100'
                      }`}
                    />
                    {isQueue && (
                      <button
                        onClick={() => onPhotoReview(incident.id, photo.id, !photo.approved)}
                        title={photo.approved ? 'Click to reject photo' : 'Click to approve photo'}
                        aria-label={photo.approved ? 'Reject photo' : 'Approve photo'}
                        className={`absolute right-1.5 bottom-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-2 ring-card transition-colors ${
                          photo.approved ? 'bg-status-done hover:bg-status-none' : 'bg-status-none hover:bg-status-done'
                        }`}
                      >
                        {photo.approved
                          ? <Eye className="w-3.5 h-3.5" />
                          : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-border bg-background p-5 md:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2.5 content-start">
          <span className="hidden lg:block text-[13px] font-semibold text-muted-foreground">{isQueue ? 'Decision' : 'Actions'}</span>
          {isQueue ? (
            <>
              <Button
                size="sm"
                onClick={() => onReview(incident.id, 'approve')}
                disabled={reviewingId === incident.id}
                className="w-full"
              >
                <Check className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReview(incident.id, 'reject')}
                disabled={reviewingId === incident.id}
                className="w-full"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(incident.id)}
                className="w-full col-span-2 sm:col-span-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              {incident.sendComplaintTo && incident.sendComplaintTo.length > 0 ? (
                <p className="col-span-full text-[13px] text-muted-foreground flex gap-2 mt-1">
                  <Send className="w-4 h-4 shrink-0 text-primary" />
                  Approving this will email a formal complaint to {incident.sendComplaintTo.map(o => o === 'tuath' ? 'Túath Housing' : 'Dublin City Council').join(' and ')}.
                </p>
              ) : (
                <p className="col-span-full text-[13px] text-subtle-foreground mt-1">Report only. No complaint will be sent.</p>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectIncident(incident)}
                className="w-full"
              >
                Update Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(incident.id)}
                className="w-full text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
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
  const [statusFilter, setStatusFilter] = useState<IncidentStatus>('AWAITING_RESPONSE');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [newStatus, setNewStatus] = useState<IncidentStatus>('AWAITING_RESPONSE');
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
    AWAITING_RESPONSE: incidents.filter(i => i.status === 'AWAITING_RESPONSE').length,
    NO_RESPONSE: incidents.filter(i => i.status === 'NO_RESPONSE').length,
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
    <div className="bg-background">
      <Header />

      <main className="page-container pb-10 space-y-6">
        <div className="pt-10 md:pt-12 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <h1 className="text-[34px] md:text-[40px] leading-[1.05] tracking-[-0.035em] font-bold">Admin Dashboard</h1>
            <button
              onClick={() => navigate('/')}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </div>

          {/* Top-level tabs */}
          <div className="inline-flex self-start md:self-auto p-1 rounded-md bg-muted gap-1" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'queue'}
              onClick={() => setActiveTab('queue')}
              className={`h-[38px] px-[18px] rounded-md transition-colors text-sm font-semibold flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/.08)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Review Queue
              {pendingIncidents.length > 0 && (
                <span className="bg-primary text-primary-foreground font-mono text-xs rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {pendingIncidents.length}
                </span>
              )}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'manage'}
              onClick={() => setActiveTab('manage')}
              className={`h-[38px] px-[18px] rounded-md transition-colors text-sm font-semibold ${
                activeTab === 'manage'
                  ? 'bg-card text-foreground shadow-[0_1px_2px_rgb(0_0_0/.08)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Manage Incidents
            </button>
          </div>
        </div>

        {actionError && (
          <div className="bg-status-none-bg text-status-none font-medium rounded-md px-4 py-3 text-sm" role="alert">
            {actionError}
          </div>
        )}

        {/* ── Review Queue ── */}
        {activeTab === 'queue' && (
          <>
            {pendingIncidents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <div className="size-14 rounded-full bg-status-done-bg text-status-done grid place-items-center mx-auto mb-4">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <p className="text-muted-foreground">No incidents awaiting review</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
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
              {(['AWAITING_RESPONSE', 'NO_RESPONSE', 'IN_PROGRESS', 'RESOLVED'] as IncidentStatus[]).map(s => {
                // Full class strings (not interpolated) so Tailwind's scanner picks them up
                const tabClasses: Record<string, { selected: string; unselected: string }> = {
                  AWAITING_RESPONSE: { selected: 'bg-status-await text-white', unselected: 'bg-status-await-bg text-status-await' },
                  NO_RESPONSE: { selected: 'bg-status-none text-white', unselected: 'bg-status-none-bg text-status-none' },
                  IN_PROGRESS: { selected: 'bg-status-progress text-white', unselected: 'bg-status-progress-bg text-status-progress' },
                  RESOLVED: { selected: 'bg-status-done text-white', unselected: 'bg-status-done-bg text-status-done' },
                };
                const classes = tabClasses[s];
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    aria-pressed={statusFilter === s}
                    className={`h-10 px-5 rounded-md transition-colors text-sm font-semibold capitalize ${statusFilter === s ? classes.selected : classes.unselected}`}
                  >
                    {s.replace(/_/g, ' ').toLowerCase()} <span className="font-mono">({statusCounts[s as keyof typeof statusCounts]})</span>
                  </button>
                );
              })}
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
                <div className="size-14 rounded-full bg-muted grid place-items-center mx-auto mb-4">
                  <Inbox className="w-6 h-6 text-subtle-foreground" />
                </div>
                <p className="text-muted-foreground">No incidents with status {statusFilter.replace(/_/g, ' ')}</p>
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
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="update-status-title">
          <div className="bg-card rounded-lg border border-border shadow-[0_24px_64px_-16px_rgb(22_24_26/.35)] p-6 md:p-8 max-w-md w-full">
            <h2 id="update-status-title" className="text-2xl mb-2">Update Status</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Incident ID: <span className="font-mono text-foreground">{selectedIncident.id}</span>
            </p>
            <div className="mb-7">
              <label htmlFor="new-status" className="block mb-2">Select Status</label>
              <select
                id="new-status"
                className="w-full h-12 px-3.5 border border-border bg-input-background rounded-md text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as IncidentStatus)}
              >
                <option value="AWAITING_RESPONSE">AWAITING RESPONSE</option>
                <option value="NO_RESPONSE">NO RESPONSE</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? 'Updating…' : 'Update Status'}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSelectedIncident(null)}
                disabled={isUpdating}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
