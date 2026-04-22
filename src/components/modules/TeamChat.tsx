import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Users, Hash, Plus, X, Search, Smile, Paperclip, Pin, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../lib/auth-storage';
import { toast } from 'sonner';
import { EmptyState } from '../ui/EmptyState';
import { ModuleBreadcrumbs } from '../ui/Breadcrumbs';

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  content: string;
  created_at: string;
  pinned: boolean;
}

interface Channel {
  id: string;
  name: string;
  description: string;
  member_count: number;
  created_at: string;
}

export default function TeamChat() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeChannel) {
      loadMessages(activeChannel.id);
      startPolling(activeChannel.id);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setOnlineUsers(prev => [...prev, user?.name || 'You']);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'collaboration' && data.event === 'chat_message') {
          setMessages(prev => {
            if (prev.some(m => m.id === data.payload.id)) return prev;
            return [...prev, data.payload];
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      setOnlineUsers(prev => prev.filter(u => u !== (user?.name || 'You')));
    };

    return () => {
      ws.close();
    };
  }, [user]);

  async function loadChannels() {
    try {
      const res = await fetch(`${API_BASE}/chat/channels`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (data.length > 0 && !activeChannel) {
          setActiveChannel(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load channels:', err);
    }
  }

  async function loadMessages(channelId: string) {
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${channelId}/messages`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }

  function startPolling(channelId: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => loadMessages(channelId), 3000);
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !activeChannel || !user) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'collaboration',
            event: 'chat_message',
            payload: { ...msg, user_name: user.name, user_role: user.role },
          }));
        }
      } else {
        toast.error('Failed to send message');
      }
    } catch {
      toast.error('Failed to send message');
    }
  }

  async function handleCreateChannel() {
    if (!newChannelName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newChannelName.trim().toLowerCase().replace(/\s+/g, '-'),
          description: newChannelDesc,
        }),
      });
      if (res.ok) {
        const channel = await res.json();
        setChannels(prev => [...prev, channel]);
        setActiveChannel(channel);
        setShowCreateChannel(false);
        setNewChannelName('');
        setNewChannelDesc('');
        toast.success(`Channel #${channel.name} created`);
      } else {
        toast.error('Failed to create channel');
      }
    } catch {
      toast.error('Failed to create channel');
    }
  }

  async function handleDeleteMessage(messageId: string) {
    if (!activeChannel) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${activeChannel.id}/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        toast.success('Message deleted');
      }
    } catch {
      toast.error('Failed to delete message');
    }
  }

  async function handlePinMessage(messageId: string) {
    if (!activeChannel) return;
    try {
      const res = await fetch(`${API_BASE}/chat/channels/${activeChannel.id}/messages/${messageId}/pin`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (res.ok) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, pinned: true } : m));
        toast.success('Message pinned');
      }
    } catch {
      toast.error('Failed to pin message');
    }
  }

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()) || m.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const pinnedMessages = messages.filter(m => m.pinned);

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
  }

  return (
    <>
      <ModuleBreadcrumbs currentModule="team-chat" onNavigate={() => {}} />
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Channels</h3>
              <button
                onClick={() => setShowCreateChannel(true)}
                className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-800 rounded-md">
              <Search size={14} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeChannel?.id === ch.id
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Hash size={16} />
                <span className="truncate">{ch.name}</span>
                {ch.member_count > 0 && (
                  <span className="ml-auto text-xs text-gray-600">{ch.member_count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Users size={14} />
              <span>{onlineUsers.length} online</span>
            </div>
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {activeChannel ? (
            <>
              {/* Channel header */}
              <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Hash size={18} className="text-gray-500" />
                    {activeChannel.name}
                  </h2>
                  {activeChannel.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{activeChannel.description}</p>
                  )}
                </div>
              </div>

              {/* Pinned messages */}
              {pinnedMessages.length > 0 && (
                <div className="px-6 py-2 bg-amber-500/5 border-b border-amber-500/20">
                  <div className="flex items-center gap-2 text-amber-400 text-xs mb-1">
                    <Pin size={12} />
                    <span className="font-semibold">Pinned Messages</span>
                  </div>
                  {pinnedMessages.map(m => (
                    <p key={m.id} className="text-xs text-gray-400 truncate">
                      <span className="text-gray-300">{m.user_name}:</span> {m.content}
                    </p>
                  ))}
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {filteredMessages.length === 0 ? (
                  <EmptyState
                    icon={Hash}
                    title={searchQuery ? 'No messages match your search' : 'No messages yet'}
                    description={searchQuery ? 'Try a different search term' : 'Start the conversation in this channel'}
                    variant="default"
                  />
                ) : (
                  (() => {
                    let lastDate = '';
                    return filteredMessages.map(msg => {
                      const msgDate = formatDate(msg.created_at);
                      const showDate = msgDate !== lastDate;
                      lastDate = msgDate;
                      const isOwn = msg.user_name === user?.name;
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex items-center gap-3 my-4">
                              <div className="flex-1 h-px bg-gray-800" />
                              <span className="text-xs text-gray-500 font-medium">{msgDate}</span>
                              <div className="flex-1 h-px bg-gray-800" />
                            </div>
                          )}
                          <div className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
                              {msg.user_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white">{msg.user_name}</span>
                                <span className="text-xs text-gray-600">{formatTime(msg.created_at)}</span>
                                {msg.pinned && <Pin size={10} className="text-amber-400" />}
                              </div>
                              <div className={`px-4 py-2 rounded-lg text-sm ${
                                isOwn
                                  ? 'bg-amber-500/10 text-amber-100 rounded-tr-none'
                                  : 'bg-gray-800 text-gray-200 rounded-tl-none'
                              }`}>
                                {msg.content}
                              </div>
                              <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <button
                                  onClick={() => handlePinMessage(msg.id)}
                                  className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-amber-400"
                                  title="Pin"
                                >
                                  <Pin size={12} />
                                </button>
                                {isOwn && (
                                  <button
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-red-400"
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-6 py-4 border-t border-gray-800">
                <div className="flex items-end gap-3">
                  <button className="p-2 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors">
                    <Paperclip size={18} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message #${activeChannel.name}`}
                      rows={1}
                      className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm outline-none resize-none focus:ring-1 focus:ring-amber-500/50"
                    />
                    <button className="absolute right-2 bottom-2 p-1 hover:bg-gray-700 rounded text-gray-500 hover:text-white">
                      <Smile size={16} />
                    </button>
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Hash}
                title="No channel selected"
                description="Select a channel from the sidebar or create a new one"
                variant="default"
              />
            </div>
          )}
        </div>

        {/* Create channel modal */}
        {showCreateChannel && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Create Channel</h3>
                <button onClick={() => setShowCreateChannel(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Channel Name</label>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-gray-500" />
                    <input
                      type="text"
                      value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                      placeholder="general"
                      className="flex-1 bg-gray-800 text-white rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-400 text-xs mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newChannelDesc}
                    onChange={e => setNewChannelDesc(e.target.value)}
                    placeholder="What is this channel about?"
                    className="w-full bg-gray-800 text-white rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowCreateChannel(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">
                  Cancel
                </button>
                <button
                  onClick={handleCreateChannel}
                  disabled={!newChannelName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-md text-sm font-medium"
                >
                  Create Channel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
