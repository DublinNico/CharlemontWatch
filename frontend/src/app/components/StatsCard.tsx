import { useApp } from '../context/AppContext';

// Compact row of total/new/in-progress/resolved counts, shown at the top of
// the Track Report page
export function StatsCard() {
  const { incidents } = useApp();

  const stats = {
    total: incidents.length,
    new: incidents.filter(i => i.status === 'NEW').length,
    inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  return (
    <div className="bg-white rounded shadow-sm p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center">
        <div className="text-3xl md:text-4xl text-[#1976d2]">{stats.total}</div>
        <div className="text-sm text-[#666666] mt-1">Total Reports</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl text-[#1976d2]">{stats.new}</div>
        <div className="text-sm text-[#666666] mt-1">New</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl text-[#f57c00]">{stats.inProgress}</div>
        <div className="text-sm text-[#666666] mt-1">In Progress</div>
      </div>
      <div className="text-center">
        <div className="text-3xl md:text-4xl text-[#388e3c]">{stats.resolved}</div>
        <div className="text-sm text-[#666666] mt-1">Resolved</div>
      </div>
    </div>
  );
}
