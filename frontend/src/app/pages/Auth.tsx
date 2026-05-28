import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';

export function Auth() {
  const navigate = useNavigate();
  const { login } = useApp();
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
    <div className="min-h-screen bg-gradient-to-br from-[#1976d2] to-[#42a5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 text-[#1976d2] mx-auto mb-4" />
          <h1 className="text-[#333333] mb-2">Admin Login</h1>
          <p className="text-sm text-[#666666]">Manage incident reports</p>
        </div>

        {error && (
          <div className="bg-[#ffebee] border border-[#d32f2f] text-[#d32f2f] rounded px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#333333] mb-1">Email</label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-[#eeeeee] rounded focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm text-[#333333] mb-1">Password</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-[#eeeeee] rounded focus:outline-none focus:ring-2 focus:ring-[#1976d2]"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
