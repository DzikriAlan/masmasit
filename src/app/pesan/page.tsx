'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Send, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/components/auth-provider';
import { useLang } from '@/components/language-provider';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

interface ConversationPartner {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
}

interface Conversation {
  partner: ConversationPartner;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function PesanPage() {
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ConversationPartner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchMembers, setSearchMembers] = useState('');
  const [searchResults, setSearchResults] = useState<ConversationPartner[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data: sentMsgs } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });
    const { data: recvMsgs } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    const allMsgs = [...(sentMsgs ?? []), ...(recvMsgs ?? [])] as Message[];
    const partnerIds = new Set<string>();
    allMsgs.forEach((m) => {
      if (m.sender_id !== user.id) partnerIds.add(m.sender_id);
      if (m.recipient_id !== user.id) partnerIds.add(m.recipient_id);
    });

    const convos: Conversation[] = [];
    for (const pid of Array.from(partnerIds)) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, location')
        .eq('id', pid)
        .maybeSingle();
      if (!profile) continue;
      const thread = allMsgs
        .filter((m) => m.sender_id === pid || m.recipient_id === pid)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = (recvMsgs as Message[])?.filter((m) => m.sender_id === pid && !m.read).length ?? 0;
      convos.push({
        partner: profile as ConversationPartner,
        lastMessage: thread[0] ?? null,
        unreadCount: unread,
      });
    }
    convos.sort((a, b) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
      const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
      return bTime - aTime;
    });
    setConversations(convos);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = useCallback(async (partner: ConversationPartner) => {
    if (!user) return;
    setLoadingMsgs(true);
    setSelectedPartner(partner);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${partner.id}),and(sender_id.eq.${partner.id},recipient_id.eq.${user.id}))`)
      .order('created_at', { ascending: true });
    setMessages((data as Message[]) ?? []);
    await supabase.from('messages').update({ read: true }).eq('sender_id', partner.id).eq('recipient_id', user.id).eq('read', false);
    setLoadingMsgs(false);
    loadConversations();
  }, [user, loadConversations]);

  // Auto-open conversation from ?to=<id> query param
  useEffect(() => {
    if (!user) return;
    const toId = searchParams.get('to');
    if (!toId) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, location')
        .eq('id', toId)
        .maybeSingle();
      if (profile) {
        loadMessages(profile as ConversationPartner);
      }
    })();
  }, [user, searchParams, loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (msg.recipient_id === user.id || msg.sender_id === user.id) {
          if (selectedPartner && (msg.sender_id === selectedPartner.id || msg.recipient_id === selectedPartner.id)) {
            setMessages((prev) => [...prev, msg]);
            if (msg.recipient_id === user.id && !msg.read) {
              supabase.from('messages').update({ read: true }).eq('id', msg.id);
            }
          }
          loadConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedPartner, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!user || !selectedPartner || !newMessage.trim()) return;
    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      recipient_id: selectedPartner.id,
      body: newMessage.trim(),
    });
    setSending(false);
    if (error) { toast.error(t('Failed to send message', 'Gagal mengirim pesan')); return; }
    setNewMessage('');
  };

  const handleSearch = async (query: string) => {
    setSearchMembers(query);
    if (query.trim().length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, location')
      .ilike('full_name', `%${query.trim()}%`)
      .neq('id', user?.id ?? '')
      .limit(10);
    setSearchResults((data as ConversationPartner[]) ?? []);
  };

  const startConversation = (partner: ConversationPartner) => {
    setShowSearch(false);
    setSearchMembers('');
    setSearchResults([]);
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
              onChange={(e) => handleSearch(e.target.value)}
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
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    disabled={sending}
                  />
                  <Button size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
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
