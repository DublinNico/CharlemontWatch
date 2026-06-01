import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { useApp } from '../context/AppContext';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;

export function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useApp();

  useEffect(() => {
    if (!ADMIN_KEY || searchParams.get('key') !== ADMIN_KEY) {
      navigate('/', { replace: true });
    }
  }, []);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-sky-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-gray-800 mb-2">Admin Login</h1>
          <p className="text-sm text-gray-500">Manage incident reports</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-600 text-red-600 rounded px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-800 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-800 mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-indigo-600"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
