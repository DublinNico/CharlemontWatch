import { Header } from '../components/Header';

// Static GDPR privacy policy page — data collected, usage, retention, and rights
export function PrivacyPolicy() {
  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-10 md:pt-16">
        <div className="max-w-[72ch]">
          <h1 className="text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.035em] font-bold mb-3">Privacy Policy</h1>
          <p className="text-sm text-subtle-foreground pb-8 mb-10 border-b border-border">Last updated: July 19, 2026</p>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">1. Who we are</h2>
            <p className="text-muted-foreground">
              CharlemontWatch is a community safety platform operated by residents of the Charlemont area of Dublin, Ireland.
              It allows residents to report and track local incidents.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">2. What data we collect</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Incident reports:</strong> location, type, description, and photos submitted by residents.</li>
              <li><strong className="text-foreground">Reporter email address:</strong> required for every incident report, used to send you status updates.</li>
              <li><strong className="text-foreground">IP address:</strong> logged automatically by our server for security and abuse prevention.</li>
            </ul>
            <p className="text-muted-foreground">We do not use cookies, analytics scripts, or any third-party tracking.</p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">3. How we use your data</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>To display incident reports on the public map for community awareness.</li>
              <li>To send you email updates on your report.</li>
              <li>To allow community administrators to review and moderate reports.</li>
            </ul>
            <p className="text-muted-foreground">We do not sell your data or use it for advertising. To operate the service, we use the following third-party processors, each acting only on our instructions and only for the purpose stated:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Resend:</strong> sends all emails — report confirmations, status updates, and formal complaints to Túath Housing and/or Dublin City Council on your behalf.</li>
              <li><strong className="text-foreground">Amazon Web Services (S3):</strong> stores photos submitted with incident reports.</li>
              <li><strong className="text-foreground">MongoDB Atlas:</strong> hosts our database (incident reports, email addresses, and related data).</li>
              <li><strong className="text-foreground">Sentry:</strong> error monitoring, used only if enabled. We take care to avoid including personal data such as email addresses in error reports sent here.</li>
            </ul>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">4. Data retention</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Incident reports:</strong> retained until an administrator deletes the report. We do not currently run an automatic time-based deletion, reports are kept as an ongoing public record and evidence base unless removed.</li>
              <li><strong className="text-foreground">Reporter email addresses:</strong> stored as part of the incident record; deleted along with it if the incident is deleted.</li>
              <li><strong className="text-foreground">Photos:</strong> stored in AWS S3 and deleted when the associated incident is deleted.</li>
              <li><strong className="text-foreground">Server logs:</strong> retained according to our hosting provider's (Render) standard log retention period for our plan, not independently extended or purged by us.</li>
            </ul>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">5. Your rights (GDPR)</h2>
            <p className="text-muted-foreground">Under GDPR you have the right to:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to processing of your data.</li>
            </ul>
            <p className="text-muted-foreground">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:reports@charlemontwatch.ie" className="text-blue-600 underline">
                reports@charlemontwatch.ie
              </a>.
              We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">6. Contact</h2>
            <p className="text-muted-foreground">
              For any privacy-related questions, email{' '}
              <a href="mailto:reports@charlemontwatch.ie" className="text-blue-600 underline">
                reports@charlemontwatch.ie
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
