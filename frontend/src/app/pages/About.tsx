import { Shield, AlertTriangle, Camera, Users, FileText } from 'lucide-react';
import { Header } from '../components/Header';
import { useNavigate } from 'react-router';

export function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      
      <main className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-[#333333] mb-2">About CharlemontWatch</h1>
          <p className="text-[#666666]">Community-led. Transparent. Accountable.</p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded shadow-sm p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-12 h-12 text-[#1976d2] flex-shrink-0" />
            <div>
              <h2 className="text-[#333333] mb-3">Our Mission</h2>
              <p className="text-[#666666]">
                CharlemontWatch is a community-led incident reporting and tracking platform for residents 
                of Charlemont Street, Dublin. We empower residents to document safety, maintenance, and 
                quality-of-life issues, creating a transparent evidence base that holds Tuath Housing and 
                Dublin City Council accountable for maintaining our neighbourhood.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded shadow-sm p-6">
          <h2 className="text-[#333333] mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { number: 1, title: 'Report an Issue', description: 'Residents document incidents with photos and detailed descriptions' },
              { number: 2, title: 'Escalate Formally', description: 'Optionally send a formal complaint directly to Tuath Housing, Dublin City Council, or both — on your behalf, automatically' },
              { number: 3, title: 'Receive an ID', description: 'Get a unique tracking ID to monitor your report\'s progress' },
              { number: 4, title: 'Admin Reviews', description: 'Housing administrators review submissions and update status' },
              { number: 5, title: 'Track Resolution', description: 'Follow the incident from submission to resolution' },
            ].map(step => (
              <div key={step.number} className="flex gap-4">
                <div className="w-10 h-10 bg-[#1976d2] text-white rounded-full flex items-center justify-center flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="text-[#333333] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#666666]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who We Pressure */}
        <div className="bg-white rounded shadow-sm p-6">
          <h2 className="text-[#333333] mb-4">Who We Pressure</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#eeeeee] rounded p-4">
              <h3 className="text-[#1976d2] mb-2">Tuath Housing</h3>
              <p className="text-sm text-[#666666]">
                The housing association, responsible for building maintenance, repairs, and resident safety
              </p>
            </div>
            <div className="border border-[#eeeeee] rounded p-4">
              <h3 className="text-[#1976d2] mb-2">Dublin City Council</h3>
              <p className="text-sm text-[#666666]">
                The local government authority overseeing public safety, street cleaning, and community services
              </p>
            </div>
          </div>
        </div>

        {/* Why This Matters */}
        <div className="bg-white rounded shadow-sm p-6">
          <div className="flex items-start gap-4">
            <Users className="w-10 h-10 text-[#1976d2] flex-shrink-0" />
            <div>
              <h2 className="text-[#333333] mb-3">Why This Matters</h2>
              <p className="text-[#666666] mb-3">
                Reporting an issue on an app alone achieves nothing. Tuath Housing and Dublin City Council are not obliged to act on community posts or photos.
              </p>
              <p className="text-[#666666] mb-3">
                A <strong>formal complaint</strong> is different. Under Tuath's Complaints Policy and Dublin City Council's customer complaints process, they are legally required to acknowledge your complaint within days and provide a written response within 30 working days.
              </p>
              <p className="text-[#666666]">
                CharlemontWatch combines both — your report builds a public evidence record, and the formal complaint forces an official response. Together, they create accountability that neither can achieve alone.
              </p>
            </div>
          </div>
        </div>

        {/* Uploading Photos */}
        <div className="bg-white rounded shadow-sm p-6">
          <div className="flex items-start gap-4">
            <Camera className="w-10 h-10 text-[#1976d2] flex-shrink-0" />
            <div>
              <h2 className="text-[#333333] mb-3">Uploading Photos</h2>
              <ul className="space-y-2 text-sm text-[#666666]">
                <li className="flex gap-2">
                  <span className="text-[#1976d2]">•</span>
                  <span>Take clear, well-lit photos showing the full extent of the issue</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1976d2]">•</span>
                  <span>Include context shots showing location and surroundings</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1976d2]">•</span>
                  <span>Capture date/time stamps if your device supports it</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#1976d2]">•</span>
                  <span>Upload multiple angles if relevant to the incident</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Safety & Privacy */}
        <div className="bg-[#fff3e0] border-l-4 border-[#f57c00] rounded shadow-sm p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-10 h-10 text-[#f57c00] flex-shrink-0" />
            <div>
              <h2 className="text-[#f57c00] mb-3">Safety & Privacy Rules</h2>
              <ul className="space-y-2 text-sm text-[#666666]">
                <li className="flex gap-2">
                  <span className="text-[#f57c00]">•</span>
                  <span><strong>Do NOT name individuals</strong> in reports or photos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#f57c00]">•</span>
                  <span><strong>Do NOT photograph faces</strong> without consent</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#f57c00]">•</span>
                  <span>Focus on documenting the issue, not identifying people</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#f57c00]">•</span>
                  <span>Respect privacy while maintaining accountability</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Anonymous or Identified */}
        <div className="bg-white rounded shadow-sm p-6">
          <h2 className="text-[#333333] mb-4">Anonymous or Identified?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[#1976d2] mb-2">Anonymous Reporting</h3>
              <ul className="space-y-2 text-sm text-[#666666]">
                <li className="flex gap-2">
                  <span className="text-[#388e3c]">✓</span>
                  <span>No personal information required</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#388e3c]">✓</span>
                  <span>Complete privacy protection</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#d32f2f]">✗</span>
                  <span>Cannot receive status updates</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-[#1976d2] mb-2">With Email</h3>
              <ul className="space-y-2 text-sm text-[#666666]">
                <li className="flex gap-2">
                  <span className="text-[#388e3c]">✓</span>
                  <span>Receive status update notifications</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#388e3c]">✓</span>
                  <span>Track progress via email</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#666666]">•</span>
                  <span>Email only used for updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-white rounded shadow-sm p-8 text-center">
          <FileText className="w-12 h-12 text-[#1976d2] mx-auto mb-4" />
          <h2 className="text-[#333333] mb-6">Ready to make a difference?</h2>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/report')}
              className="px-6 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors"
            >
              Report an Incident
            </button>
            <button
              onClick={() => navigate('/incidents')}
              className="px-6 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors"
            >
              View All Incidents
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
