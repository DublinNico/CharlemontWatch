import { Shield, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';

export function Header() {
  const { isAuthenticated, logout, user } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="w-full bg-white border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:from-indigo-600 group-hover:to-purple-700 transition-all shadow-lg shadow-indigo-200/50">
              <Shield className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">CharlemontWatch</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Community Safety Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="gap-2 text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
