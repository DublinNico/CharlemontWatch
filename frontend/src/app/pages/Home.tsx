import { useState } from 'react';
import {
  ArrowRight, MapPin, Send, AlertTriangle, Wrench, CheckCircle, Camera, Search,
  ClipboardList, Check, SprayCan, Megaphone, TriangleAlert, Hammer, Siren,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Header } from '../components/Header';
import { SatisfactionWidget } from '../components/SatisfactionWidget';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const STEPS = [
  { title: 'Report', description: 'Describe the issue and add up to 10 photos.', icon: Camera },
  { title: 'Escalate', description: 'Optionally send a formal complaint to Túath or the Council.', icon: Send },
  { title: 'Track', description: 'Follow progress with your CW reference. No account needed.', icon: Search },
  { title: 'Review', description: 'A volunteer admin checks the report and updates its status.', icon: ClipboardList },
  { title: 'Resolve', description: 'Once fixed, the report is marked resolved for everyone to see.', icon: Check },
];

const MAINTENANCE_EXAMPLES = ['Leaks', 'Damp and mould', 'Heating', 'Lifts', 'Broken doors and locks', 'Bin rooms'];

const RECIPIENTS = [
  { initials: 'TH', name: 'Túath Housing', remit: 'Building management and repairs' },
  { initials: 'DCC', name: 'Dublin City Council', remit: 'Public realm, lighting and cleansing' },
];

// Landing page: hero with quick tracking, live status counts, how it works,
// incident types, the formal-complaint pitch, and satisfaction voting
export function Home() {
  const navigate = useNavigate();
  const { incidents } = useApp();
  const [trackId, setTrackId] = useState('');

  // Per-status counts for the ledger strip, mirroring the All Incidents page
  const stats = [
    { label: 'Awaiting response', value: incidents.filter(i => i.status === 'AWAITING_RESPONSE').length, icon: Send, color: 'text-status-await' },
    { label: 'No response', value: incidents.filter(i => i.status === 'NO_RESPONSE').length, icon: AlertTriangle, color: 'text-status-none' },
    { label: 'In progress', value: incidents.filter(i => i.status === 'IN_PROGRESS').length, icon: Wrench, color: 'text-status-progress' },
    { label: 'Resolved', value: incidents.filter(i => i.status === 'RESOLVED').length, icon: CheckCircle, color: 'text-status-done' },
  ];

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackId.trim();
    navigate(id ? `/track?id=${encodeURIComponent(id)}` : '/track');
  };

  return (
    <div className="bg-background">
      <Header />

      {/* Hero */}
      <section className="py-10 md:py-16">
        <div className="page-container grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground mb-5">
              <MapPin className="size-4 text-primary" />
              Charlemont Street, Dublin 2
            </div>
            <h1 className="text-[40px] md:text-[56px] lg:text-[64px] 2xl:text-[76px] leading-[1.02] tracking-[-0.035em] font-bold max-w-[12ch]">
              Keep Charlemont Street <span className="text-primary">safe and thriving.</span>
            </h1>
            <p className="mt-6 text-lg md:text-[19px] 2xl:text-[21px] text-muted-foreground leading-normal max-w-[44ch]">
              Log problems with photo evidence, then send formal complaints to Túath Housing and Dublin City Council.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <Button size="lg" onClick={() => navigate('/report')} className="group">
                Report an Incident
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/incidents')}>
                View All Reports
              </Button>
            </div>
          </div>

          <div className="relative animate-rise [animation-delay:160ms]">
            <img
              src="/images/charlemont-street-dusk.jpg"
              alt="Charlemont Street at dusk"
              width={760}
              height={1021}
              className="w-full aspect-[4/3] lg:aspect-[5/5.2] object-cover object-[center_40%] rounded-lg"
            />
            <form
              onSubmit={handleTrack}
              className="relative lg:absolute mx-3 -mt-12 lg:m-0 lg:-left-10 lg:bottom-8 lg:w-[320px] bg-card border border-border rounded-lg p-[18px] shadow-[0_1px_2px_rgb(22_24_26/.04),0_12px_32px_-12px_rgb(22_24_26/.14)]"
            >
              <label htmlFor="hero-track-id" className="block text-[13px] font-semibold mb-2">Already reported something?</label>
              <div className="flex gap-2">
                <Input
                  id="hero-track-id"
                  value={trackId}
                  onChange={e => setTrackId(e.target.value)}
                  placeholder="CW-XXXXXX"
                  aria-describedby="hero-track-help"
                  className="h-10 rounded-md font-mono text-sm"
                />
                <Button type="submit" variant="outline" size="sm" className="h-10">Track</Button>
              </div>
              <p id="hero-track-help" className="mt-2 text-xs text-subtle-foreground">Use the reference from your confirmation email.</p>
            </form>
          </div>
        </div>
      </section>

      {/* Status ledger */}
      <section className="bg-card border-y border-border">
        <div className="page-container grid grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="col-span-2 lg:col-span-1 py-6 lg:py-7 lg:pr-6">
            <h2 className="text-xl font-semibold tracking-[-0.02em]">Where reports stand</h2>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-[30ch]">Every report is public, so nothing quietly disappears.</p>
            <Link to="/incidents" className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary">
              Browse all {incidents.length} <ArrowRight className="size-4" />
            </Link>
          </div>
          {stats.map(stat => (
            <div key={stat.label} className="py-5 lg:py-7 lg:px-6 border-t lg:border-t-0 lg:border-l border-border">
              <div className={`font-mono text-4xl lg:text-[40px] leading-none font-semibold tracking-[-0.04em] ${stat.color}`}>{stat.value}</div>
              <div className="mt-2.5 text-sm text-muted-foreground flex items-center gap-2">
                <stat.icon className={`size-4 ${stat.color}`} />
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-28">
        <div className="page-container">
          <h2 className="text-[30px] md:text-[42px] 2xl:text-[50px] leading-[1.08] tracking-[-0.03em] font-bold max-w-[20ch]">
            From photo to formal complaint in five steps.
          </h2>
          <ol className="mt-12 md:mt-16 grid md:grid-cols-5 gap-7 md:gap-0 relative before:absolute before:bg-border before:left-[22px] before:top-[22px] before:bottom-[22px] before:w-px md:before:bottom-auto md:before:right-[22px] md:before:w-auto md:before:h-px">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative grid grid-cols-[44px_1fr] md:block gap-x-[18px] md:pr-7">
                <div className={`size-11 rounded-full grid place-items-center relative border ${index === 0 ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border'}`}>
                  <step.icon className="size-5" />
                </div>
                <div>
                  <h3 className="mt-2.5 md:mt-[22px] text-lg font-semibold">{step.title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted-foreground md:max-w-[24ch]">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Incident types */}
      <section className="py-16 md:py-28 bg-card border-y border-border">
        <div className="page-container">
          <h2 className="text-[30px] md:text-[42px] 2xl:text-[50px] leading-[1.08] tracking-[-0.03em] font-bold">What you can report</h2>
          <div className="mt-10 md:mt-14 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr] lg:grid-rows-[240px_240px]">
            <Link
              to="/report"
              className="group relative overflow-hidden rounded-lg min-h-[320px] lg:min-h-0 lg:row-span-2 p-7 flex flex-col justify-end text-[#f3f4f2]"
            >
              <img
                src="/images/ffrench-mullen-house.jpg"
                alt="Ffrench Mullen House, a red-brick apartment building on Charlemont Street"
                loading="lazy"
                className="absolute inset-0 size-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgb(14_16_18/.82)] to-transparent to-60%" />
              <SprayCan className="absolute top-6 left-7 size-7" />
              <h3 className="relative text-[22px] font-semibold tracking-[-0.02em]">Graffiti</h3>
              <p className="relative mt-1.5 text-[15px] text-[#f3f4f2]/85 max-w-[32ch]">Tags and vandalism on walls, doors and shared spaces.</p>
            </Link>

            <Link to="/report" className="relative rounded-lg min-h-[200px] p-7 flex flex-col justify-end bg-primary text-primary-foreground hover:brightness-110 transition">
              <Megaphone className="absolute top-6 left-7 size-7" />
              <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Anti-social behaviour</h3>
              <p className="mt-1.5 text-[15px] opacity-85 max-w-[32ch]">Disturbances, noise and intimidation around the street.</p>
            </Link>

            <Link to="/report" className="relative rounded-lg min-h-[200px] p-7 flex flex-col justify-end bg-background border border-border hover:border-subtle-foreground transition-colors">
              <TriangleAlert className="absolute top-6 left-7 size-7 text-status-progress" />
              <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Safety hazard</h3>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-[32ch]">Broken lighting, loose railings, anything that could injure someone.</p>
            </Link>

            <Link
              to="/report"
              className="relative rounded-lg min-h-[200px] p-7 pt-[72px] lg:pt-7 grid lg:grid-cols-2 gap-5 lg:gap-8 items-end bg-muted lg:col-span-2 hover:brightness-[.98] transition"
            >
              <Hammer className="absolute top-6 left-7 size-7 text-primary" />
              <div>
                <h3 className="text-[22px] font-semibold tracking-[-0.02em]">Maintenance issue</h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground">Building and infrastructure problems that need fixing.</p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end lg:content-end">
                {MAINTENANCE_EXAMPLES.map(item => (
                  <span key={item} className="h-8 px-3.5 rounded-md bg-card border border-border text-[13.5px] font-medium inline-flex items-center">
                    {item}
                  </span>
                ))}
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Formal complaints */}
      <section className="py-16 md:py-28">
        <div className="page-container grid lg:grid-cols-2 gap-10 lg:gap-[72px] items-start">
          <div>
            <h2 className="text-[30px] md:text-[42px] 2xl:text-[50px] leading-[1.08] tracking-[-0.03em] font-bold max-w-[20ch]">
              A report gets noticed. A formal complaint gets answered.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-[56ch]">
              When logging an issue isn't enough, CharlemontWatch emails a formatted complaint on your behalf, with your photos attached.
            </p>
            <Button size="lg" className="mt-8 group" onClick={() => navigate('/report')}>
              Report an Incident
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
          <div className="grid gap-4">
            {RECIPIENTS.map(r => (
              <div key={r.name} className="bg-card border border-border rounded-lg p-5 md:p-[22px] grid grid-cols-[44px_1fr] md:grid-cols-[52px_1fr] gap-x-[18px] items-center">
                <div className="size-11 md:size-[52px] rounded-md bg-muted grid place-items-center font-bold text-sm md:text-[17px]">{r.initials}</div>
                <div>
                  <h3 className="text-[17px] font-semibold">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.remit}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-3.5 p-[18px] rounded-lg border border-border bg-card text-[14.5px] text-muted-foreground">
              <Siren className="size-[22px] text-destructive shrink-0" />
              <p>
                <strong className="text-foreground">In an emergency, call 999 or 112.</strong> This site isn't monitored in real time.
                Report serious anti-social behaviour directly to An Garda Síochána.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Satisfaction Voting */}
      <section className="page-container">
        <SatisfactionWidget />
      </section>
    </div>
  );
}
