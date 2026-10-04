import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageSquare } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

interface PublicComment {
  _id: string;
  name: string;
  text: string;
  createdAt: string;
}

// Approved residents' comments, shown in the lower half of the Túath vote
// card. New comments are held for admin approval, so this only lists those.
export function VoteComments() {
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/satisfaction/comments`)
      .then(res => setComments(res.data))
      .catch(() => setLoadFailed(true));
  }, []);

  return (
    <div>
      <h3 className="text-[22px] md:text-[24px] font-bold leading-tight tracking-[-0.03em]">What residents are saying</h3>
      <p className="mt-2 text-[15px] text-muted-foreground">Comments are checked before they appear.</p>

      <div className="mt-6">
        {loadFailed ? (
          <p className="text-sm text-muted-foreground">Comments couldn't be loaded right now.</p>
        ) : comments.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <MessageSquare className="size-5 shrink-0" />
            No comments yet. Be the first to say something.
          </div>
        ) : (
          <ul className="grid md:grid-cols-2 gap-x-14 gap-y-5">
            {comments.map(c => (
              <li key={c._id} className="border-b border-border pb-5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold break-words min-w-0">{c.name}</span>
                  <time dateTime={c.createdAt} className="text-[13px] text-subtle-foreground shrink-0">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </time>
                </div>
                <p className="mt-1.5 text-[15px] text-muted-foreground whitespace-pre-wrap break-words">{c.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
