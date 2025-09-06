import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StatCardProps = {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  iconBgClass?: string;
  className?: string; // applied to Card
  contentClassName?: string; // applied to CardContent
};

export default function StatCard({
  icon,
  value,
  label,
  iconBgClass = 'bg-slate-700/50',
  className = '',
  contentClassName = 'px-6',
}: StatCardProps) {
  return (
    <Card
      className={cn('flex-1 flex flex-col justify-center min-w-60', className)}
    >
      <CardContent className={contentClassName}>
        <div className="flex flex-col space-y-4">
          <div className={`rounded-lg p-3 w-fit ${iconBgClass}`}>{icon}</div>
          <div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
