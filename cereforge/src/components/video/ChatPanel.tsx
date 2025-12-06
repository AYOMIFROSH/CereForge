// src/components/video/ChatPanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Paperclip } from 'lucide-react';
import { ChatMessage } from '@/types/video.types';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  messages,
  onSendMessage 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-gray-900 shadow-2xl border-l border-gray-700 flex flex-col z-50 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div>
          <h3 className="text-white font-semibold text-lg">Chat</h3>
          <p className="text-gray-400 text-xs">{messages.length} messages</p>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700"
          aria-label="Close chat"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">No messages yet. Start chatting!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
                msg.type === 'system' 
                  ? 'bg-blue-900/30 border border-blue-700/50' 
                  : 'bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-blue-400 text-sm font-medium">
                  {msg.userName}
                </span>
                <span className="text-gray-500 text-xs">
                  {msg.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
              <p className="text-white text-sm break-words">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-end space-x-2">
          {/* File Attach Button */}
          <button 
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message Input */}
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              maxLength={500}
            />
          </div>

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`p-2 rounded-lg font-medium transition-all ${
              newMessage.trim()
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Character Count */}
        <div className="mt-2 text-right">
          <span className="text-xs text-gray-500">
            {newMessage.length}/500
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;