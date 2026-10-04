import { useState } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { useApp, SatisfactionRating } from '../context/AppContext';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ShareVote } from './ShareVote';
import { VoteComments } from './VoteComments';

const MAX_COMMENT_LENGTH = 1000;

// The three selectable rating options, each with its icon
const RATINGS: { value: SatisfactionRating; label: string; icon: typeof Smile }[] = [
  { value: 'low', label: 'Low', icon: Frown },
  { value: 'medium', label: 'Medium', icon: Meh },
  { value: 'high', label: 'High', icon: Smile },
];

// Segment color for each rating in the results bar
const BAR_COLORS: Record<SatisfactionRating, string> = {
  low: 'bg-status-none',
  medium: 'bg-status-progress',
  high: 'bg-status-done',
};

// What the last submit achieved, so the thank-you message can say exactly
// which parts went through (and a half-failed submit isn't resent in full)
interface SubmitResult {
  voted: boolean;
  commented: boolean;
}

// Home page and /vote card: residents rate Túath Housing, leave a comment, or
// both, with just an email. Shows the live results bar, share buttons, and
// approved comments below.
export function SatisfactionWidget() {
  const { satisfactionSummary, submitSatisfactionVote, submitVoteComment } = useApp();
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<SatisfactionRating | null>(null);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SubmitResult | null>(null);

  // Sends the vote and/or comment. They go to separate endpoints, so each
  // can succeed or fail on its own and the message reports both outcomes.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!rating && !comment.trim()) {
      setError('Choose a rating, write a comment, or both.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setResult(null);

    const [voteOutcome, commentOutcome] = await Promise.allSettled([
      rating ? submitSatisfactionVote(email, rating) : Promise.resolve(null),
      comment.trim() ? submitVoteComment(email, comment, name, website) : Promise.resolve(null),
    ]);
    const voteFailed = !!rating && voteOutcome.status === 'rejected';
    const commentFailed = !!comment.trim() && commentOutcome.status === 'rejected';
    const voted = !!rating && !voteFailed;
    const commented = !!comment.trim() && !commentFailed;

    if (commented) setComment('');
    if (voted || commented) setResult({ voted, commented });

    if (voteFailed && commentFailed) {
      setError('Failed to send your vote and comment. Please check your connection and try again.');
    } else if (voteFailed) {
      setError('Your vote didn\'t go through. Please try again (your comment was sent).');
    } else if (commentFailed) {
      const serverError = (commentOutcome as PromiseRejectedResult).reason?.response?.data?.error;
      setError(`${serverError || 'Your comment didn\'t go through.'} Please try again${voted ? ' (your vote was recorded).' : '.'}`);
    }
    setIsSubmitting(false);
  };

  // Converts raw vote counts into display percentages for the results bar
  const total = satisfactionSummary?.total ?? 0;
  const percentages = RATINGS.map(r => ({
    ...r,
    count: satisfactionSummary?.[r.value] ?? 0,
    pct: total > 0 ? Math.round(((satisfactionSummary?.[r.value] ?? 0) / total) * 100) : 0,
  }));

  return (
    <Card className="p-6 md:p-12 gap-0">
      <div className="grid md:grid-cols-2 gap-9 md:gap-14">
        <div className="min-w-0">
          <CardTitle className="text-[28px] md:text-[32px] font-bold leading-tight tracking-[-0.03em]">Are you happy with Túath Housing?</CardTitle>
          <CardDescription className="mt-3 text-base">
            Vote, leave a comment, or both. You only need your email, and you can change your vote any time by submitting again.
          </CardDescription>

          <div className="mt-7">
            {total > 0 ? (
              <div className="flex h-3.5 rounded-sm overflow-hidden gap-[3px]">
                {percentages.map(r => (
                  r.pct > 0 && (
                    <div
                      key={r.value}
                      className={BAR_COLORS[r.value]}
                      style={{ width: `${r.pct}%` }}
                      title={`${r.label}: ${r.pct}%`}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="h-3.5 rounded-sm border border-dashed border-border" />
            )}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3.5 text-sm text-muted-foreground">
              {percentages.map(r => (
                <span key={r.value} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${BAR_COLORS[r.value]}`} />
                  {r.label}: {r.pct}% ({r.count})
                </span>
              ))}
            </div>
            <p className="text-[13px] text-subtle-foreground mt-2">
              {total > 0 ? `${total} vote${total === 1 ? '' : 's'} so far` : 'No votes yet. Be the first to vote'}
            </p>
          </div>

          {/* Share buttons, or after submitting, the thank-you message with the
              share prompt — in the left column so the form doesn't jump down */}
          <div className="mt-7">
            {result ? (
              <div className="rounded-md border border-border bg-muted/40 p-4 space-y-3.5" role="status">
                <p className="text-sm text-status-done font-medium">
                  Thanks!
                  {result.voted && ' Your vote has been recorded.'}
                  {result.commented && ' Your comment will appear once it\'s been approved. We\'ve emailed you a link in case you want to delete it later.'}
                </p>
                <p className="text-sm font-semibold">Now ask a neighbour to have their say →</p>
                <ShareVote total={total} hideLabel />
              </div>
            ) : (
              <ShareVote total={total} />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 min-w-0" noValidate>
          {error && <p className="text-sm text-destructive font-medium" role="alert">{error}</p>}

          <div>
            <div className="text-sm font-semibold mb-2.5">
              Your rating <span className="font-normal text-muted-foreground">(optional)</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {RATINGS.map(r => (
                <Button
                  key={r.value}
                  type="button"
                  variant="outline"
                  aria-pressed={rating === r.value}
                  onClick={() => { setRating(rating === r.value ? null : r.value); setResult(null); }}
                  className={`flex flex-col h-[76px] rounded-md gap-1 font-medium bg-background ${rating === r.value ? 'border-primary bg-primary-soft ring-1 ring-primary hover:bg-primary-soft' : ''}`}
                >
                  <r.icon className="size-6" />
                  <span className="text-sm">{r.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="satisfaction-comment" className="mb-2 block">
              Your Comment <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="satisfaction-comment"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              onChange={e => { setComment(e.target.value); setResult(null); }}
            />
            <p className="text-[13px] text-subtle-foreground mt-2">
              {comment.length}/{MAX_COMMENT_LENGTH}. Checked before it appears. Stick to facts and your own experience; comments naming individuals won't be approved.
            </p>
          </div>

          {comment.trim() && (
            <div>
              <Label htmlFor="satisfaction-name" className="mb-2 block">
                Name to show <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="satisfaction-name"
                maxLength={50}
                placeholder="A resident"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="satisfaction-email" className="mb-2 block">
              Your Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="satisfaction-email"
              type="email"
              required
              placeholder="your.email@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setResult(null); }}
            />
            <p className="text-[13px] text-subtle-foreground mt-2">
              Never published, and used only to keep one vote per resident.
            </p>
          </div>

          {/* Honeypot: off-screen from real users; bots that autofill every
              field fill it in, and the backend silently drops the comment */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="satisfaction-website">Website</label>
            <input
              id="satisfaction-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={e => setWebsite(e.target.value)}
            />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      </div>

      <div className="mt-10 pt-10 border-t border-border">
        <VoteComments />
      </div>
    </Card>
  );
}
