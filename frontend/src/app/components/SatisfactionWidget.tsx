import { useState } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { useApp, SatisfactionRating } from '../context/AppContext';
import { Card, CardDescription, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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

// Home page widget: lets a resident vote (or change their vote) on
// satisfaction with Túath Housing, and shows the live public results bar
export function SatisfactionWidget() {
  const { satisfactionSummary, submitSatisfactionVote } = useApp();
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<SatisfactionRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Validates and submits the vote via the shared app context
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !rating) {
      setError('Please provide your email and select a rating.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await submitSatisfactionVote(email, rating);
      setSubmitted(true);
    } catch {
      setError('Failed to submit your vote. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Converts raw vote counts into display percentages for the results bar
  const total = satisfactionSummary?.total ?? 0;
  const percentages = RATINGS.map(r => ({
    ...r,
    count: satisfactionSummary?.[r.value] ?? 0,
    pct: total > 0 ? Math.round(((satisfactionSummary?.[r.value] ?? 0) / total) * 100) : 0,
  }));

  return (
    <Card className="p-6 md:p-12 grid md:grid-cols-2 gap-9 md:gap-14">
      <div className="min-w-0">
        <CardTitle className="text-[28px] md:text-[32px] font-bold leading-tight tracking-[-0.03em]">Are you happy with Túath Housing?</CardTitle>
        <CardDescription className="mt-3 text-base">
          Vote once with your email. You can change your vote any time by submitting again.
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
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 min-w-0">
        {submitted && (
          <p className="text-sm text-status-done font-medium">
            Thanks! Your vote has been recorded. You can change it any time below.
          </p>
        )}
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}

        <div>
          <div className="text-sm font-semibold mb-2.5">Your rating</div>
          <div className="grid grid-cols-3 gap-2.5">
            {RATINGS.map(r => (
              <Button
                key={r.value}
                type="button"
                variant="outline"
                aria-pressed={rating === r.value}
                onClick={() => { setRating(r.value); setSubmitted(false); }}
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
            onChange={e => { setEmail(e.target.value); setSubmitted(false); }}
          />
          <p className="text-[13px] text-subtle-foreground mt-2">
            Never published, and used only to keep one vote per resident.
          </p>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting…' : submitted ? 'Update Vote' : 'Submit Vote'}
        </Button>
      </form>
    </Card>
  );
}
