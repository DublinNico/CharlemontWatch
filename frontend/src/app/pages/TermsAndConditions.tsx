import { Header } from '../components/Header';

// Static Terms of Use page — acceptable use, complaint-forwarding disclaimer,
// content ownership, and liability limitation
export function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Terms and Conditions</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: July 21, 2026</p>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">1. Who we are</h2>
            <p className="text-gray-600">
              CharlemontWatch is a community safety platform operated by residents of the Charlemont area of Dublin, Ireland.
              By using this site, you agree to these Terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">2. What the service does</h2>
            <p className="text-gray-600">
              CharlemontWatch lets residents report local safety, maintenance, and quality-of-life incidents with photo evidence,
              track those reports, and optionally escalate a report as a formal complaint to Túath Housing and/or Dublin City Council.
              Reports are reviewed by a volunteer administrator before appearing on the public incident list.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">3. Acceptable use</h2>
            <p className="text-gray-600">When submitting a report, you agree that you will:</p>
            <ul className="list-disc pl-5 text-gray-600 space-y-2">
              <li>Only submit reports that are truthful and accurate to the best of your knowledge.</li>
              <li>Only upload photos you have the right to share, and that are directly relevant to the incident being reported.</li>
              <li>Not use the service to harass, defame, or make false accusations against any individual.</li>
              <li>Not submit false, misleading, or duplicate reports.</li>
              <li>Not attempt to interfere with, overload, or gain unauthorised access to the service or its data.</li>
            </ul>
            <p className="text-gray-600">
              We reserve the right to reject, edit for clarity, or remove any report that violates these terms, without notice.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">4. Formal complaints to Túath Housing / Dublin City Council</h2>
            <p className="text-gray-600">
              If you choose to send a formal complaint, CharlemontWatch forwards your report and contact details to Túath Housing
              and/or Dublin City Council on your behalf, once an administrator has approved the underlying report. CharlemontWatch is
              a reporting platform only — it is not a party to your complaint, does not represent you in any dealings with Túath
              Housing or Dublin City Council, and cannot guarantee that a complaint is received, actioned, or resolved by either
              organisation. Any correspondence, investigation, or outcome is between you and the recipient organisation directly.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">5. Your content</h2>
            <p className="text-gray-600">
              You retain ownership of any text and photos you submit. By submitting a report, you grant CharlemontWatch a
              non-exclusive licence to display, store, and forward that content as necessary to operate the service described
              above — including showing approved reports on the public incident list and including your report and photos in a
              formal complaint email, if you request one.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">6. No warranty, limitation of liability</h2>
            <p className="text-gray-600">
              CharlemontWatch is provided by volunteers on a best-effort basis, "as is," with no guarantee of uptime, accuracy, or
              fitness for any particular purpose. We do not warrant that the service will be uninterrupted, error-free, or secure.
              To the fullest extent permitted by law, CharlemontWatch and its operators are not liable for any loss or damage
              arising from your use of the service, reliance on information published on it, or the actions (or inaction) of
              Túath Housing, Dublin City Council, or any other third party in response to a report or complaint.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">7. Changes to these terms</h2>
            <p className="text-gray-600">
              We may update these Terms from time to time. Continued use of the service after a change is posted means you accept
              the updated Terms. This page always reflects the current version.
            </p>
          </section>

          <section className="space-y-4 mb-8">
            <h2 className="text-lg font-semibold text-gray-800">8. Governing law</h2>
            <p className="text-gray-600">
              These Terms are governed by the laws of Ireland, and any dispute arising from them is subject to the exclusive
              jurisdiction of the Irish courts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">9. Contact</h2>
            <p className="text-gray-600">
              For any questions about these Terms, email{' '}
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
