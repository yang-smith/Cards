import React, { useState, useRef, useEffect } from 'react';
import { DraggableContainer } from '../containers/DraggableContainer';
import { createChatStream } from '../../api/chat';
import { useCardStore } from '../../stores/cardStore';
import { createAtomicCardsPrompt } from '../../prompt/prompt';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatCardProps {
  id: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export function ChatCard({ 
  id, 
  initialPosition = { x: 200, y: 200 },
  initialSize = { width: 400, height: 500 }
}: ChatCardProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const getCard = useCardStore(state => state.getCard);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getMarkdownContent = (markdownId: string) => {
    const card = getCard(markdownId);
    if (card?.type === 'markdown') {
      return card.content;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const eventSource = createChatStream(userMessage);
      let assistantMessage = '';

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          setIsLoading(false);
          return;
        }

        try {
          const data = JSON.parse(event.data);
          if (data.content) {
            assistantMessage += data.content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage?.role === 'assistant') {
                lastMessage.content = assistantMessage;
                return [...newMessages];
              } else {
                return [...newMessages, { role: 'assistant', content: assistantMessage }];
              }
            });
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Chat Error:', error);
      setIsLoading(false);
    }
  };

  const handleAtomize = async (markdownId: string) => {
    const card = getCard(markdownId);
    if (card?.type === 'markdown' && card.content) {
      const prompt = createAtomicCardsPrompt(card.content);
      setInput(prompt);
    }
  };

  return (
    <DraggableContainer
      id={id}
      title="Chat"
      initialPosition={initialPosition}
      initialSize={initialSize}
      type="chat"
    >
      <div className="flex flex-col h-full">
        <div className="drag-handle h-6 bg-gray-100 rounded-t-lg cursor-move flex items-center justify-between px-2">
          <span>⋮⋮</span>
          <button
            onClick={() => handleAtomize('editor-1')}
            className="text-xs text-gray-600 hover:text-blue-500"
          >
            Atomize
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '...' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </DraggableContainer>
  );
} 