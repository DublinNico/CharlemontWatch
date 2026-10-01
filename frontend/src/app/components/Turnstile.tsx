import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
      execute: (container: HTMLElement, options?: Record<string, unknown>) => void;
    };
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let scriptLoadingPromise: Promise<void> | null = null;
const loadTurnstileScript = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        // Clear the cached promise so a later remount can retry the load
        // instead of replaying the same rejection forever.
        scriptLoadingPromise = null;
        reject(new Error('Failed to load Turnstile script'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoadingPromise;
};

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

export interface TurnstileWidgetHandle {
  reset: () => void;
  execute: () => void;
}

// Renders a Cloudflare Turnstile challenge and reports the verification token
// back to the parent form. Renders nothing if VITE_TURNSTILE_SITE_KEY isn't
// set, so the CAPTCHA step is opt-in until that's configured.
//
// The widget runs as soon as the form loads so residents can see (and, if
// Cloudflare asks, complete) the challenge before they press submit. Reports
// can take several minutes to fill out and tokens expire after ~5 minutes,
// so execute() hands back the current token only while it's still fresh;
// otherwise it resets the widget to run a new challenge and waits for that.
const TOKEN_MAX_AGE_MS = 4 * 60 * 1000;

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const tokenRef = useRef<{ value: string; issuedAt: number } | null>(null);
    // Set while the parent is waiting on execute() — callbacks only reach the
    // parent then, so an expiry while the resident is still typing doesn't
    // surface as a form error.
    const waitingRef = useRef(false);
    const id = useId();
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    // Keep the latest parent callbacks without re-rendering the widget
    const callbacks = useRef({ onVerify, onExpire, onError });
    callbacks.current = { onVerify, onExpire, onError };

    const resetWidget = () => {
      tokenRef.current = null;
      if (widgetId.current && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    };

    useImperativeHandle(ref, () => ({
      reset: resetWidget,
      execute: () => {
        const token = tokenRef.current;
        if (token && Date.now() - token.issuedAt < TOKEN_MAX_AGE_MS) {
          // Tokens are single-use, so don't hand the same one out twice
          tokenRef.current = null;
          callbacks.current.onVerify(token.value);
          return;
        }
        waitingRef.current = true;
        // No fresh token: run a new challenge (or, if the widget is still
        // loading, its first challenge) and pass the result straight through
        if (widgetId.current) resetWidget();
      },
    }), []);

    useEffect(() => {
      if (!siteKey || !containerRef.current) return;

      let cancelled = false;
      loadTurnstileScript().then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (value: string) => {
            if (waitingRef.current) {
              waitingRef.current = false;
              callbacks.current.onVerify(value);
            } else {
              tokenRef.current = { value, issuedAt: Date.now() };
            }
          },
          'expired-callback': () => {
            tokenRef.current = null;
            if (waitingRef.current) {
              waitingRef.current = false;
              callbacks.current.onExpire?.();
            }
          },
          'error-callback': () => {
            tokenRef.current = null;
            waitingRef.current = false;
            callbacks.current.onError?.();
          },
        });
      }).catch(error => {
        console.error(error);
        callbacks.current.onError?.();
      });

      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current);
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!siteKey) return null;

    return <div ref={containerRef} id={`turnstile-${id}`} className="my-2" />;
  }
);
