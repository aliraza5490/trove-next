'use client';
import React, { useActionState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  FileText,
  Heart,
  Smile,
  HardDrive,
  Loader2Icon,
} from 'lucide-react';
import StatCard from './stat-card';
import { useStatsQuery, useUploadFilesMutation } from '../hooks';
import { formatBytes } from '@/lib/utils';

const StatsSection = () => {
  const { isLoading, data } = useStatsQuery();
  const { mutateAsync, isPending } = useUploadFilesMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPending) return;
    const files = Array.from(e.target.files ?? []);
    if (files.length) {
      const payload = new FormData();
      files.forEach((file) => {
        payload.append('files', file);
      });
      mutateAsync(payload);
    }
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Upload Card */}
      <input
        type="file"
        className="hidden"
        id="file-upload"
        onChange={handleFileChange}
        disabled={isPending}
      />
      <label
        htmlFor="file-upload"
        className={`cursor-pointer ${isPending ? 'pointer-events-none' : ''}`}
        aria-disabled={isPending}
        aria-busy={isPending}
      >
        <Card
          className={`hover:cursor-pointer transition-colors w-full lg:w-auto ${
            isPending ? 'opacity-70' : ''
          }`}
        >
          <CardContent
            className={`flex flex-col items-center justify-center ${
              isPending ? 'animate-pulse' : ''
            }`}
          >
            <div className="mb-4 rounded-full bg-primary p-4">
              {isPending ? (
                <Loader2Icon
                  className="h-8 w-8 animate-spin text-white"
                  strokeWidth={2}
                />
              ) : (
                <Plus className="h-8 w-8 text-white" strokeWidth={2} />
              )}
            </div>
            <span className="text-lg font-medium text-white">
              {isPending ? 'Uploading...' : 'Upload Files'}
            </span>
            <span className="text-sm text-slate-400 mt-1">
              {isPending ? 'Please wait' : 'Add new documents'}
            </span>
          </CardContent>
        </Card>
      </label>

      {/* Total Docs Card */}
      <StatCard
        icon={<FileText className="h-6 w-6 text-blue-400" />}
        iconBgClass="bg-blue-500/20"
        value={isLoading ? '...' : data?.total_files}
        label="Total Files"
      />

      {/* Active Chats */}
      <StatCard
        icon={<Heart className="h-6 w-6 text-emerald-400" />}
        iconBgClass="bg-emerald-500/20"
        value={isLoading ? '...' : data?.total_chats}
        label="Active Chats"
      />

      {/* Success Rate */}
      <StatCard
        icon={<Smile className="h-6 w-6 text-yellow-400" />}
        iconBgClass="bg-yellow-500/20"
        value={isLoading ? '...' : data?.total_messages}
        label="Total Messages"
      />

      {/* Total Size */}
      <StatCard
        icon={<HardDrive className="h-6 w-6 text-purple-400" />}
        iconBgClass="bg-purple-500/20"
        value={isLoading ? '...' : formatBytes(data?.storage)}
        label="Total Storage Used"
      />
    </div>
  );
};

export default StatsSection;
