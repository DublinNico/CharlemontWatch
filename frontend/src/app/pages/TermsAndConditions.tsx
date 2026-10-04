import { Header } from '../components/Header';

// Static Terms of Use page — acceptable use, complaint-forwarding disclaimer,
// content ownership, and liability limitation
export function TermsAndConditions() {
  return (
    <div className="bg-background">
      <Header />
      <main className="page-container pt-10 md:pt-16">
        <div className="max-w-[72ch]">
          <h1 className="text-[34px] md:text-[44px] leading-[1.05] tracking-[-0.035em] font-bold mb-3">Terms and Conditions</h1>
          <p className="text-sm text-subtle-foreground pb-8 mb-10 border-b border-border">Last updated: October 4, 2026</p>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">1. Who we are</h2>
            <p className="text-muted-foreground">
              CharlemontWatch is a community safety platform operated by residents of the Charlemont area of Dublin, Ireland.
              By using this site, you agree to these Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">2. What the service does</h2>
            <p className="text-muted-foreground">
              CharlemontWatch lets residents report local safety, maintenance, and quality-of-life incidents with photo evidence,
              track those reports, and optionally escalate a report as a formal complaint to Túath Housing and/or Dublin City Council.
              Reports are reviewed by a volunteer administrator before appearing on the public incident list.
              Residents can also vote on their satisfaction with Túath Housing and leave comments, which are reviewed by an
              administrator before appearing publicly.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">3. Acceptable use</h2>
            <p className="text-muted-foreground">When submitting a report, you agree that you will:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Only submit reports that are truthful and accurate to the best of your knowledge.</li>
              <li>Only upload photos you have the right to share, and that are directly relevant to the incident being reported.</li>
              <li>Not use the service to harass, defame, or make false accusations against any individual.</li>
              <li>Not submit false, misleading, or duplicate reports.</li>
              <li>Not attempt to interfere with, overload, or gain unauthorised access to the service or its data.</li>
            </ul>
            <p className="text-muted-foreground">
              We reserve the right to reject, edit for clarity, or remove any report that violates these terms, without notice.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">4. Comments</h2>
            <p className="text-muted-foreground">When leaving a comment, you agree that you will:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-2">
              <li>Stick to facts and your own experience.</li>
              <li>Not name, identify, or make allegations against any individual.</li>
              <li>Not post anything abusive, discriminatory, or unlawful, or anyone else's personal information.</li>
            </ul>
            <p className="text-muted-foreground">
              All comments are reviewed before they appear. We may decline or remove any comment at any time, without giving a
              reason. You can delete your own comment at any time using the link we email you.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">5. Formal complaints to Túath Housing / Dublin City Council</h2>
            <p className="text-muted-foreground">
              If you choose to send a formal complaint, CharlemontWatch forwards your report and contact details to Túath Housing
              and/or Dublin City Council on your behalf, once an administrator has approved the underlying report. CharlemontWatch is
              a reporting platform only — it is not a party to your complaint, does not represent you in any dealings with Túath
              Housing or Dublin City Council, and cannot guarantee that a complaint is received, actioned, or resolved by either
              organisation. Any correspondence, investigation, or outcome is between you and the recipient organisation directly.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">6. Your content</h2>
            <p className="text-muted-foreground">
              You retain ownership of any text and photos you submit. By submitting a report or comment, you grant CharlemontWatch a
              non-exclusive licence to display, store, and forward that content as necessary to operate the service described
              above — including showing approved reports on the public incident list and approved comments on the site and including your report and photos in a
              formal complaint email, if you request one.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">7. No warranty, limitation of liability</h2>
            <p className="text-muted-foreground">
              CharlemontWatch is provided by volunteers on a best-effort basis, "as is," with no guarantee of uptime, accuracy, or
              fitness for any particular purpose. We do not warrant that the service will be uninterrupted, error-free, or secure.
              To the fullest extent permitted by law, CharlemontWatch and its operators are not liable for any loss or damage
              arising from your use of the service, reliance on information published on it, or the actions (or inaction) of
              Túath Housing, Dublin City Council, or any other third party in response to a report or complaint.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">8. Changes to these terms</h2>
            <p className="text-muted-foreground">
              We may update these Terms from time to time. Continued use of the service after a change is posted means you accept
              the updated Terms. This page always reflects the current version.
            </p>
          </section>

          <section className="space-y-3.5 mb-10">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">9. Governing law</h2>
            <p className="text-muted-foreground">
              These Terms are governed by the laws of Ireland, and any dispute arising from them is subject to the exclusive
              jurisdiction of the Irish courts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-[21px] font-semibold tracking-[-0.02em]">10. Contact</h2>
            <p className="text-muted-foreground">
              For any questions about these Terms, email{' '}
              <a href="mailto:contact@charlemontwatch.ie" className="text-blue-600 underline">
                contact@charlemontwatch.ie
              </a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
