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
          onClick={(e) => {
            e.stopPropagation(); // ✅ This stops triggering Card click
            setExpanded((prev) => !prev);
          }}
          className="ml-1 text-blue-500 hover:underline text-sm"
        >
          {/* {expanded ? 'Show less' : 'Read more'} */}
        </button>
      )}
    </span>
  );
}

export default function Spam() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockPostIds, setBlockPostIds] = useState<string[]>([]);

  const { reportCount, setReportCount, decrement: decRep } = useReportStore();

  const { data: reports = [], isLoading, isFetching } = useQuery<Report[]>({
    queryKey: ["reports", page],
    queryFn: () => adminReportService.getReportedPosts({ page, limit: PAGE_LIMIT }),
  });

  const dismissMutation = useMutation({
    mutationFn: async (rId: string) =>
      new Promise<void>((res, rej) =>
        socket.emit("admin:dismissReport", rId, (resp: any) =>
          resp.success ? res() : rej(new Error(resp.message))
        )
      ),
    onSuccess: (_, rId) => {
      qc.setQueryData<Report[]>(
        ["reports", page],
        (prev) => prev?.filter((r) => r._id !== rId) || []
      );
      decRep();
      toast.success("✅ Report dismissed");
    },
    onError: () => toast.error("❌ Failed to dismiss"),
  });

  const blockMutation = useMutation({
    mutationFn: async (pId: string) =>
      new Promise<void>((res, rej) =>
        socket.emit("admin:blockPost", pId, (resp: any) =>
          resp.success ? res() : rej(new Error(resp.message))
        )
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports", page] });
      decRep();
      toast.success("🚫 Post blocked");
    },
    onError: () => toast.error("❌ Failed to block post"),
  });

  useEffect(() => {
    socket.emit("admin:join");
    adminReportService.getReportCount().then((r) => setReportCount(r.count));
  }, [setReportCount]);

  const toggleSelect = (postId: string) => {
    const s = new Set(selected);
    s.has(postId) ? s.delete(postId) : s.add(postId);
    setSelected(s);
  };

  const selectAllOnPage = () => {
    const s = new Set(selected);
    groupedReports.forEach((g) => s.add(g.post._id));
    setSelected(s);
  };

  const clearSelection = () => setSelected(new Set());

  const dismissSelected = () => {
    selected.forEach((postId) => {
      const reportId = reports.find((r) => r.post._id === postId)?._id;
      if (reportId) dismissMutation.mutate(reportId);
    });
    clearSelection();
  };

  const blockSelected = () => {
    setBlockPostIds(Array.from(selected));
    setShowBlockConfirm(true);
  };

  // Group reports by post ID
  const groupedReports = Object.values(
    reports.reduce((acc: Record<string, any>, report) => {
      if (!acc[report.post._id]) {
        acc[report.post._id] = {
          post: report.post,
          reasons: new Set<string>(),
          reporters: new Set<string>(),
          createdAt: report.createdAt,
        };
      }
      acc[report.post._id].reasons.add(report.reason);
      acc[report.post._id].reporters.add(report.reporter.username);
      return acc;
    }, {})
  );

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
          onClick={(e) => {
            e.stopPropagation();
            dismissSelected();
          }}
          disabled={dismissMutation.isPending}
        >
          Dismiss Selected ({selected.size})
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            blockSelected();
          }}
          disabled={blockMutation.isPending}
        >
          Block Selected
        </Button>
        <Button
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            clearSelection();
          }}
        >
          Clear Selection
        </Button>
      </div>
    )}

    {/* Cards Grid */}
    {isLoading ? (
      <p className="text-gray-600 dark:text-gray-300">Loading reports...</p>
    ) : groupedReports.length === 0 ? (
      <p className="text-gray-500 italic dark:text-gray-400">No reports found.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupedReports.map((g) => {
          const isSel = selected.has(g.post._id);
          return (
            <Card
              key={g.post._id}
              onClick={() => toggleSelect(g.post._id)}
              className={`shadow-sm border-2 cursor-pointer transition-all duration-200 ${
                isSel
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900"
                  : "border-transparent bg-white dark:bg-gray-800 dark:border-gray-700"
              } hover:shadow-lg`}
            >
              <CardContent className="p-5 space-y-3">
                {/* Reporter Info */}
                <div className="text-sm text-gray-500 dark:text-gray-300">
                  Reported by{" "}
                  <strong className="text-gray-800 dark:text-gray-100">
                    {Array.from(g.reporters).join(", ")}
                  </strong>{" "}
                  · {formatDistanceToNow(new Date(g.createdAt), { addSuffix: true })}
                </div>

                {/* Reasons */}
                <div className="text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded">
                  {Array.from(g.reasons).join(", ")}
                </div>

                {/* Description */}
                <p className="text-gray-800 dark:text-gray-100">
                  <DescriptionWithReadMore description={g.post.description} />
                </p>

                {/* Media Preview */}
                {g.post.mediaUrls?.[0] && (
                  <div className="border rounded-md bg-gray-50 dark:bg-gray-700 p-2 flex justify-center items-center">
                    <img
                      src={g.post.mediaUrls[0]}
                      alt="Reported"
                      className="max-h-[200px] w-auto object-contain"
                    />
                  </div>
                )}

                {/* Owner */}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Owner:{" "}
                  <strong className="text-gray-800 dark:text-gray-100">
                    {g.post.owner.username}
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
      <span className="text-gray-700 dark:text-gray-200 font-medium">
        Page {page}
      </span>
      <div className="flex gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            selectAllOnPage();
          }}
        >
          Select All
        </Button>
        <Button
          onClick={() => setPage((p) => p + 1)}
          disabled={reports.length < PAGE_LIMIT || isFetching}
        >
          Next ➡
        </Button>
      </div>
    </div>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={showBlockConfirm}
      onClose={() => {
        setShowBlockConfirm(false);
        setBlockPostIds([]);
      }}
      onConfirm={() => {
        blockPostIds.forEach((postId) => blockMutation.mutate(postId));
        setShowBlockConfirm(false);
        setBlockPostIds([]);
        clearSelection();
      }}
      title="Confirm Block"
      message={`Are you sure you want to block ${blockPostIds.length} post(s)? This action is irreversible.`}
      confirmText="Yes, Block"
      cancelText="Cancel"
    />
  </div>
);

}