"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';
import { apiClient } from '@/services/api/client';

/**
 * CADoubtChat — Floating AI doubt-clearing chat per CA item.
 * Context-aware: AI knows which article the student is asking about.
 *
 * Enhancement 4: AI Q&A Doubt Clearing
 */

interface Message {
  role: 'student' | 'ai';
  content: string;
  timestamp: string;
}

interface CADoubtChatProps {
  itemId: number;
  itemTitle: string;
}

const unwrap = <T,>(data: unknown): T => {
  const record = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {});
  return (record.data ?? record) as T;
};

export function CADoubtChat({ itemId, itemTitle }: CADoubtChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing chat
  useEffect(() => {
    if (!isOpen) return;
    apiClient.get(`current-affairs/items/${itemId}/doubt-chat`)
      .then(res => {
        const data = unwrap<{ messages: Message[] }>(res.data);
        setMessages(data.messages || []);
      })
      .catch(() => {});
  }, [isOpen, itemId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    // Optimistic add
    setMessages(prev => [...prev, { role: 'student', content: msg, timestamp: new Date().toISOString() }]);

    try {
      const res = await apiClient.post(`current-affairs/items/${itemId}/doubt-chat`, { message: msg });
      const data = unwrap<{ messages: Message[] }>(res.data);
      setMessages(data.messages);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: 'Sorry, I couldn\'t process that. Please try again.', timestamp: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75] text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs font-black">Ask a Doubt</span>
        </button>
      )}

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-h-[500px] rounded-2xl border border-[#dcd5c7] bg-white shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#dcd5c7] bg-gradient-to-r from-[#1a3a2a] to-[#1d9e75]">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-white" />
                <span className="text-xs font-black text-white">AI Doubt Chat</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Context badge */}
            <div className="px-4 py-2 bg-[#e7f5ee] border-b border-[#b9d9cd]">
              <p className="text-[9px] text-[#085041] font-semibold truncate">About: {itemTitle}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-[300px]">
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Bot className="h-8 w-8 text-[#dcd5c7] mx-auto" />
                  <p className="text-xs text-[#5d675f] mt-2">Ask any doubt about this news item</p>
                  <p className="text-[10px] text-[#5d675f] mt-1">e.g., "Why is this important for GS3?"</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'student' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && <Bot className="h-5 w-5 text-[#1d9e75] flex-shrink-0 mt-1" />}
                  <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs ${
                    msg.role === 'student'
                      ? 'bg-[#1a3a2a] text-white rounded-br-sm'
                      : 'bg-[#f7f4ee] text-[#1f2e26] rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                  {msg.role === 'student' && <User className="h-5 w-5 text-[#5d675f] flex-shrink-0 mt-1" />}
                </div>
              ))}
              {sending && (
                <div className="flex gap-2">
                  <Bot className="h-5 w-5 text-[#1d9e75] flex-shrink-0 mt-1" />
                  <div className="bg-[#f7f4ee] rounded-xl px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1d9e75] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-[#dcd5c7]">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your doubt..."
                  className="flex-1 rounded-lg border border-[#dcd5c7] px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1d9e75]/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="rounded-lg bg-[#1d9e75] p-2 text-white disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CADoubtChat;
