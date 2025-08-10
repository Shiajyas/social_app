import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '@/utils/Socket';
import { useAuthStore } from '@/appStore/AuthStore';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';

import { useGroups } from '@/hooks/group/useGroups';

interface Message {
  senderId: string;
  content: string;
  timestamp: string;
}

const CommunityChatSection: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [warning, setWarning] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();


  useEffect(() => {
    socket.emit('joinCommunity', { communityId, userId: user?._id });

    socket.on('receiveMessage', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('moderationWarning', (warn: string) => {
      setWarning(warn);
      setTimeout(() => setWarning(''), 4000);
    });

    return () => {
      socket.emit('leaveCommunity', { communityId, userId: user?._id });
      socket.off('receiveMessage');
      socket.off('moderationWarning');
    };
  }, [communityId, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      socket.emit('sendCommunityMessage', {
        communityId,
        senderId: user?._id,
        content: input.trim(),
      });
      setInput('');
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto h-[calc(100vh-6rem)] flex flex-col rounded-xl overflow-hidden">
      <CardContent className="flex flex-col flex-grow p-4 space-y-4">
        <div className="flex-grow overflow-y-auto space-y-3 pr-1">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.senderId === user?._id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`px-4 py-2 rounded-lg text-sm ${
                  msg.senderId === user?._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {warning && (
          <div className="text-red-600 text-sm font-medium text-center">
            ⚠️ {warning}
          </div>
        )}

        <div className="mt-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow resize-none"
            placeholder="Type your message..."
          />
          <Button onClick={handleSend} className="shrink-0 h-fit px-6 py-2">
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityChatSection;