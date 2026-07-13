import { Compass } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="bg-white rounded shadow-lg p-8 max-w-lg w-full text-center">
          <Compass className="w-20 h-20 text-[#1976d2] mx-auto mb-4" />
          <h1 className="text-[#333333] mb-3">404 — Page Not Found</h1>
          <p className="text-[#666666] mb-6">
            The page you're looking for doesn't exist or may have moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => navigate('/report')}
              className="flex-1 px-4 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors"
            >
              Report an Incident
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
