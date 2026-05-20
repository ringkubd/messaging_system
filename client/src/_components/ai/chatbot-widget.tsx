'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  'How do I apply for a scholarship?',
  'Show me upcoming events',
  'How to connect with alumni?',
  'Find jobs matching my skills',
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m the ISDB-BISEW AI assistant. Ask me anything about scholarships, events, jobs, or the platform.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    initialized.current = true;
  }, []);

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return;
    const userMsg: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await window.fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Sorry, I couldn\'t process that.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I\'m having trouble connecting. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        <MessageCircle className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-card border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center justify-between p-3 border-b bg-emerald-600 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.role === 'user'
                ? 'bg-emerald-500 text-white rounded-br-sm'
                : 'bg-muted rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {messages.length === 1 && (
          <div className="space-y-1.5 pt-2">
            <p className="text-xs text-muted-foreground px-1">Suggestions:</p>
            {suggestions.map((s) => (
              <button key={s} onClick={() => sendMessage(s)}
                className="block w-full text-left text-xs px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask anything..." className="flex-1 h-9 text-sm" disabled={loading} />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || loading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
