import { useState } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { useApp, SatisfactionRating } from '../context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const RATINGS: { value: SatisfactionRating; label: string; icon: typeof Smile; activeClass: string }[] = [
  { value: 'low', label: 'Low', icon: Frown, activeClass: 'bg-red-600 hover:bg-red-700 text-white' },
  { value: 'medium', label: 'Medium', icon: Meh, activeClass: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { value: 'high', label: 'High', icon: Smile, activeClass: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
];

const BAR_COLORS: Record<SatisfactionRating, string> = {
  low: 'bg-red-500',
  medium: 'bg-amber-500',
  high: 'bg-emerald-500',
};

export function SatisfactionWidget() {
  const { satisfactionSummary, submitSatisfactionVote } = useApp();
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<SatisfactionRating | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

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

  const total = satisfactionSummary?.total ?? 0;
  const percentages = RATINGS.map(r => ({
    ...r,
    count: satisfactionSummary?.[r.value] ?? 0,
    pct: total > 0 ? Math.round(((satisfactionSummary?.[r.value] ?? 0) / total) * 100) : 0,
  }));

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">Are you happy with Túath Housing?</CardTitle>
        <CardDescription>
          Vote once with your email. You can change your vote any time by submitting again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          {total > 0 ? (
            <div className="flex h-4 rounded-full overflow-hidden bg-slate-100">
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
            <div className="h-4 rounded-full bg-slate-100" />
          )}
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm text-muted-foreground">
            {percentages.map(r => (
              <span key={r.value} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${BAR_COLORS[r.value]}`} />
                {r.label}: {r.pct}% ({r.count})
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {total > 0 ? `${total} vote${total === 1 ? '' : 's'} so far` : 'No votes yet. Be the first to vote'}
          </p>
        </div>
        <div className="border-t border-border" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {submitted && (
            <p className="text-sm text-emerald-700 font-medium">
              Thanks! Your vote has been recorded. You can change it any time below.
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="grid grid-cols-3 gap-3">
            {RATINGS.map(r => (
              <Button
                key={r.value}
                type="button"
                variant="outline"
                onClick={() => { setRating(r.value); setSubmitted(false); }}
                className={`flex flex-col h-auto py-3 gap-1 ${rating === r.value ? r.activeClass : ''}`}
              >
                <r.icon className="w-5 h-5" />
                <span className="text-sm">{r.label}</span>
              </Button>
            ))}
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
            <p className="text-xs text-muted-foreground mt-1.5">
              Confirms you live in the complex. Never published, and used only to keep one vote per resident.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {isSubmitting ? 'Submitting…' : submitted ? 'Update Vote' : 'Submit Vote'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
