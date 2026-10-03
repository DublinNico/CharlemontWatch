import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';

// Catch-all 404 page for any unmatched route
export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-14 md:pt-28 pb-10 grid md:grid-cols-[auto_1fr] gap-4 md:gap-14 md:items-center">
        <div
          aria-hidden="true"
          className="font-mono font-semibold text-[96px] md:text-[160px] leading-[0.85] tracking-[-0.06em] text-muted [-webkit-text-stroke:1px_var(--border)]"
        >
          404
        </div>
        <div>
          <h1 className="text-[32px] md:text-[44px] leading-[1.05] tracking-[-0.035em] font-bold">Page Not Found</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            The page you're looking for doesn't exist or may have moved.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <Button size="lg" onClick={() => navigate('/')}>Back to Home</Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/report')}>Report an Incident</Button>
          </div>
        </div>
      </main>
    </div>
  );
}
