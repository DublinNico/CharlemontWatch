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
// Uses execution: 'execute' rather than the default auto-run — reports here
// can take residents several minutes to fill out (writing a description,
// taking/uploading several photos, often backgrounding the tab for the
// camera), and Turnstile tokens expire after ~5 minutes with unreliable
// auto-refresh on a backgrounded mobile tab. Generating the token on-demand
// right before submit, via execute(), avoids submitting a stale token.
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onVerify, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    // execute() can be called before render() has finished (script still
    // loading) — Cloudflare's execute() requires the widget to already be
    // rendered on the container, so a call that arrives too early is queued
    // here and flushed the moment render() completes, instead of silently
    // doing nothing.
    const pendingExecuteRef = useRef(false);
    const id = useId();
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current);
        }
      },
      execute: () => {
        if (widgetId.current && containerRef.current && window.turnstile) {
          window.turnstile.execute(containerRef.current);
        } else {
          pendingExecuteRef.current = true;
        }
      },
    }), []);

    useEffect(() => {
      if (!siteKey || !containerRef.current) return;

      let cancelled = false;
      loadTurnstileScript().then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          execution: 'execute',
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onError,
        });
        if (pendingExecuteRef.current) {
          pendingExecuteRef.current = false;
          window.turnstile.execute(containerRef.current);
        }
      }).catch(error => {
        console.error(error);
        onError?.();
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
