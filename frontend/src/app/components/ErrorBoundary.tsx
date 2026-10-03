import * as Sentry from '@sentry/react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Top-level crash guard: catches any render error in the component tree
// below it and shows a friendly fallback instead of a blank white screen,
// while reporting the error to Sentry.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  // React lifecycle hook: flips the boundary into its fallback UI state
  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // React lifecycle hook: fires after an error is caught, used here purely for reporting
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-3">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              The app couldn't load. Please check your connection and try again.
            </p>
            <button
              className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
