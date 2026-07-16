import { Shield, Search, List, Info, Lock, User, ArrowRight, Bell, MapPin, Users, FileText, Eye, CheckCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { SatisfactionWidget } from '../components/SatisfactionWidget';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// Landing page: hero, stats, how-it-works, incident types, main actions,
// satisfaction voting, and quick links
export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, incidents } = useApp();

  // Summary counts shown in the "Incident Types" section
  const stats = [
    {
      label: 'Total Reports',
      value: incidents.length,
      icon: Bell,
      color: 'text-indigo-600',
    },
    {
      label: 'Active Cases',
      value: incidents.filter(i => i.status !== 'RESOLVED').length,
      icon: MapPin,
      color: 'text-amber-600',
    },
    {
      label: 'Resolved',
      value: incidents.filter(i => i.status === 'RESOLVED').length,
      icon: Shield,
      color: 'text-emerald-600',
    },
  ];

  // The three primary call-to-action cards
  const actions = [
    {
      icon: Shield,
      title: 'Report an Incident',
      description: 'Submit a new safety or maintenance issue to help keep our community safe',
      onClick: () => navigate('/report'),
      variant: 'primary' as const,
      show: true,
    },
    {
      icon: Search,
      title: 'Track Your Report',
      description: 'Check the status of your submission and see real-time updates',
      onClick: () => navigate('/track'),
      variant: 'secondary' as const,
      show: true,
    },
    {
      icon: List,
      title: 'View All Incidents',
      description: 'Browse all community reports and stay informed about your neighbourhood',
      onClick: () => navigate('/incidents'),
      variant: 'secondary' as const,
      show: true,
    },
  ];

  // Footer-area links — Admin/Account entries only show once logged in
  const quickLinks = [
    {
      icon: Lock,
      title: 'Admin Dashboard',
      onClick: () => navigate('/admin'),
      show: isAuthenticated,
    },
    {
      icon: Info,
      title: 'About Us',
      onClick: () => navigate('/about'),
      show: true,
    },
    {
      icon: User,
      title: 'Account',
      onClick: () => navigate(`/cw-admin?key=${import.meta.env.VITE_ADMIN_KEY}`),
      show: isAuthenticated,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-0">
                <Users className="w-3 h-3 mr-1" />
                Community-Powered Safety
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Keep Charlemont Street{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Safe & Thriving
                </span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                CharlemontWatch builds a database of photo evidence and helps you send formal complaints to Túath Housing and Dublin City Council, forcing an official response.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate('/report')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 group"
                >
                  Report an Incident
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/incidents')}
                  className="border-2"
                >
                  View All Reports
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1656370465119-cb8d6735bda3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="Community gathering"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">Five simple steps to a safer community</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { number: 1, title: 'Report', description: 'Submit an incident with photos and details', icon: FileText },
            { number: 2, title: 'Escalate', description: 'Optionally send a formal complaint directly to Túath Housing or Dublin City Council', icon: Send },
            { number: 3, title: 'Track', description: 'Use your incident ID to monitor progress', icon: Eye },
            { number: 4, title: 'Review', description: 'Admin reviews and updates status', icon: Shield },
            { number: 5, title: 'Resolve', description: 'Issue is addressed and marked complete', icon: CheckCircle },
          ].map(step => (
            <Card key={step.number} className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.number}
                </div>
                <step.icon className="w-8 h-8 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Incident Types */}
      <section className="bg-gradient-to-br from-slate-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Incident Types</h2>
            <p className="text-lg text-muted-foreground">What can you report?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: 'Graffiti', description: 'Report vandalism and graffiti in public spaces', border: 'border-l-orange-500', bg: 'bg-orange-100', text: 'text-orange-700' },
              { type: 'Anti-Social Behaviour', description: 'Report disturbances, noise, and antisocial activity', border: 'border-l-red-500', bg: 'bg-red-100', text: 'text-red-700' },
              { type: 'Safety Hazard', description: 'Report dangerous conditions that risk injury', border: 'border-l-amber-500', bg: 'bg-amber-100', text: 'text-amber-700' },
              { type: 'Maintenance Issue', description: 'Report building and infrastructure maintenance needs', border: 'border-l-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-700' },
            ].map(item => (
              <Card key={item.type} className={`shadow-lg border-l-4 ${item.border}`}>
                <CardContent className="p-6">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${item.bg} ${item.text} mb-3`}>
                    {item.type}
                  </span>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {stats.map((stat, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br from-white to-gray-50 ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Main Actions */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What would you like to do?</h2>
          <p className="text-lg text-muted-foreground">Choose an action to get started</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {actions.filter(action => action.show).map((action, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-indigo-200"
              onClick={action.onClick}
            >
              <CardHeader>
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                  action.variant === 'primary'
                    ? 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                }`}>
                  <action.icon className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant={action.variant === 'primary' ? 'default' : 'outline'}
                  className={action.variant === 'primary' ? 'w-full bg-indigo-600 hover:bg-indigo-700' : 'w-full'}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Satisfaction Voting */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <SatisfactionWidget />
      </section>

      {/* Quick Links */}
      <section className="bg-gradient-to-br from-slate-50 to-indigo-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-4 justify-center">
            {quickLinks.filter(link => link.show).map((link, index) => (
              <Button
                key={index}
                variant="ghost"
                onClick={link.onClick}
                className="gap-2 text-slate-700 hover:text-indigo-600 hover:bg-white"
              >
                <link.icon className="w-4 h-4" />
                {link.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm text-muted-foreground border-t border-border bg-white">
        <button
          onClick={() => navigate('/privacy')}
          className="underline hover:text-indigo-600 transition-colors"
        >
          Privacy Policy
        </button>
        <span className="mx-2">·</span>
        © {new Date().getFullYear()} CharlemontWatch
      </footer>
    </div>
  );
}
