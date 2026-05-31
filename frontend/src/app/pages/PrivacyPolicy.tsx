import { Header } from '../components/Header';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded shadow-sm p-8">
          <h1 className="text-2xl font-bold text-[#333333] mb-2">Privacy Policy</h1>
          <p className="text-sm text-[#888888] mb-8">Last updated: May 2025</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-[#333333]">1. Who we are</h2>
            <p className="text-[#555555]">
              CharlemontWatch is a community safety platform operated by residents of the Charlemont area of Dublin, Ireland.
              It allows residents to report and track local incidents.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-[#333333]">2. What data we collect</h2>
            <ul className="list-disc pl-5 text-[#555555] space-y-2">
              <li><strong>Incident reports</strong> — location, type, description, and photos submitted by residents.</li>
              <li><strong>Reporter email address</strong> — optional, only collected if you choose to provide it so we can send you status updates.</li>
              <li><strong>IP address</strong> — logged automatically by our server for security and abuse prevention.</li>
            </ul>
            <p className="text-[#555555]">We do not use cookies, analytics scripts, or any third-party tracking.</p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-[#333333]">3. How we use your data</h2>
            <ul className="list-disc pl-5 text-[#555555] space-y-2">
              <li>To display incident reports on the public map for community awareness.</li>
              <li>To send you email updates on your report if you provided your email address.</li>
              <li>To allow community administrators to review and moderate reports.</li>
            </ul>
            <p className="text-[#555555]">We do not sell, share, or transfer your data to any third party except SendGrid (our email provider) solely for the purpose of sending transactional emails.</p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-[#333333]">4. Data retention</h2>
            <ul className="list-disc pl-5 text-[#555555] space-y-2">
              <li><strong>Incident reports</strong> — retained for 2 years from the date of submission, then permanently deleted.</li>
              <li><strong>Reporter email addresses</strong> — deleted along with their associated incident at the 2-year mark.</li>
              <li><strong>Photos</strong> — stored in AWS S3 and deleted when the associated incident is deleted.</li>
              <li><strong>Server logs</strong> — retained for 90 days for security purposes, then automatically purged.</li>
            </ul>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-[#333333]">5. Your rights (GDPR)</h2>
            <p className="text-[#555555]">Under GDPR you have the right to:</p>
            <ul className="list-disc pl-5 text-[#555555] space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to processing of your data.</li>
            </ul>
            <p className="text-[#555555]">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:reports@charlemontwatch.ie" className="text-[#1976d2] underline">
                reports@charlemontwatch.ie
              </a>.
              We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#333333]">6. Contact</h2>
            <p className="text-[#555555]">
              For any privacy-related questions, email{' '}
              <a href="mailto:reports@charlemontwatch.ie" className="text-[#1976d2] underline">
                reports@charlemontwatch.ie
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
