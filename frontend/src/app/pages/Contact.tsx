import { useState, FormEvent } from 'react';
import axios from 'axios';
import { Send, CheckCircle2, Mail, ClipboardList, Siren } from 'lucide-react';
import { Link } from 'react-router';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// "Contact Us" page — a simple form for anything that doesn't fit an
// incident report (feedback, questions, press). Emails the admin directly
// with Reply-To set to the sender.
export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — must stay empty
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/contact`, { name, email, message, website });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <Header />

      <main className="page-container pt-10 md:pt-16 grid lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-[72px] items-start">
        <div>
          <h1 className="text-[36px] md:text-[52px] 2xl:text-[60px] leading-[1.04] tracking-[-0.035em] font-bold">Contact Us</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-[40ch]">
            Questions, feedback, or press enquiries? Send us a message and we'll get back to you.
          </p>
          <div className="mt-10 grid gap-[22px]">
            <div className="grid grid-cols-[44px_1fr] gap-3.5">
              <div className="size-11 rounded-md bg-muted grid place-items-center"><Mail className="size-5" /></div>
              <div><div className="text-[15px] font-semibold">Email</div><a href="mailto:contact@charlemontwatch.ie" className="text-[14.5px] text-muted-foreground hover:text-foreground">contact@charlemontwatch.ie</a></div>
            </div>
            <div className="grid grid-cols-[44px_1fr] gap-3.5">
              <div className="size-11 rounded-md bg-muted grid place-items-center"><ClipboardList className="size-5" /></div>
              <div><div className="text-[15px] font-semibold">Reporting an issue?</div><p className="text-[14.5px] text-muted-foreground">Use the <Link to="/report" className="text-primary font-semibold hover:underline">report form</Link> instead, so it gets a CW reference and can be tracked.</p></div>
            </div>
            <div className="grid grid-cols-[44px_1fr] gap-3.5">
              <div className="size-11 rounded-md bg-muted grid place-items-center text-destructive"><Siren className="size-5" /></div>
              <div><div className="text-[15px] font-semibold">Emergency</div><p className="text-[14.5px] text-muted-foreground">Call 999 or 112. Messages here aren't monitored in real time.</p></div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 md:p-9">
          {submitted ? (
            <div className="text-center py-10">
              <div className="size-14 rounded-full bg-status-done-bg text-status-done grid place-items-center mx-auto mb-4">
                <CheckCircle2 className="size-7" />
              </div>
              <h2 className="text-2xl mb-2">Message Sent</h2>
              <p className="text-muted-foreground">
                Thanks for reaching out. We'll reply to your email as soon as we can.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <Label htmlFor="contact-name" className="mb-2 block">Name</Label>
                  <Input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-email" className="mb-2 block">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="contact-message" className="mb-2 block">Message</Label>
                <Textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={7}
                  maxLength={5000}
                  placeholder="How can we help?"
                  className="min-h-[180px]"
                />
                <p className="mt-2 text-[13px] text-subtle-foreground">Up to 5,000 characters.</p>
              </div>

              {/* Honeypot: hidden off-screen from real users; bots that
                  autofill every field on the form will fill this one in,
                  which the backend uses to silently drop the submission. */}
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="contact-website">Website</label>
                <input
                  id="contact-website"
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-destructive font-medium" role="alert">{error}</p>}

              <Button type="submit" size="lg" disabled={isSubmitting} className="w-full !mt-7">
                <Send className="size-4" />
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
