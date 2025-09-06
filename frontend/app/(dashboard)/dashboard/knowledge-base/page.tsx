import RecentFilesSection from './components/recent-files';
import StatsSection from './components/stats-section';

export default function DocumentDashboard() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <StatsSection />
        <RecentFilesSection />
      </div>
    </div>
  );
}
