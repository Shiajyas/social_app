import React, { useEffect, useRef, useState } from 'react';
import { socket } from '@/utils/Socket';
import { useAuthStore } from '@/appStore/AuthStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';
import useGroupMessages from '@/hooks/group/useGroupMessages';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Divide } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useCallback } from "react";



interface Message {
  _id: string;
  groupId: string;
  senderId: string;
  content: string;
  timestamp?: string;
  replyTo?: {
    _id: string;
    content: string;
    senderId: string;
  };
  sender?: {
    _id: string;
    username: string;
    avatar?: string | null;
  };
}

interface Props {
  communityId: string;
}

const MAX_LENGTH = 180;
const GroupChatView: React.FC<Props> = ({ communityId }) => {

  if(!communityId){
    return null
  }
  const location = useLocation();

  // without path params like id not render
useEffect(() => {
  if (location.pathname !== `/home/community/${communityId}`) {
  return null
  }
},[location.pathname, communityId,]);

  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [input, setInput] = useState('');
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const initialLoadRef = useRef(true);

  const [unreadMessages, setUnreadMessages] = useState<Message[]>([]); // ✅ ADDED
  const [isAtBottom, setIsAtBottom] = useState(true); // ✅ ADDED

 
  const [expandedMessages, setExpandedMessages] = useState(new Set());

  const toggleExpand = (id) => {
    const newSet = new Set(expandedMessages);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setExpandedMessages(newSet);
  };

  const isExpanded = (id) => expandedMessages.has(id);


  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGroupMessages(communityId);

  const flattenedMessages: Message[] = data?.pages?.flatMap((page: any) => page.messages) ?? [];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };


useEffect(() => {
  if (!communityId || !user?._id) return;

  // Join once per communityId + user change
  socket.emit("joinGroup", { communityId, userId: user._id });

  return () => {
    socket.emit("leaveGroup", { communityId, userId: user._id });
  };
}, [communityId, user?._id]);

const handleReceive = useCallback(
  (msg: Message) => {
    queryClient.invalidateQueries({ queryKey: ["groupMessages", communityId] });

    if (!isAtBottom && msg.senderId !== user._id) {
      setUnreadMessages((prev) => [...prev, msg]);
    }
  },
  [communityId, isAtBottom, user?._id]
);

useEffect(() => {
  socket.on("new-message", handleReceive);

  return () => {
    socket.off("new-message", handleReceive);
  };
}, );

  useEffect(() => {
    if (initialLoadRef.current && flattenedMessages.length && chatContainerRef.current) {
      scrollToBottom();
      initialLoadRef.current = false;
    }
  }, [flattenedMessages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !user || !communityId) return;

    const newMessage: Message = {
      _id: Math.random().toString(36),
      groupId: communityId,
      senderId: user._id,
      content: trimmed,
      timestamp: new Date().toISOString(),
      replyTo: replyTarget
        ? {
            _id: replyTarget._id,
            senderId: replyTarget.senderId,
            content: replyTarget.content,
          }
        : undefined,
      sender: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar ?? null,
      },
    };

    socket.emit('sendCommunityMessage', {
      groupId: communityId,
      message: newMessage,
    });

        queryClient.invalidateQueries({ queryKey: ['groups'] })


    queryClient.setQueryData(['groupMessages', communityId], (prev: any) => {
      if (!prev) return { pages: [{ messages: [newMessage] }], pageParams: [] };

      const updatedPages = prev.pages.map((page, i) => {
        if (i === prev.pages.length - 1) {
          return {
            ...page,
            messages: [...page.messages, newMessage],
          };
        }
        return page;
      });

      return {
        ...prev,
        pages: updatedPages,
      };
    });


    setInput('');
    setReplyTarget(null);
    scrollToBottom(); // ✅ Auto scroll to bottom on send
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);

    if (atBottom) setUnreadMessages([]); // ✅ Clear unread when back at bottom
    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      loadOlderMessages();
    }
  };

  const scrollToMessage = (id: string) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 1500);
    }
  };

  const loadOlderMessages = async () => {
    const container = chatContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    await fetchNextPage();

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };




  return (
    <Card className="w-full h-full flex flex-col rounded-xl overflow-hidden bg-white dark:bg-gray-900">

      {/* Unread Notification */}
      {unreadMessages.length > 0 && (
        <div
          className="absolute bottom-[70px] left-1/2 transform -translate-x-1/2 
          bg-blue-600 text-white text-sm px-4 py-1 rounded-full 
          cursor-pointer shadow-md z-10"
          onClick={() => {
            scrollToBottom();
            setUnreadMessages([]);
          }}
        >
          {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''} ↓
        </div>
      )}

      {/* Chat Message List */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-grow overflow-y-auto px-4 py-2 space-y-3 relative"
        >
          {flattenedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-24 h-24 mb-4 text-blue-400 dark:text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m-4 4h10M5 5a2 2 0 00-2 2v12l4-4h10a2 2 0 002-2V7a2 2 0 00-2-2H5z" />
              </svg>
              <p className="text-sm italic">No messages yet. Be the first to start the conversation 💬</p>
            </div>
          ) : (
            flattenedMessages.map((msg) => {
              const isOwnMessage = msg.senderId === user?._id;
              const isLong = msg.content.length > 150;
              const showFull = isExpanded(msg._id);
              const displayedContent = isLong && !showFull ? `${msg.content.slice(0, 150)}...` : msg.content;

              return (
                <div
                  key={msg._id}
                  ref={(el) => (messageRefs.current[msg._id] = el)}
                  className={`flex items-start gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  onClick={() => setReplyTarget(msg)}
                >
                  {!isOwnMessage && msg.sender && (
                    <img
                      src={msg.sender.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/home/profile/${msg.sender._id}`);
                      }}
                    />
                  )}

                  <div
                    className={`px-4 py-2 rounded-lg text-sm max-w-xs break-words cursor-pointer
                      ${isOwnMessage
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                      }`}
                  >
                    {!isOwnMessage && msg.sender?.username && (
                      <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">
                        {msg.sender.username}
                      </div>
                    )}

                    {msg.replyTo && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          scrollToMessage(msg.replyTo._id);
                        }}
                        className="text-xs italic border-l-2 pl-2 mb-1 
                        border-blue-400 hover:bg-blue-100/50 
                        dark:hover:bg-blue-800/30 text-gray-700 dark:text-gray-300"
                      >
                        Replying to: {msg.replyTo.content.slice(0, 60)}
                      </div>
                    )}

                    <div>
                      {displayedContent}
                      {isLong && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(msg._id);
                          }}
                          className="ml-2 text-xs underline text-blue-600 dark:text-blue-300"
                        >
                          {showFull ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </div>

                    <div className="text-xs text-black dark:text-white mt-1">
                      {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                    </div>
                  </div>

                  {isOwnMessage && user?.avatar && (
                    <img
                      src={user.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/home/profile/${user._id}`);
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Reply Preview */}
      {replyTarget && (
        <div className="bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 px-3 py-2 border-l-4 border-blue-500 mx-4 mb-2 rounded relative">
          Replying to: <span className="italic">{replyTarget.content.slice(0, 80)}</span>
          <button
            className="absolute right-2 top-1 text-gray-500 hover:text-red-500 text-xs dark:hover:text-red-400"
            onClick={() => setReplyTarget(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button
          onClick={handleSend}
          className="shrink-0 h-fit px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Send
        </Button>
      </div>
    </Card>
  );

};

export default GroupChatView;
