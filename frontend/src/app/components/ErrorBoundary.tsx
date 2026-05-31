import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-sm p-8 max-w-md w-full text-center">
            <h2 className="text-[#333333] text-xl font-semibold mb-3">Something went wrong</h2>
            <p className="text-[#666666] mb-6">
              The app couldn't load. Please check your connection and try again.
            </p>
            <button
              className="px-6 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors"
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
