'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Send, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import type {
  DataMessages as Message,
  DataMessagesPartner as ConversationPartner,
} from '@/features/messages/types/messagesTypes';
import {
  getMessagesRealtimeChannel,
  removeMessagesRealtimeChannel,
  updateMessagesReadById,
} from '@/features/messages/services/messagesServices';
import {
  useMessagesControllers,
  useMessagesPartnerControllers,
} from '@/features/messages/controllers/messagesControllers';

export default function MessagesInbox() {
  return (
    <Suspense fallback={<AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>}>
      <PesanContent />
    </Suspense>
  );
}

function PesanContent() {
  const { user, loading } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPartner, setSelectedPartner] = useState<ConversationPartner | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchMembers, setSearchMembers] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const autoOpenId = searchParams.get('to');

  const {
    fetchMessagesConversations,
    fetchMessagesThread,
    fetchMessagesMemberSearch,
    storeMessages,
    changeMessagesRead,
  } = useMessagesControllers(user?.id, selectedPartner?.id ?? null, searchMembers);
  const { fetchMessagesPartner } = useMessagesPartnerControllers(
    selectedPartner ? null : autoOpenId
  );

  const conversations = fetchMessagesConversations.data ?? [];
  const searchResults = fetchMessagesMemberSearch.data ?? [];
  const loadingMsgs = Boolean(selectedPartner) && fetchMessagesThread.isPending;
  const sending = storeMessages.isPending;

  // Realtime inserts arrive between refetches, so they are merged on top of the
  // fetched thread and de-duplicated by id.
  const mergeRealtimeMessages = () => {
    const fetched = fetchMessagesThread.data ?? [];
    const seen = new Set(fetched.map((m) => m.id));
    return [...fetched, ...realtimeMessages.filter((m) => !seen.has(m.id))];
  };

  const messages = mergeRealtimeMessages();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const loadMessages = useCallback((partner: ConversationPartner) => {
    setSelectedPartner(partner);
    setRealtimeMessages([]);
    if (user) {
      changeMessagesRead.mutate({ senderId: partner.id, recipientId: user.id });
    }
  }, [user, changeMessagesRead]);

  // Auto-open conversation from ?to=<id> query param
  useEffect(() => {
    if (!user || selectedPartner) return;
    const partner = fetchMessagesPartner.data;
    if (partner) loadMessages(partner);
  }, [user, selectedPartner, fetchMessagesPartner.data, loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = getMessagesRealtimeChannel((msg) => {
      if (msg.recipient_id !== user.id && msg.sender_id !== user.id) return;
      if (selectedPartner && (msg.sender_id === selectedPartner.id || msg.recipient_id === selectedPartner.id)) {
        setRealtimeMessages((prev) => [...prev, msg]);
        if (msg.recipient_id === user.id && !msg.read) {
          updateMessagesReadById(msg.id);
        }
      }
      fetchMessagesConversations.refetch();
    }).subscribe();
    return () => { removeMessagesRealtimeChannel(channel); };
  }, [user, selectedPartner, fetchMessagesConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const saveMessage = async () => {
    if (!user || !selectedPartner || !newMessage.trim()) return;
    try {
      await storeMessages.mutateAsync({
        sender_id: user.id,
        recipient_id: selectedPartner.id,
        body: newMessage.trim(),
      });
    } catch {
      toast.error(t('Failed to send message', 'Gagal mengirim pesan'));
      return;
    }
    setNewMessage('');
  };

  const modifySearch = (query: string) => {
    setSearchMembers(query);
  };

  const startConversation = (partner: ConversationPartner) => {
    setShowSearch(false);
    setSearchMembers('');
    loadMessages(partner);
  };

  if (loading) {
    return <AppShell><div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('Messages', 'Pesan')}</h1>
            <p className="mt-1 text-muted-foreground">{t('Chat with members, talents, and agency ops.', 'Chat dengan member, talent, dan agency ops.')}</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setShowSearch(!showSearch)}>
            <Search className="h-4 w-4" /> {t('New Chat', 'Chat Baru')}
          </Button>
        </div>

        {showSearch && (
          <div className="mb-4 rounded-lg border border-border/60 bg-card/50 p-4 backdrop-blur">
            <Input
              placeholder={t('Search members by name...', 'Cari member berdasarkan nama...')}
              value={searchMembers}
              onChange={(e) => modifySearch(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {searchResults.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => startConversation(m)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8">
                      {m.avatar_url ? <img src={m.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" /> : null}
                      <AvatarFallback>{m.full_name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{m.full_name ?? 'Unknown'}</p>
                      {m.location && <p className="text-xs text-muted-foreground">{m.location}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-0 rounded-xl border border-border/40 overflow-hidden md:grid-cols-[300px_1fr]" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Conversation list */}
          <div className="border-r border-border/40 overflow-y-auto bg-card/30">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {t('No conversations yet. Start a new chat!', 'Belum ada percakapan. Mulai chat baru!')}
              </div>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.partner.id}
                  onClick={() => loadMessages(c.partner)}
                  className={`flex w-full items-center gap-3 border-b border-border/20 p-3 text-left transition-colors hover:bg-muted/50 ${
                    selectedPartner?.id === c.partner.id ? 'bg-primary/5' : ''
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    {c.partner.avatar_url ? <img src={c.partner.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" /> : null}
                    <AvatarFallback>{c.partner.full_name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-medium">{c.partner.full_name ?? 'Unknown'}</p>
                      {c.unreadCount > 0 && <Badge className="ml-1 shrink-0 text-xs">{c.unreadCount}</Badge>}
                    </div>
                    {c.lastMessage && (
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage.body}</p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat panel */}
          <div className="flex flex-col bg-background">
            {selectedPartner ? (
              <>
                <div className="flex items-center gap-3 border-b border-border/40 p-4">
                  <button onClick={() => setSelectedPartner(null)} className="md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-9 w-9">
                    {selectedPartner.avatar_url ? <img src={selectedPartner.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" /> : null}
                    <AvatarFallback>{selectedPartner.full_name?.charAt(0) ?? '?'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{selectedPartner.full_name ?? 'Unknown'}</p>
                    {selectedPartner.location && <p className="text-xs text-muted-foreground">{selectedPartner.location}</p>}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                  ) : messages.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      {t('No messages yet. Say hello!', 'Belum ada pesan. Katakan halo!')}
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMine = m.sender_id === user?.id;
                      return (
                        <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                              isMine
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-muted rounded-bl-sm'
                            }`}
                          >
                            <p>{m.body}</p>
                            <p className={`mt-1 text-xs ${isMine ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-border/40 p-3 flex gap-2">
                  <Input
                    placeholder={t('Type a message...', 'Ketik pesan...')}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveMessage(); } }}
                    disabled={sending}
                  />
                  <Button size="icon" onClick={saveMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-sm">{t('Select a conversation to start chatting', 'Pilih percakapan untuk mulai chat')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
