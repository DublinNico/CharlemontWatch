import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;

// Admin login page. Hidden from public navigation — only reachable via
// /cw-admin?key=<VITE_ADMIN_KEY>; any other visitor is redirected home.
// This is a UI/navigation gate only, not a security boundary: VITE_ADMIN_KEY
// is bundled into the client JS and visible to anyone who inspects it.
// Real authorization is enforced server-side by login + the adminOnly
// middleware, not by this check.
export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useApp();

  // Gate: bounce anyone without the correct ?key= query param
  useEffect(() => {
    if (!ADMIN_KEY || searchParams.get('key') !== ADMIN_KEY) {
      navigate('/', { replace: true });
    }
  }, []);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submits credentials and redirects to the dashboard on success
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const result = await login(formData.email, formData.password);
    setIsSubmitting(false);

    if (result) {
      navigate('/admin');
    } else {
      setError('Invalid credentials or insufficient permissions');
    }
  };

  return (
    <div className="bg-background grid place-items-center px-4 py-16 md:py-24">
      <div className="bg-card border border-border rounded-lg p-8 md:p-10 max-w-[420px] w-full">
        <div className="size-12 rounded-md bg-foreground text-background grid place-items-center">
          <Shield className="size-6" strokeWidth={2.25} />
        </div>
        <h1 className="mt-5 text-[30px] leading-tight tracking-[-0.03em] font-bold">Admin Login</h1>
        <p className="mt-1 mb-7 text-muted-foreground">Manage incident reports</p>

        {error && (
          <div className="bg-status-none-bg text-status-none font-medium rounded-md px-4 py-3 mb-5 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="admin-email" className="mb-2 block">Email</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="admin-password" className="mb-2 block">Password</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full !mt-7">
            {isSubmitting ? 'Please wait…' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
}
