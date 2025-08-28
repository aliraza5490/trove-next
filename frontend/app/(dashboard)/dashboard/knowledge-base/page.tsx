import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Heart, Smile, HardDrive } from 'lucide-react';
import StatCard from './components/stat-card';
import RecentFiles from './components/recent-files';

export default function DocumentDashboard() {
  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-wrap gap-4">
          {/* Upload Card */}

          <input type="file" className="hidden" id="file-upload" />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Card className="hover:cursor-pointer transition-colors w-full lg:w-auto">
              <CardContent className="flex flex-col items-center justify-center">
                <div className="mb-4 rounded-full bg-primary p-4">
                  <Plus className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <span className="text-lg font-medium text-white">
                  Upload Files
                </span>
                <span className="text-sm text-slate-400 mt-1">
                  Add new documents
                </span>
              </CardContent>
            </Card>
          </label>

          {/* Total Docs Card */}
          <StatCard
            icon={<FileText className="h-6 w-6 text-blue-400" />}
            iconBgClass="bg-blue-500/20"
            value="1,000"
            label="Total Documents"
          />

          {/* Active Files */}
          <StatCard
            icon={<Heart className="h-6 w-6 text-emerald-400" />}
            iconBgClass="bg-emerald-500/20"
            value="847"
            label="Active Files"
          />

          {/* Success Rate */}
          <StatCard
            icon={<Smile className="h-6 w-6 text-yellow-400" />}
            iconBgClass="bg-yellow-500/20"
            value="98.5%"
            label="Success Rate"
          />

          {/* Total Size */}
          <StatCard
            icon={<HardDrive className="h-6 w-6 text-purple-400" />}
            iconBgClass="bg-purple-500/20"
            value="24.7 GB"
            label="Total Storage Used"
          />
        </div>

        {/* Recently Uploaded Files Section */}
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-white">
            Recently Uploaded Files
          </h2>

          <RecentFiles />
        </div>
      </div>
    </div>
  );
}
