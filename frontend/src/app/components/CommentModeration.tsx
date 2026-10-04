import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle, Check, Trash2, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export interface AdminComment {
  _id: string;
  name: string;
  email: string;
  text: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

// Admin Dashboard "Comments" tab: approve or delete residents' comments on
// the Túath satisfaction vote. Pending comments are listed first.
export function CommentModeration() {
  const { token } = useApp();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    axios.get(`${API_BASE}/satisfaction/comments/admin`, { headers })
      .then(res => setComments(res.data))
      .catch(() => setError('Failed to load comments.'))
      .finally(() => setLoading(false));
  }, [token]);

  const approve = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await axios.patch(`${API_BASE}/satisfaction/comments/admin/${id}/approve`, {}, { headers });
      setComments(cs => cs.map(c => (c._id === id ? { ...c, status: 'approved' } : c)));
    } catch {
      setError('Failed to approve the comment. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await axios.delete(`${API_BASE}/satisfaction/comments/admin/${id}`, { headers });
      setComments(cs => cs.filter(c => c._id !== id));
    } catch {
      setError('Failed to delete the comment. Please try again.');
    } finally {
      setBusyId(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading comments…</p>;

  const pending = comments.filter(c => c.status === 'pending');
  const approved = comments.filter(c => c.status === 'approved');

  const renderComment = (c: AdminComment) => (
    <li key={c._id} className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold break-words min-w-0">{c.name}</span>
        <span className="text-[13px] text-subtle-foreground">
          {new Date(c.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <a href={`mailto:${c.email}`} className="mt-1 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground break-all">
        <Mail className="size-3.5 shrink-0" />
        {c.email}
      </a>
      <p className="mt-3 text-[15px] whitespace-pre-wrap break-words">{c.text}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {c.status === 'pending' && (
          <Button size="sm" onClick={() => approve(c._id)} disabled={busyId === c._id}>
            <Check className="size-4" />
            Approve
          </Button>
        )}
        {confirmDeleteId === c._id ? (
          <>
            <Button size="sm" variant="destructive" onClick={() => remove(c._id)} disabled={busyId === c._id}>
              <Trash2 className="size-4" />
              Confirm delete
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(c._id)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>
    </li>
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-status-none-bg text-status-none font-medium rounded-md px-4 py-3 text-sm" role="alert">{error}</div>
      )}

      <section>
        <h2 className="text-lg font-bold mb-3">Awaiting approval ({pending.length})</h2>
        {pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <div className="size-12 rounded-full bg-status-done-bg text-status-done grid place-items-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground">No comments awaiting approval</p>
          </div>
        ) : (
          <ul className="space-y-3">{pending.map(renderComment)}</ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-3">Published ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published comments yet.</p>
        ) : (
          <ul className="space-y-3">{approved.map(renderComment)}</ul>
        )}
      </section>
    </div>
  );
}
