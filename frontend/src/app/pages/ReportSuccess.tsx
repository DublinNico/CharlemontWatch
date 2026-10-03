import { useState } from 'react';
import { Check, AlertTriangle, Send, Copy, ArrowRight } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';

// Post-submission confirmation page — shows the incident's tracking ID and,
// if no complaint was sent, nudges the resident to go back and escalate
export function ReportSuccess() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sentComplaint = searchParams.get('complaint') === 'true';
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // Copies the ID; if the clipboard API is missing (insecure context, old
  // browser) or the write is refused, tell the resident to copy it by hand
  const handleCopy = () => {
    if (!id) return;
    setCopyFailed(false);
    if (!navigator.clipboard?.writeText) {
      setCopyFailed(true);
      return;
    }
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      setCopyFailed(true);
    });
  };

  return (
    <div className="bg-background">
      <Header />
      <main className="px-4 py-10 md:py-20">
        <div className="bg-card border border-border rounded-lg p-6 md:p-12 max-w-[640px] mx-auto">
          <div className="size-14 rounded-full bg-status-done-bg text-status-done grid place-items-center">
            <Check className="size-7" strokeWidth={2.5} />
          </div>
          <h1 className="mt-6 text-[34px] md:text-[40px] leading-[1.05] tracking-[-0.035em] font-bold">Report Received</h1>
          <p className="mt-2.5 text-[17px] text-muted-foreground">
            Your report has been submitted. Save the ID below to track progress.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg bg-background border border-dashed border-border">
            <div>
              <div className="font-mono text-[26px] md:text-[32px] leading-none font-semibold tracking-[0.02em]">{id}</div>
              <p className="mt-2 text-[13px] text-subtle-foreground">Use this ID on the Track page to check for updates</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 self-start sm:self-auto">
              {copied ? <Check className="size-4 text-status-done" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy ID'}
            </Button>
          </div>
          {copyFailed && (
            <p className="mt-2 text-sm font-medium text-destructive" role="alert">
              Couldn't copy automatically. Please select the ID above and copy it manually.
            </p>
          )}

          {!sentComplaint && (
            <div className="mt-5 flex gap-3.5 p-5 rounded-lg bg-status-progress-bg">
              <AlertTriangle className="size-5 text-status-progress shrink-0 mt-px" />
              <div>
                <p className="text-[15px] font-semibold">No formal complaint was sent</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Without a formal complaint, Túath Housing and Dublin City Council are not required to act.
                  Go back and escalate to make sure your report gets an official response.
                </p>
                <button
                  onClick={() => navigate('/report')}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Go back and send a complaint <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {sentComplaint && (
            <div className="mt-5 flex gap-3.5 p-5 rounded-lg bg-status-done-bg">
              <Send className="size-5 text-status-done shrink-0 mt-px" />
              <p className="text-[15px]">
                Your formal complaint is queued and will be sent to Túath Housing and/or Dublin City Council as soon as an admin reviews and approves your report.
              </p>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => navigate(`/track?id=${id}`)}>
              Track This Report
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
