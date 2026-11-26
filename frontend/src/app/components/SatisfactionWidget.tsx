import { useState } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { useApp, SatisfactionRating } from '../context/AppContext';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ShareVote } from './ShareVote';

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

// Home page and /vote card: residents rate Túath Housing with just an email.
// Shows the live results bar and share buttons.
export function SatisfactionWidget() {
  const { satisfactionSummary, submitSatisfactionVote } = useApp();
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<SatisfactionRating | null>(null);
  const [isResident, setIsResident] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!rating) {
      setError('Please choose a rating.');
      return;
    }
    if (!isResident) {
      setError('Please confirm you live in ffrench-Mullen House.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setVoted(false);
    try {
      await submitSatisfactionVote(email, rating);
      setVoted(true);
    } catch {
      setError('Your vote didn\'t go through. Please check your connection and try again.');
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
            You only need your email, and you can change your vote any time by submitting again.
          </CardDescription>
          <p className="mt-3 text-[15px] text-muted-foreground">
            Votes are not sent to Túath Housing. The results are published here so residents can see them and hold Túath to account.
          </p>

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

          {/* Share buttons, or after voting, the thank-you message with the
              share prompt — in the left column so the form doesn't jump down */}
          <div className="mt-7">
            {voted ? (
              <div className="rounded-md border border-border bg-muted/40 p-4 space-y-3.5" role="status">
                <p className="text-sm text-status-done font-medium">
                  Thanks! Your vote has been recorded.
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
              Your rating
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {RATINGS.map(r => (
                <Button
                  key={r.value}
                  type="button"
                  variant="outline"
                  aria-pressed={rating === r.value}
                  onClick={() => { setRating(rating === r.value ? null : r.value); setVoted(false); }}
                  className={`flex flex-col h-[76px] rounded-md gap-1 font-medium bg-background ${rating === r.value ? 'border-primary bg-primary-soft ring-1 ring-primary hover:bg-primary-soft' : ''}`}
                >
                  <r.icon className="size-6" />
                  <span className="text-sm">{r.label}</span>
                </Button>
              ))}
            </div>
          </div>

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
              onChange={e => { setEmail(e.target.value); setVoted(false); }}
            />
            <p className="text-[13px] text-subtle-foreground mt-2">
              Never published, and used only to keep one vote per resident.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="satisfaction-resident"
              checked={isResident}
              onCheckedChange={v => setIsResident(!!v)}
            />
            <Label htmlFor="satisfaction-resident" className="cursor-pointer">I live in ffrench-Mullen House</Label>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Submitting…' : 'Submit'}
          </Button>
        </form>
      </div>
    </Card>
  );
}
