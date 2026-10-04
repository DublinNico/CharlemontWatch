import { useEffect, useState } from 'react';
import { Share2, Link2, Check } from 'lucide-react';
import { Button } from './ui/button';

// Always share the public site, never the current origin: a localhost or
// preview-deploy link can't be fetched by Facebook, so its post comes up empty
const SITE_URL = import.meta.env.VITE_SITE_URL ?? 'https://charlemontwatch.ie';
const url = `${SITE_URL}/vote`;

// WhatsApp and Facebook marks aren't in lucide, so they're inlined here
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.7 5.79.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.3l5.72-1.5a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.23 2.68.23v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.27h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

// Share controls for the Túath satisfaction vote. Touch devices with the Web
// Share API get one button that opens the phone's share sheet; everything
// else gets WhatsApp, Facebook and Copy link buttons.
export function ShareVote({ total, hideLabel = false }: { total: number; hideLabel?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [useNativeShare, setUseNativeShare] = useState(false);

  useEffect(() => {
    setUseNativeShare(
      typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches,
    );
  }, []);

  const countLine = total > 0 ? ` ${total} vote${total === 1 ? '' : 's'} so far.` : '';
  const text = `Are you happy with Túath Housing? Charlemont Street residents are voting.${countLine} Have your say:`;

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: 'Are you happy with Túath Housing?', text, url });
    } catch {
      // User closed the share sheet — nothing to do
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyFailed(true);
    }
  };

  if (useNativeShare) {
    return (
      <Button type="button" variant="outline" onClick={handleNativeShare} className="w-full sm:w-auto">
        <Share2 className="size-4" />
        Share this vote
      </Button>
    );
  }

  return (
    <div>
      {!hideLabel && <div className="text-sm font-semibold mb-2.5">Share this vote</div>}
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" size="sm" asChild>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon />
            WhatsApp
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">
            <FacebookIcon />
            Facebook
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="size-4 text-status-done" /> : <Link2 className="size-4" />}
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
      </div>
      <p className="sr-only" aria-live="polite">{copied ? 'Link copied to clipboard' : ''}</p>
      {copyFailed && (
        <p className="text-[13px] text-destructive mt-2">Couldn't copy automatically. The link is {url}</p>
      )}
    </div>
  );
}
