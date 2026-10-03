import { useState } from 'react';
import { Shield, FileText, Heart, Scale, Clock, Copy, Check, X, Send, UserX, CameraOff, Sun, Frame, Siren, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router';

// Copy-and-paste follow-up letters for residents whose complaint acknowledgement
// is overdue — kept as plain text (not JSX) so they paste cleanly into an email client.
const TUATH_FOLLOWUP_TEMPLATE = `[Your Name]
[Your Address]
[Your Date of Birth]
[Your Tenant/Account Number, if known]
[Date]

Túath Housing
[Complaints team email/address]

Re: Formal Complaint Follow Up, CharlemontWatch Tracking ID [CW-XXXXXX]

Dear Sir/Madam,

I am writing to follow up on a formal complaint I submitted on [date original complaint was sent] regarding [brief description of issue] at [address/location]. My date of birth and tenant/account number above are provided to help you verify my tenancy and locate my file.

Under Túath Housing's Complaints Policy and Procedure (Version 4.0, 2022), complaints are to be acknowledged within 5 working days of receipt. As of today, [number] working days have passed since my complaint was submitted, and I have not yet received an acknowledgement.

I would be grateful if you could:
1. Confirm receipt of my original complaint,
2. Provide a complaint reference number, and
3. Advise on the expected timeline for a full written response, which under the same policy should be provided within 30 working days of the original complaint.

For reference, this complaint was submitted via CharlemontWatch and can be tracked using ID [CW-XXXXXX].

I look forward to your response.

Yours sincerely,
[Your Name]
[Your Email]
[Your Phone Number, optional]`;

const DCC_FOLLOWUP_TEMPLATE = `[Your Name]
[Your Address]
[Date]

Dublin City Council
[Complaints team email/address]

Re: Formal Complaint Follow Up, CharlemontWatch Tracking ID [CW-XXXXXX]

Dear Sir/Madam,

I am writing to follow up on a formal complaint I submitted on [date original complaint was sent] regarding [brief description of issue] at [address/location].

Under Dublin City Council's Customer Complaints procedure, complaints are to be acknowledged within 3 working days of receipt. As of today, [number] working days have passed since my complaint was submitted, and I have not yet received an acknowledgement.

I would be grateful if you could:
1. Confirm receipt of my original complaint,
2. Provide a complaint reference number, and
3. Advise on the expected timeline for a full written response, which should be provided within 15 working days of the original complaint.

For reference, this complaint was submitted via CharlemontWatch and can be tracked using ID [CW-XXXXXX].

I look forward to your response.

Yours sincerely,
[Your Name]
[Your Email]
[Your Phone Number, optional]`;

// Static "About" page: mission, how it works, complaint vs. report-only
// explainer, photo guidelines, safety/privacy rules, and the donate button
export function About() {
  const navigate = useNavigate();
  const [copiedTemplate, setCopiedTemplate] = useState<'tuath' | 'dcc' | null>(null);

  // Copies the relevant follow-up letter template to the clipboard and flashes a checkmark
  const handleCopyTemplate = (org: 'tuath' | 'dcc') => {
    const text = org === 'tuath' ? TUATH_FOLLOWUP_TEMPLATE : DCC_FOLLOWUP_TEMPLATE;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedTemplate(org);
      setTimeout(() => setCopiedTemplate(null), 2000);
    }).catch(() => {
      // clipboard write failed — silently ignore (permission denied, insecure context)
    });
  };

  const sections = [
    { id: 'why', label: 'Why formal complaints' },
    { id: 'choose', label: 'Report or complaint' },
    { id: 'how', label: 'How it works' },
    { id: 'rules', label: 'Photos, safety and privacy' },
    { id: 'late', label: 'If a reply is late' },
    { id: 'rtb', label: 'Escalating to the RTB' },
    { id: 'support', label: 'Support the site' },
  ];

  const steps = [
    { title: 'Report an Issue', description: 'Residents document incidents with photos and detailed descriptions.' },
    { title: 'Escalate Formally', description: 'Optionally request a formal complaint to Túath Housing, Dublin City Council, or both. It is emailed on your behalf once an administrator approves your report.' },
    { title: 'Receive an ID', description: "Get a unique tracking ID to monitor your report's progress." },
    { title: 'Admin Reviews', description: 'Volunteer administrators review submissions and update status.' },
    { title: 'Track Resolution', description: 'Follow the incident from submission to resolution.' },
  ];

  const sectionClass = 'scroll-mt-24 py-12 md:py-14 border-t border-border first:border-t-0 first:pt-0';
  const h2Class = 'text-[26px] md:text-[30px] leading-[1.1] tracking-[-0.03em] font-bold max-w-[24ch]';
  const pClass = 'mt-3.5 text-[16.5px] text-muted-foreground max-w-[66ch]';

  return (
    <div className="bg-background">
      <Header />

      <main className="page-container">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-5 lg:gap-16 lg:items-end pt-10 md:pt-16 pb-10 md:pb-14 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-primary mb-3">About CharlemontWatch</p>
            <h1 className="text-[38px] md:text-[56px] 2xl:text-[64px] leading-[1.03] tracking-[-0.035em] font-bold">Community-led. Transparent. Accountable.</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            CharlemontWatch is a community-led incident reporting and tracking platform for residents of Charlemont Street, Dublin.
            We help residents document safety, maintenance, and quality-of-life issues, creating a transparent evidence base
            that holds Túath Housing and Dublin City Council accountable for maintaining our neighbourhood.
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)] gap-16 pt-12 md:pt-14">
          <nav className="hidden lg:grid sticky top-[100px] self-start gap-2.5 text-sm" aria-label="On this page">
            {sections.map(section => (
              <a key={section.id} href={`#${section.id}`} className="text-subtle-foreground hover:text-foreground transition-colors">
                {section.label}
              </a>
            ))}
          </nav>

          <div>
            <section id="why" className={sectionClass}>
              <h2 className={h2Class}>A report alone achieves nothing. A formal complaint has deadlines.</h2>
              <p className={pClass}>
                Túath Housing and Dublin City Council are not obliged to act on community posts or photos. A{' '}
                <strong className="text-foreground">formal complaint</strong> is different. Under Túath's own published Complaints Policy
                and Dublin City Council's own Customer Complaints Procedure, they are committed to acknowledging your complaint and
                providing a written response within set deadlines.
              </p>
              <div className="mt-7 grid md:grid-cols-2 gap-4">
                {[
                  { name: 'Túath Housing', remit: 'The housing association, responsible for building maintenance, repairs, and resident safety.', ack: 5, respond: 30 },
                  { name: 'Dublin City Council (DCC)', remit: 'The local authority overseeing public safety, street cleaning, and community services.', ack: 3, respond: 15 },
                ].map(org => (
                  <div key={org.name} className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-[17px] font-semibold">{org.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{org.remit}</p>
                    <div className="mt-4 flex gap-8">
                      <div><div className="font-mono text-[36px] leading-none font-semibold tracking-[-0.04em]">{org.ack}</div><div className="mt-1.5 text-[13px] text-subtle-foreground">days to acknowledge</div></div>
                      <div><div className="font-mono text-[36px] leading-none font-semibold tracking-[-0.04em]">{org.respond}</div><div className="mt-1.5 text-[13px] text-subtle-foreground">days to respond</div></div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] text-subtle-foreground">All figures are working days.</p>
              <p className={pClass}>
                CharlemontWatch combines both: your report builds a public evidence record, and the formal complaint forces an official
                response. Together, they create accountability that neither can achieve alone.
              </p>
            </section>

            <section id="choose" className={sectionClass}>
              <h2 className={h2Class}>Report only, or formal complaint?</h2>
              <div className="mt-7 grid md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2.5"><FileText className="size-5" />Report Only</h3>
                  <ul className="mt-3.5 grid gap-2.5 text-[15px] text-muted-foreground">
                    <li className="grid grid-cols-[22px_1fr] gap-2"><Check className="size-4 mt-1 text-status-done" />Just your email, so we can send you status updates</li>
                    <li className="grid grid-cols-[22px_1fr] gap-2"><Check className="size-4 mt-1 text-status-done" />Name and address are never required</li>
                    <li className="grid grid-cols-[22px_1fr] gap-2"><X className="size-4 mt-1 text-status-none" />Not forwarded to Túath Housing or Dublin City Council</li>
                  </ul>
                </div>
                <div className="bg-card border border-primary ring-1 ring-primary rounded-lg p-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2.5"><Send className="size-5 text-primary" />Formal Complaint</h3>
                  <ul className="mt-3.5 grid gap-2.5 text-[15px] text-muted-foreground">
                    <li className="grid grid-cols-[22px_1fr] gap-2"><Check className="size-4 mt-1 text-status-done" />Also includes your name and address</li>
                    <li className="grid grid-cols-[22px_1fr] gap-2"><Check className="size-4 mt-1 text-status-done" />Forwarded directly to Túath Housing and/or Dublin City Council</li>
                    <li className="grid grid-cols-[22px_1fr] gap-2"><Check className="size-4 mt-1 text-status-done" />Requires an official written response within 30 working days (Túath) or 15 working days (Dublin City Council)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="how" className={sectionClass}>
              <h2 className={h2Class}>How it works</h2>
              <ol className="mt-7 grid gap-4">
                {steps.map((step, index) => (
                  <li key={step.title} className="grid grid-cols-[36px_1fr] gap-4">
                    <span className="size-9 rounded-full bg-muted grid place-items-center font-mono text-sm font-semibold">{index + 1}</span>
                    <div>
                      <h3 className="text-[17px] font-semibold">{step.title}</h3>
                      <p className="mt-0.5 text-[15px] text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section id="rules" className={sectionClass}>
              <h2 className={h2Class}>Photos, safety and privacy</h2>
              <div className="mt-6 grid md:grid-cols-2 gap-x-8 gap-y-3.5 text-[15px] text-muted-foreground">
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><UserX className="size-5 text-status-none" /><span><strong className="text-foreground">Do NOT name individuals</strong> in reports or photos.</span></div>
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><CameraOff className="size-5 text-status-none" /><span><strong className="text-foreground">Do NOT photograph faces</strong> without consent.</span></div>
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><Sun className="size-5 text-primary" /><span>Take clear, well-lit photos showing the full extent of the issue.</span></div>
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><Frame className="size-5 text-primary" /><span>Include context shots of the location, and multiple angles if relevant.</span></div>
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><Clock className="size-5 text-primary" /><span>Capture date/time stamps if your device supports it.</span></div>
                <div className="grid grid-cols-[26px_1fr] gap-2.5"><Shield className="size-5 text-primary" /><span>Focus on documenting the issue, not identifying people.</span></div>
              </div>
              <div className="mt-6 flex gap-3.5 p-[18px] rounded-lg border border-border bg-card text-[15px] text-muted-foreground">
                <Siren className="size-[22px] text-destructive shrink-0" />
                <p>
                  <strong className="text-foreground">For a crime in progress, an emergency, or serious anti-social behaviour, contact An Garda Síochána directly.</strong>{' '}
                  Call 999 or 112. This platform isn't monitored in real time.
                </p>
              </div>
            </section>

            <section id="late" className={sectionClass}>
              <h2 className={h2Class}>If your acknowledgement is late</h2>
              <p className={pClass}>
                Túath should acknowledge a formal complaint within 5 working days, and Dublin City Council within 3 working days. A full
                written response is due within 30 working days (Túath) or 15 working days (Dublin City Council). If the acknowledgement
                window passes, a written follow-up is a useful next step.
              </p>
              <p className={pClass}>
                Send it in writing (not a phone call), reference your CharlemontWatch tracking ID and the date the complaint was sent,
                and ask for a complaint reference number if you weren't given one. A written follow-up also gives you a clear record if
                you later take the matter to the RTB or an Ombudsman.
              </p>
              <div className="mt-7 grid md:grid-cols-2 gap-4">
                {([
                  { key: 'tuath', label: 'Túath Housing follow-up letter', text: TUATH_FOLLOWUP_TEMPLATE },
                  { key: 'dcc', label: 'Dublin City Council follow-up letter', text: DCC_FOLLOWUP_TEMPLATE },
                ] as const).map(template => (
                  <div key={template.key} className="bg-card border border-border rounded-lg overflow-hidden min-w-0">
                    <div className="flex items-center justify-between gap-3 px-[18px] py-3 border-b border-border">
                      <span className="text-sm font-semibold">{template.label}</span>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-[13px]" onClick={() => handleCopyTemplate(template.key)}>
                        {copiedTemplate === template.key ? <Check className="size-3.5 text-status-done" /> : <Copy className="size-3.5" />}
                        {copiedTemplate === template.key ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <pre className="p-[18px] font-mono text-[12.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-[260px] overflow-y-auto">
                      {template.text}
                    </pre>
                  </div>
                ))}
              </div>
            </section>

            <section id="rtb" className={sectionClass}>
              <h2 className={h2Class}>Escalating a dispute with the RTB</h2>
              <p className={pClass}>
                Túath Housing is an Approved Housing Body, so your tenancy is covered by the same rules as a private rental and
                registered with the <strong className="text-foreground">Residential Tenancies Board (RTB)</strong>, the statutory body
                that resolves disputes between tenants and landlords.
              </p>
              <p className={pClass}>
                If you've sent a formal complaint through CharlemontWatch and Túath hasn't responded within the 30 working day window,
                or hasn't resolved the issue, you can open a dispute directly with the RTB. Mediation is free, adjudication costs €30,
                and a tribunal appeal costs €30 (after mediation) or €85 (after adjudication). None of the three require a solicitor.
              </p>
              <p className={pClass}>
                Keep a record of when you first raised the issue and any responses (or lack of one). Your CharlemontWatch tracking ID and
                report history are useful evidence. The RTB handles disputes with Túath as your landlord; issues that are purely Dublin
                City Council's responsibility (bins, street cleaning, public areas) aren't part of its remit.
              </p>
              <a
                href="https://rtb.ie/disputes/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <Scale className="size-4" />
                Start a dispute at rtb.ie/disputes
                <ArrowUpRight className="size-4" />
              </a>
            </section>

            <section id="support" className={sectionClass}>
              <div className="bg-card border border-border rounded-lg p-6 md:p-9 grid md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-[-0.03em]">Support CharlemontWatch</h2>
                  <p className="mt-2 text-muted-foreground max-w-[60ch]">
                    CharlemontWatch is run and paid for out of pocket. Hosting, storage, and email all cost money every month.
                    If this site has been useful to you, a small donation helps keep it running.
                  </p>
                </div>
                <Button size="lg" asChild>
                  <a href="https://ko-fi.com/charlemontwatch" target="_blank" rel="noopener noreferrer">
                    <Heart className="size-4" />
                    Donate via Ko-fi
                  </a>
                </Button>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate('/report')}>Report an Incident</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/incidents')}>View All Incidents</Button>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
