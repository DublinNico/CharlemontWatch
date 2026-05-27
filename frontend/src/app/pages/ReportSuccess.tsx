import { CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';

export function ReportSuccess() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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
