'use client';

import { useState, useEffect } from 'react';
import { socket } from '@/utils/Socket';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { adminReportService } from '@/services/adminReportService';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import { useReportStore } from '@/appStore/useReportStore';
import ConfirmationModal from '@/ customComponents/common/confirmationModel';

interface Report {
  _id: string;
  reason: string;
  createdAt: string;
  reporter: { username: string; email: string };
  post: {
    _id: string;
    title: string;
    description: string;
    mediaUrls: string[];
    owner: { username: string; email: string };
  };
}

const PAGE_LIMIT = 10;

function DescriptionWithReadMore({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const maxLength = 100;

  if (!description) {
    return (
      <span className="italic text-gray-400 dark:text-gray-500">No description</span>
    );
  }

  const isLong = description.length > maxLength;
  const visibleText = expanded || !isLong ? description : description.slice(0, maxLength) + '...';

  return (
    <span className="text-gray-800 dark:text-gray-100">
      {visibleText}
      {isLong && (
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1 text-blue-500 hover:underline text-sm"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </span>
  );
}

export default function Spam() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { reportCount, setReportCount, increment: incRep, decrement: decRep } = useReportStore();

  const {
    data: reports = [],
    isLoading,
    isFetching,
  } = useQuery<Report[]>({
    queryKey: ['reports', page],
    queryFn: () => adminReportService.getReportedPosts({ page, limit: PAGE_LIMIT }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (rId: string) =>
      new Promise<void>((res, rej) =>
        socket.emit('admin:dismissReport', rId, (resp: any) =>
          resp.success ? res() : rej(new Error(resp.message)),
        ),
      ),
    onSuccess: (_, rId) => {
      qc.setQueryData<Report[]>(
        ['reports', page],
        (prev) => prev?.filter((r) => r._id !== rId) || [],
      );
      decRep();
      toast.success('✅ Report dismissed');
    },
    onError: () => toast.error('❌ Failed to dismiss'),
  });

  const blockMutation = useMutation({
    mutationFn: async (pId: string) =>
      new Promise<void>((res, rej) =>
        socket.emit('admin:blockPost', pId, (resp: any) =>
          resp.success ? res() : rej(new Error(resp.message)),
        ),
      ),
    onSuccess: (_, pId) => {
      qc.invalidateQueries(['reports', page] as any);
      decRep();
      toast.success('🚫 Post blocked');
    },
    onError: () => toast.error('❌ Failed to block post'),
  });

  useEffect(() => {
    socket.emit('admin:join');
    adminReportService.getReportCount().then((r) => setReportCount(r.count));

    // const onNewReport = (report: Report) => {
    //   qc.setQueryData<Report[]>(['reports', 1], (prev) =>
    //     prev ? [report, ...prev] : [report]
    //   );
    //   incRep();
    //   toast.info('📨 New report received');
    // };

    // socket.on('admin:newReport', onNewReport);

    return () => {
      // socket.off('admin:newReport', onNewReport);
    };
  }, [qc, setReportCount, incRep]);

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectAllOnPage = () => {
    const s = new Set(selected);
    reports.forEach((r) => s.add(r._id));
    setSelected(s);
  };

  const clearSelection = () => setSelected(new Set());

  const dismissSelected = () => {
    selected.forEach((id) => dismissMutation.mutate(id));
    clearSelection();
  };

  const blockSelected = () => {
    selected.forEach((id) => {
      const postId = reports.find((r) => r._id === id)?.post._id;
        
      if (postId) blockMutation.mutate(postId);
    });
    clearSelection();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <AlertTriangle className="w-6 h-6 text-yellow-600" />
          Reported Posts
        </h1>
        <motion.div
          key={reportCount}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full font-semibold text-sm shadow-sm"
        >
          Total: {reportCount}
        </motion.div>
      </div>

      {/* Bulk Action Buttons */}
      {selected.size > 0 && (
        <div className="flex gap-4 mb-6">
          <Button
            variant="destructive"
            onClick={dismissSelected}
            disabled={dismissMutation.isPending}
          >
            Dismiss Selected ({selected.size})
          </Button>
          <Button variant="outline" onClick={blockSelected} disabled={blockMutation.isPending}>
            Block Selected
          </Button>
          <Button variant="secondary" onClick={clearSelection}>
            Clear Selection
          </Button>
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <p className="text-gray-600 dark:text-gray-300">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="text-gray-500 italic dark:text-gray-400">No reports found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => {
            const isSel = selected.has(report._id);
            return (
              <Card
                key={report._id}
                onClick={() => toggleSelect(report._id)}
                className={`shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                  isSel
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900'
                    : 'border-transparent bg-white dark:bg-gray-800 dark:border-gray-700'
                } hover:shadow-lg`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-gray-500 dark:text-gray-300">
                      Reported by{' '}
                      <strong className="text-gray-800 dark:text-gray-100">
                        {report.reporter.username}
                      </strong>{' '}
                      · {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </div>
                    <div className="text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded">
                      {report.reason}
                    </div>
                  </div>

                  <p className="text-gray-800 dark:text-gray-100">
                    <DescriptionWithReadMore description={report.post.description} />
                  </p>

                  {report.post.mediaUrls?.[0] && (
                    <div className="border rounded-md bg-gray-50 dark:bg-gray-700 p-2 flex justify-center items-center">
                      <img
                        src={report.post.mediaUrls[0]}
                        alt="Reported"
                        className="max-h-[200px] w-auto object-contain"
                      />
                    </div>
                  )}

                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Owner:{' '}
                    <strong className="text-gray-800 dark:text-gray-100">
                      {report.post.owner.username}
                    </strong>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1 || isFetching}
        >
          ⬅ Previous
        </Button>
        <span className="text-gray-700 dark:text-gray-200 font-medium">Page {page}</span>
        <div className="flex gap-2">
          <Button onClick={selectAllOnPage}>Select All</Button>
          <Button
            onClick={() => setPage((p) => p + 1)}
            disabled={reports.length < PAGE_LIMIT || isFetching}
          >
            Next ➡
          </Button>
        </div>
      </div>
    </div>
  );
}
