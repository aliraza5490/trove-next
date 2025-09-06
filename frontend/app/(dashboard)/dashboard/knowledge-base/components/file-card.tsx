'use client';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  File,
  Globe,
  Type,
  Presentation,
  MoreVertical,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { IFile } from '../types';
import { formatBytes, timeAgo } from '@/lib/utils';

type FileType = 'pdf' | 'docx' | 'html' | 'text' | 'pptx' | string;

export interface FileCardProps {
  file: IFile;
  onDelete?: (id: string) => void;
  className?: string;
}

const getFileIcon = (type: FileType) => {
  switch (type) {
    case 'pdf':
      return <FileText className="h-8 w-8 text-red-400" />;
    case 'docx':
      return <File className="h-8 w-8 text-blue-400" />;
    case 'html':
      return <Globe className="h-8 w-8 text-orange-400" />;
    case 'text':
      return <Type className="h-8 w-8 text-green-400" />;
    case 'pptx':
      return <Presentation className="h-8 w-8 text-purple-400" />;
    default:
      return <File className="h-8 w-8 text-gray-400" />;
  }
};

export default function FileCard({
  file,
  onDelete,
  className = '',
}: FileCardProps) {
  const { id, file_name: name, file_size: size, created_at: uploadDate } = file;

  return (
    <Card
      className={`relative hover:bg-slate-750 transition-colors ${className}`}
    >
      <CardContent className="p-4">
        {/* Actions (top-right) */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="text-slate-400 hover:text-white p-1 rounded">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700">
              <DropdownMenuItem
                className="text-red-400 hover:bg-slate-700"
                onClick={() => onDelete?.(id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Vertical content */}
        <div className="flex flex-col items-center text-center gap-2 pt-2">
          {/* File Icon */}
          <div className="flex-shrink-0">
            <div className="relative">
              {getFileIcon(file.file_name.split('.').pop() as string)}
            </div>
          </div>

          {/* File Information */}
          <div className="w-full">
            <h3
              className="text-sm font-medium text-white truncate"
              title={name}
            >
              {name}
            </h3>
            <div className="flex items-center justify-center space-x-2 mt-1">
              <p className="text-xs text-slate-400">{formatBytes(size)}</p>
              <span className="text-slate-600">•</span>
              <p className="text-xs text-slate-500">{timeAgo(uploadDate)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
