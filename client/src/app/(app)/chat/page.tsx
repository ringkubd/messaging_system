'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/_lib/api-client';
import { getInitials, formatTimeAgo } from '@/_lib/utils';
import { EmptyState } from '@/_components/shared/empty-state';
import { MessageCircle, Send, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('chats');
  const [activeConv, setActiveConv] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiClient.get('/conversations').then(r => r.data),
  });

  const { data: groups } = useQuery({
    queryKey: ['chat-groups'],
    queryFn: () => apiClient.get('/groups').then(r => r.data),
  });

  const queryClient = useQueryClient();
  const sendMsg = useMutation({
    mutationFn: (body: string) => apiClient.post(`/conversations/${activeConv}/messages`, { body }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['messages', activeConv] }); setMessage(''); },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', activeConv],
    queryFn: () => apiClient.get(`/conversations/${activeConv}/messages`).then(r => r.data),
    enabled: !!activeConv,
  });

  const convs = Array.isArray(conversations?.data) ? conversations.data : [];

  return (
    <div className="flex h-[calc(100vh-8rem)] -m-6">
      <div className="w-80 border-r bg-card flex flex-col shrink-0">
        <div className="p-3 border-b">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1">Chats</TabsTrigger>
              <TabsTrigger value="groups" className="flex-1">Groups</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="Search conversations..." />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {activeTab === 'chats' ? convs.map((conv: any) => {
            const otherUser = conv.users?.find((u: any) => u.id !== 1) || conv.users?.[0];
            return (
              <button key={conv.id} onClick={() => setActiveConv(conv.id)}
                className={`flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors ${activeConv === conv.id ? 'bg-muted' : ''}`}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarFallback className="text-xs">{getInitials(otherUser?.name || '')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{otherUser?.name || 'Unknown'}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{conv.last_message_at ? formatTimeAgo(conv.last_message_at) : ''}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message?.body || 'No messages yet'}</p>
                </div>
              </button>
            );
          }) : <div className="p-4 text-center text-sm text-muted-foreground">No groups yet</div>}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Array.isArray(messages?.data) && messages.data.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.sender_id === 1 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${msg.sender_id === 1 ? 'bg-emerald-500 text-white rounded-br-sm' : 'bg-muted rounded-bl-sm'}`}>
                    <p className="text-sm">{msg.body}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === 1 ? 'text-white/70' : 'text-muted-foreground'}`}>{formatTimeAgo(msg.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t bg-card">
              <form onSubmit={(e) => { e.preventDefault(); if (message.trim()) sendMsg.mutate(message); }} className="flex gap-2">
                <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="icon" disabled={!message.trim() || sendMsg.isPending}><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          </>
        ) : (
          <EmptyState icon={<MessageCircle className="w-6 h-6" />} title="Select a conversation" description="Choose a chat from the sidebar to start messaging." />
        )}
      </div>
    </div>
  );
}
