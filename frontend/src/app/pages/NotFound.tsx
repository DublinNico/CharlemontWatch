import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';

// Catch-all 404 page for any unmatched route
export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      <main className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="bg-background rounded shadow-lg p-8 max-w-lg w-full text-center">
          <Compass className="w-20 h-20 text-primary mx-auto mb-4" />
          <h1 className="text-foreground mb-3">404 — Page Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The page you're looking for doesn't exist or may have moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/report')}
              className="flex-1 px-4 py-2 border border-primary text-primary hover:bg-primary/10 rounded transition-colors"
            >
              Report an Incident
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
