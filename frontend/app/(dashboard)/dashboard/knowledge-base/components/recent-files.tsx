'use client';

import React, { useMemo, useState } from 'react';
import FileCard from './file-card';

const mockFiles = [
  {
    id: 1,
    name: 'Annual Report 2024.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2 hours ago',
    enabled: true,
  },
  {
    id: 2,
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    uploadDate: '4 hours ago',
    enabled: false,
  },
  {
    id: 3,
    name: 'Project Overview.html',
    type: 'html',
    size: '89 KB',
    uploadDate: '6 hours ago',
    enabled: true,
  },
  {
    id: 4,
    name: 'README.txt',
    type: 'text',
    size: '12 KB',
    uploadDate: '8 hours ago',
    enabled: true,
  },
  {
    id: 5,
    name: 'Presentation.pptx',
    type: 'pptx',
    size: '5.2 MB',
    uploadDate: '1 day ago',
    enabled: true,
  },
  {
    id: 6,
    name: 'Budget Analysis.pdf',
    type: 'pdf',
    size: '1.8 MB',
    uploadDate: '1 day ago',
    enabled: true,
  },
  {
    id: 7,
    name: 'Contract Draft.docx',
    type: 'docx',
    size: '234 KB',
    uploadDate: '2 days ago',
    enabled: true,
  },
  {
    id: 8,
    name: 'Landing Page.html',
    type: 'html',
    size: '145 KB',
    uploadDate: '2 days ago',
    enabled: false,
  },
  {
    id: 9,
    name: 'Config.txt',
    type: 'text',
    size: '8 KB',
    uploadDate: '3 days ago',
    enabled: false,
  },
  {
    id: 10,
    name: 'Sales Deck.pptx',
    type: 'pptx',
    size: '7.1 MB',
    uploadDate: '3 days ago',
    enabled: true,
  },
  {
    id: 11,
    name: 'Annual Report 2024.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2 hours ago',
    enabled: true,
  },
  {
    id: 12,
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    uploadDate: '4 hours ago',
    enabled: false,
  },
  {
    id: 13,
    name: 'Project Overview.html',
    type: 'html',
    size: '89 KB',
    uploadDate: '6 hours ago',
    enabled: true,
  },
  {
    id: 14,
    name: 'README.txt',
    type: 'text',
    size: '12 KB',
    uploadDate: '8 hours ago',
    enabled: true,
  },
  {
    id: 15,
    name: 'Presentation.pptx',
    type: 'pptx',
    size: '5.2 MB',
    uploadDate: '1 day ago',
    enabled: true,
  },
  {
    id: 16,
    name: 'Sales Deck.pptx',
    type: 'pptx',
    size: '7.1 MB',
    uploadDate: '3 days ago',
    enabled: true,
  },
  {
    id: 17,
    name: 'Annual Report 2024.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadDate: '2 hours ago',
    enabled: true,
  },
  {
    id: 18,
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    uploadDate: '4 hours ago',
    enabled: false,
  },

  {
    id: 19,
    name: 'Project Overview.html',
    type: 'html',
    size: '89 KB',
    uploadDate: '6 hours ago',
    enabled: true,
  },
  {
    id: 20,
    name: 'Meeting Notes.docx',
    type: 'docx',
    size: '156 KB',
    uploadDate: '4 hours ago',
    enabled: false,
  },
];

const PAGE_SIZE = 15;

const RecentFiles = () => {
  const [page, setPage] = useState(1);

  const total = mockFiles.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  const currentFiles = useMemo(() => {
    return mockFiles.slice(startIndex, endIndex);
  }, [startIndex, endIndex]);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {currentFiles.map((file) => (
          <FileCard key={file.id} file={file} />
        ))}
      </div>

      <div className="mt-2 flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          Showing {total === 0 ? 0 : startIndex + 1}-{endIndex} of {total}
        </p>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                p === page
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : ''
              }`}
              onClick={() => goToPage(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}

          <button
            className="rounded-md border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </nav>
      </div>
    </div>
  );
};

export default RecentFiles;
