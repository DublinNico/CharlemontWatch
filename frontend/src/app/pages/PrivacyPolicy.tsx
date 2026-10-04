import { Header } from '../components/Header';

// Static GDPR privacy policy page — data collected, usage, retention, and rights
export function PrivacyPolicy() {
  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-10 md:pt-16">
        <div className="max-w-[72ch]">
          <h1 className="text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.035em] font-bold mb-3">Privacy Policy</h1>
          <p className="text-sm text-subtle-foreground pb-8 mb-10 border-b border-border">Last updated: October 4, 2026</p>

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
              <li><strong className="text-foreground">Satisfaction votes:</strong> your email address and your rating (Low, Medium or High). Your email is used only to make sure each resident has one vote, and is never published.</li>
              <li><strong className="text-foreground">Vote comments:</strong> your email address, your comment, and optionally a name to show with it. Your email is never published.</li>
              <li><strong className="text-foreground">Formal complaint details:</strong> if you choose to send a formal complaint, your name and postal address, in addition to your email address.</li>
              <li><strong className="text-foreground">Contact form messages:</strong> your name, email address, and message.</li>
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
              <li>To count satisfaction votes and show the overall results publicly. Only the totals are shown, never who voted or how.</li>
              <li>To review comments before they appear. Once approved, your comment and the name you chose (or "A resident" if you left it blank) are shown publicly with the date. Your email address is never shown.</li>
              <li>To email you, when you post a comment, a private link you can use to delete it.</li>
              <li>If you request a formal complaint, to send your report, photos, name, address and email address to Túath Housing and/or Dublin City Council on your behalf. You are copied on that email, and replies from those organisations go directly to you. Your name, address and email are never shown on the public site.</li>
              <li>To read and reply to messages sent through the contact form.</li>
            </ul>
            <p className="text-muted-foreground">We do not sell your data or use it for advertising. To operate the service, we use the following third-party processors, each acting only on our instructions and only for the purpose stated:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Resend:</strong> sends all emails — report confirmations, status updates, and formal complaints to Túath Housing and/or Dublin City Council on your behalf.</li>
              <li><strong className="text-foreground">Amazon Web Services (S3):</strong> stores photos submitted with incident reports.</li>
              <li><strong className="text-foreground">MongoDB Atlas:</strong> hosts our database (incident reports, email addresses, and related data).</li>
              <li><strong className="text-foreground">Sentry:</strong> error monitoring, used only if enabled. We take care to avoid including personal data such as email addresses in error reports sent here.</li>
              <li><strong className="text-foreground">Cloudflare Turnstile:</strong> checks that report submissions come from a person rather than a bot. It processes your IP address and basic browser information for this purpose only.</li>
            </ul>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">4. Data retention</h2>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li><strong className="text-foreground">Incident reports:</strong> retained until an administrator deletes the report. We do not currently run an automatic time-based deletion, reports are kept as an ongoing public record and evidence base unless removed.</li>
              <li><strong className="text-foreground">Reporter email addresses:</strong> stored as part of the incident record; deleted along with it if the incident is deleted.</li>
              <li><strong className="text-foreground">Photos:</strong> stored in AWS S3 and deleted when the associated incident is deleted.</li>
              <li><strong className="text-foreground">Satisfaction votes:</strong> kept until the vote is withdrawn. To withdraw your vote, contact us using the email address you voted with.</li>
              <li><strong className="text-foreground">Vote comments:</strong> kept until deleted by you (using the link in your email) or by an administrator. Comments that aren't approved may be deleted.</li>
              <li><strong className="text-foreground">Formal complaint details (name and address):</strong> stored as part of the incident record and deleted along with it. Copies already sent to Túath Housing or Dublin City Council are held by those organisations under their own privacy policies.</li>
              <li><strong className="text-foreground">Contact form messages:</strong> not stored on our database. They are delivered by email to our administrator and kept in that mailbox only as long as needed to deal with your message.</li>
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
