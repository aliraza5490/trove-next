'use client';

import { useState } from 'react';
import { useDeleteFileMutation, useFilesQuery } from '../hooks';
import FileCard from './file-card';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { IFile } from '../types';

const PAGE_SIZE = 15;

const RecentFilesSection = () => {
  const [page, setPage] = useState(1);
  const { isLoading, data } = useFilesQuery(page);
  const { isPending, mutateAsync } = useDeleteFileMutation();
  const [fileToDelete, setFileToDelete] = useState<IFile | null>(null);

  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete || isPending) return;
    try {
      await mutateAsync(fileToDelete.id);
    } finally {
      setFileToDelete(null);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-white">
        Recently Uploaded Files
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {data.data.map((file: any) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => setFileToDelete(file)}
            />
          ))}
          {data.data.length === 0 && (
            <div className="col-span-1 text-muted-foreground">
              No files found
            </div>
          )}
        </div>

        {!!data.data.length && (
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
        )}
      </div>

      <ConfirmModal
        open={!!fileToDelete}
        onOpenChange={(open) => {
          if (!open && !isPending) setFileToDelete(null);
        }}
        title="Delete File"
        description={
          <>
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{fileToDelete?.file_name}&quot;</span>? This action cannot be undone.
          </>
        }
        confirmText="Delete File"
        variant="destructive"
        loading={isPending}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default RecentFilesSection;
