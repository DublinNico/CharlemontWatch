import { useState, FormEvent } from 'react';
import axios from 'axios';
import { Send, CheckCircle2 } from 'lucide-react';
import { Header } from '../components/Header';

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
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 md:py-8">
        <div className="text-center mb-8">
          <h1 className="text-[#333333] mb-2">Contact Us</h1>
          <p className="text-[#666666]">
            Questions, feedback, or press enquiries, send us a message and we'll get back to you.
          </p>
        </div>

        <div className="bg-white rounded shadow-sm p-6">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-[#388e3c] mx-auto mb-3" />
              <h2 className="text-[#333333] mb-2">Message Sent</h2>
              <p className="text-sm text-[#666666]">
                Thanks for reaching out — we'll reply to your email as soon as we can.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="contact-name" className="block text-sm text-[#333333] mb-1">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-[#dddddd] rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm text-[#333333] mb-1">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border border-[#dddddd] rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm text-[#333333] mb-1">Message</label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  maxLength={5000}
                  className="w-full border border-[#dddddd] rounded px-3 py-2 text-sm resize-none"
                />
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

              {error && <p className="text-sm text-[#d32f2f]">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-[#1976d2] hover:bg-[#1565c0] disabled:opacity-50 text-white rounded transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
