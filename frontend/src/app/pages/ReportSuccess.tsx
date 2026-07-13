import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router';

export function ReportSuccess() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const sentComplaint = searchParams.get('complaint') === 'true';

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="bg-white rounded shadow-lg p-8 max-w-lg w-full text-center">
        <CheckCircle className="w-20 h-20 text-[#388e3c] mx-auto mb-4" />
        <h1 className="text-[#388e3c] mb-3">Report Received</h1>
        <p className="text-[#666666] mb-6">
          Your report has been submitted. Save the ID below to track progress.
        </p>

        <div className="border-2 border-dashed border-[#1976d2] bg-[#e3f2fd] rounded p-4 mb-2">
          <div className="text-2xl tracking-widest font-mono text-[#1976d2]">
            {id}
          </div>
        </div>

        <p className="text-xs text-[#666666] mb-6">
          Use this ID on the Track page to check for updates
        </p>

        {!sentComplaint && (
          <div className="bg-amber-50 border border-amber-300 rounded p-4 mb-6 text-left flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-900 mb-1">No formal complaint was sent</p>
              <p className="text-xs text-amber-800">
                Without a formal complaint, Túath Housing and Dublin City Council are not required to act.
                Go back and escalate to make sure your report gets an official response.
              </p>
              <button
                onClick={() => navigate('/report')}
                className="mt-2 text-xs font-semibold text-amber-900 underline hover:no-underline"
              >
                Go back and send a complaint →
              </button>
            </div>
          </div>
        )}

        {sentComplaint && (
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6 text-left flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              A formal complaint has been sent on your behalf. You will be contacted directly with an official response.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/track?id=${id}`)}
            className="flex-1 px-4 py-2 bg-[#1976d2] hover:bg-[#1565c0] text-white rounded transition-colors"
          >
            Track This Report
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 border border-[#1976d2] text-[#1976d2] hover:bg-[#e3f2fd] rounded transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
