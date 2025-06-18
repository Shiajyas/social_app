import React, { useEffect, useRef, useState } from 'react';
import { socket } from '@/utils/Socket';
import { useAuthStore } from '@/appStore/AuthStore';
import { Send, Smile, X } from 'lucide-react';
import Picker from '@emoji-mart/react';
import { useQueryClient } from '@tanstack/react-query';

interface CommentInputProps {
  postId: string;
  parentId?: string;
  onReplySent?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({ postId, parentId, onReplySent }) => {
  const { user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const handleSend = () => {
    const content = comment.trim();
    if (!content) return;

    const tempId = Math.random().toString(36).substring(2, 9);
    const tempComment = {
      _id: tempId,
      postId,
      content,
      parentId,
      userId: {
        _id: user?._id,
        avatar: user?.avatar || '/default-avatar.png',
        name: user?.fullname || 'Anonymous',
      },
      likes: [],
      createdAt: new Date().toISOString(),
    };

    // Optimistic update (optional - implement if needed)
    queryClient.invalidateQueries({ queryKey: ['comments', postId] });

    socket.emit(
      'addComment',
      { postId, content, userId: user?._id, parentId },
      (serverComment: any) => {
        if (serverComment) {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] });
          if (onReplySent) onReplySent();
        }
      },
    );

    setComment('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showEmojiPicker]);

  return (
    <div className="flex items-end mt-2 space-x-2 w-full relative">
      <textarea
        ref={textareaRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder="Write a comment..."
        className="w-full border rounded-lg px-3 py-2 text-sm resize-none bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-400 outline-none"
      />

      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300"
      >
        <Smile size={20} />
      </button>

      {showEmojiPicker && (
        <div
          ref={emojiRef}
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50 bg-white dark:bg-gray-900 text-black dark:text-white shadow-lg p-3 rounded-lg w-72"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Pick an emoji</span>
            <button onClick={() => setShowEmojiPicker(false)}>
              <X size={18} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
            </button>
          </div>
          <Picker
            theme="auto"
            onEmojiSelect={(emoji: any) => setComment((prev) => prev + (emoji.native || ''))}
          />
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={!comment.trim()}
        className={`p-2 rounded-full transition-colors ${
          comment.trim()
            ? 'bg-blue-500 text-white hover:bg-blue-600'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <Send size={20} />
      </button>
    </div>
  );
};

export default CommentInput;
