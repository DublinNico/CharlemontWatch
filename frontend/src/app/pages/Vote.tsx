import { Link } from 'react-router';
import { Header } from '../components/Header';
import { SatisfactionWidget } from '../components/SatisfactionWidget';

// Standalone page for the Túath satisfaction vote, so residents can share a
// short link (charlemontwatch.ie/vote) that lands straight on the card
export function Vote() {
  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-10 md:pt-16 pb-10">
        <p className="mb-6 text-[15px] text-muted-foreground max-w-[60ch]">
          A resident-run vote for Charlemont Street.{' '}
          <Link to="/" className="text-primary font-semibold hover:underline">Learn about CharlemontWatch</Link>
        </p>
        <SatisfactionWidget />
      </main>
    </div>
  );
}
