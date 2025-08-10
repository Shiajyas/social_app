import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/appStore/AuthStore';
import { socket } from '@/utils/Socket';
import { Trash2, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import CommentInput from './CommentInput';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export const CommentItem = ({ comment, replies = [] }: { comment: any; replies: any[] }) => {
  const { user } = useAuthStore();
  const [likesCount, setLikesCount] = useState(comment?.likes?.length || 0);
  const [liked, setLiked] = useState(Array.isArray(comment?.likes) && comment.likes.includes(user?._id));
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [localReplies, setLocalReplies] = useState(replies);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setLocalReplies(replies);
  }, [replies]);

  // Live Like Updates
  useEffect(() => {
    const handleLikeUpdate = ({ commentId, likes }: { commentId: string; likes: string[] }) => {
      if (comment._id === commentId) {
        setLikesCount(likes.length);
        setLiked(likes.includes(user?._id));
      }
    };
    socket.on('commentLiked', handleLikeUpdate);
    return () => socket.off('commentLiked', handleLikeUpdate);
  }, [comment._id, user?._id]);

  // Live Delete Updates
  useEffect(() => {
    const handleDeleteUpdate = ({ commentId }: { commentId: string }) => {
      if (comment._id === commentId) {
        setDeleted(true);
      } else {
        setLocalReplies((prev) => prev.filter((reply) => reply._id !== commentId));
      }
    };
    socket.on('delete_comment', handleDeleteUpdate);
    return () => socket.off('delete_comment', handleDeleteUpdate);
  }, [comment._id]);

  const handleLikeToggle = () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount((prev) => (newLikedState ? prev + 1 : prev - 1));

    socket.emit(newLikedState ? 'likeComment' : 'unLikeComment', {
      commentId: comment._id,
      userId: user?._id,
    });
  };

  const handleDelete = () => {
    socket.emit('deleteComment', { commentId: comment._id });
  };

  const handleProfileClick = () => {
    if (comment?.userId?._id) {
      navigate(`/home/profile/${comment.userId._id}`);
    }
  };

  const handleReplyClick = (commentId: string) => {
    if (selectedCommentId === commentId) {
      setShowReplyInput(!showReplyInput);
    } else {
      setShowReplyInput(true);
      setSelectedCommentId(commentId);
    }
  };

  if (deleted) return null;

  return (
    <div className="w-full">
      <div className="flex items-start p-2 space-x-3">
        {/* Avatar */}
        <button onClick={handleProfileClick} className="focus:outline-none">
          <img
            src={comment?.userId?.avatar || '/default-avatar.png'}
            alt="User"
            className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80"
          />
        </button>

        {/* Comment Bubble */}
        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg w-full shadow-sm outline outline-1 outline-gray-200 dark:outline-gray-700">
          {/* Username + Time */}
          <div className="flex items-center gap-2 mb-1">
            <span
              onClick={handleProfileClick}
              className="font-semibold text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:underline"
            >
              {comment?.userId?.fullname|| 'Unknown User'}
            </span>
            <span className="text-xs text-gray-500">
              {comment?.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
            </span>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-800 dark:text-gray-200">{comment?.content || 'Comment unavailable'}</p>

          {/* Actions */}
          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-600 dark:text-gray-400">
            <button
              onClick={handleLikeToggle}
              className={`flex items-center gap-1 ${liked ? 'text-red-500 hover:text-red-700' : 'hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <Heart size={16} /> <span>{likesCount}</span>
            </button>

            <button
              onClick={() => handleReplyClick(comment._id)}
              className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400"
            >
              Reply
            </button>

            {localReplies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-blue-500 dark:text-blue-400"
              >
                {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>
                  {showReplies ? 'Hide Replies' : `Show Replies (${localReplies.length})`}
                </span>
              </button>
            )}

            {comment?.userId?._id === user?._id && (
              <button
                onClick={handleDelete}
                className="text-red-500 flex items-center gap-1 hover:text-red-700"
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyInput && selectedCommentId === comment._id && (
            <div className="pl-8 mt-2">
              <CommentInput
                postId={comment?.postId}
                parentId={comment?._id}
                onReplySent={() => {
                  setShowReplyInput(false);
                  setSelectedCommentId(null);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {showReplies && localReplies.length > 0 && (
        <div className="pl-8 mt-2 border-l border-gray-300 dark:border-gray-600">
          {localReplies.map((reply) => (
            <CommentItem key={reply._id} comment={reply} replies={reply.replies || []} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
