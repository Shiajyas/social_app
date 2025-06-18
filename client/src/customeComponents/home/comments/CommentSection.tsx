import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket } from '@/utils/Socket';
import { useGetComments } from '@/hooks/useComment';
import CommentList from './CommentList';
import CommentInput from './CommentInput';
import { X } from 'lucide-react';

const MAX_VISIBLE_COMMENTS = 5;

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const queryClient = useQueryClient();
  const { data } = useGetComments(postId);
  const comments = data?.pages.flatMap((page) => page) || [];

  const [isFixed, setIsFixed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setIsFixed(comments.length > MAX_VISIBLE_COMMENTS);

    socket.emit('joinPostRoom', postId);

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['comments', postId] });

    socket.on('newComment', invalidate);
    socket.on('newReply', invalidate);
    socket.on('delete_comment', invalidate);
    socket.on('commentLiked', invalidate);
    socket.on('delete_reply', invalidate);

    return () => {
      socket.emit('leavePostRoom', postId);
      socket.off('newComment', invalidate);
      socket.off('newReply', invalidate);
      socket.off('delete_comment', invalidate);
      socket.off('commentLiked', invalidate);
      socket.off('delete_reply', invalidate);
    };
  }, [postId, queryClient, comments.length]);

  if (!visible) return null;

  return (
    <div
      className="relative w-full bg-white dark:bg-gray-900 shadow-md rounded-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mobile View */}
      {/* Mobile View */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-[90vh] bg-white dark:bg-gray-800 shadow-lg rounded-t-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-2 border-b bg-gray-100 dark:bg-gray-700">
          <span className="font-semibold text-gray-800 dark:text-gray-100">Comments</span>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Comment List */}
        <div className="flex-grow overflow-y-auto p-2">
          {comments.length > 0 ? (
            <CommentList comments={comments} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
              Be the first to comment!
            </p>
          )}
        </div>

        {/* Input Box */}
        <div className="my-20 border-t bg-gray-100 dark:bg-gray-700">
          <CommentInput postId={postId} />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:block p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">Comments</h3>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`p-2 bg-white dark:bg-gray-900 rounded-md shadow-sm overflow-y-auto transition-all duration-300 ${
            isFixed ? 'h-96' : 'max-h-[80vh]'
          }`}
        >
          {comments.length > 0 ? (
            <CommentList comments={comments} />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
              Be the first to comment!
            </p>
          )}
        </div>

        <div className="p-2 border-t mt-2 border-gray-200 dark:border-gray-700">
          <CommentInput postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
