import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface OwnComment {
  name: string;
  text: string;
  status: 'pending' | 'approved';
  createdAt: string;
}

// Landing page for the private "delete my comment" link emailed to each
// commenter. Shows the comment and asks for a click to confirm, so email
// link scanners that open the URL can't delete anything on their own.
export function DeleteComment() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [comment, setComment] = useState<OwnComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    axios.post(`${API_BASE}/satisfaction/comments/mine`, { token })
      .then(res => setComment(res.data))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true);
        else setError('Something went wrong loading your comment. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/satisfaction/comments/mine/delete`, { token });
      setDeleted(true);
    } catch (err: any) {
      if (err.response?.status === 404) setNotFound(true);
      else setError('Failed to delete your comment. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-10 md:pt-16 pb-10 max-w-[680px]">
        <h1 className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.035em] font-bold">Delete your comment</h1>

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading your comment…</p>
        ) : deleted ? (
          <div className="mt-6" role="status">
            <p className="flex items-center gap-2 text-lg font-medium text-status-done">
              <CheckCircle2 className="size-5" />
              Your comment has been deleted.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-6">
              <Link to="/vote">Back to the vote</Link>
            </Button>
          </div>
        ) : notFound ? (
          <div className="mt-6">
            <p className="text-lg text-muted-foreground">
              This link isn't valid, or the comment has already been deleted.
            </p>
            <Button asChild size="lg" variant="outline" className="mt-6">
              <Link to="/vote">Back to the vote</Link>
            </Button>
          </div>
        ) : (
          <>
            {error && <p className="mt-6 text-sm text-destructive font-medium" role="alert">{error}</p>}
            {comment && (
              <>
                <p className="mt-4 text-lg text-muted-foreground">
                  {comment.status === 'approved'
                    ? 'This comment is published on the Túath Housing vote.'
                    : 'This comment is waiting for approval and isn\'t public yet.'}{' '}
                  Deleting it removes it permanently.
                </p>
                <div className="mt-6 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold break-words min-w-0">{comment.name}</span>
                    <time dateTime={comment.createdAt} className="text-[13px] text-subtle-foreground shrink-0">
                      {new Date(comment.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                  </div>
                  <p className="mt-2 text-[15px] text-muted-foreground whitespace-pre-wrap break-words">{comment.text}</p>
                </div>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <Button size="lg" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                    <Trash2 className="size-4" />
                    {isDeleting ? 'Deleting…' : 'Delete my comment'}
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/vote">Keep it</Link>
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
