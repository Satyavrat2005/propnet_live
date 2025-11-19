"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  MessageCircle,
  Search,
  Phone,
  User,
  Clock,
  Send,
  MoreVertical,
  Building2,
  Plus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabaseClient";

interface ConversationSummary {
  id: string;
  type: string;
  property?: {
    id: string;
    title: string;
    location?: string | null;
  } | null;
  otherParticipant: {
    id: string;
    name: string;
    phone: string | null;
    agencyName: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface NetworkUser {
  id: string;
  name: string;
  phone: string | null;
  agencyName: string | null;
}

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorValue = (payload as { error?: unknown }).error;
    if (typeof errorValue === "string" && errorValue.trim()) {
      return errorValue;
    }
  }
  return fallback;
};

const parseJsonResponse = async <T,>(response: Response, fallbackError: string): Promise<T> => {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, fallbackError));
  }

  if (payload === null || payload === undefined) {
    throw new Error(fallbackError);
  }

  return payload as T;
};

const fetchJson = async <T,>(endpoint: string, fallbackError: string): Promise<T> => {
  const response = await apiRequest("GET", endpoint);
  return parseJsonResponse<T>(response, fallbackError);
};

export default function MessagesPage() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = user?.id ? String(user.id) : null;
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // --- Queries ---
  const conversationsQuery = useQuery<ConversationSummary[], Error>({
    queryKey: ["/api/conversations"],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => fetchJson<ConversationSummary[]>("/api/conversations", "Failed to fetch conversations"),
  });

  const networkUsersQuery = useQuery<NetworkUser[], Error>({
    queryKey: ["/api/network-users"],
    enabled: !!user,
    queryFn: async () => fetchJson<NetworkUser[]>("/api/network-users", "Failed to fetch network users"),
  });

  const messagesQuery = useQuery<ChatMessage[], Error>({
    queryKey: ["/api/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId && !!user,
    queryFn: async () => fetchJson<ChatMessage[]>(
      `/api/conversations/${selectedConversationId}/messages`,
      "Failed to fetch messages"
    ),
  });

  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data]
  );
  const networkUsers = useMemo(
    () => networkUsersQuery.data ?? [],
    [networkUsersQuery.data]
  );
  const messages = useMemo(
    () => messagesQuery.data ?? [],
    [messagesQuery.data]
  );

  const activeConversation = useMemo(() => {
    if (!selectedConversationId) return null;
    return conversations.find((conversation) => conversation.id === selectedConversationId) || null;
  }, [conversations, selectedConversationId]);

  const resetUnreadCount = useCallback((conversationId: string | null) => {
    if (!conversationId) return;
    queryClient.setQueryData<ConversationSummary[]>(["/api/conversations"], (existing = []) =>
      existing.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  }, [queryClient]);

  const findExistingConversation = useCallback(
    (participantId: string, propertyId?: string | null, type = "general") => {
      const normalizedType = (type || "general").toLowerCase();
      const normalizedPropertyId = propertyId ?? null;
      return (
        conversations.find((conversation) => {
          if (conversation.otherParticipant?.id !== participantId) return false;
          const conversationType = (conversation.type || "general").toLowerCase();
          if (conversationType !== normalizedType) return false;
          const conversationPropertyId = conversation.property?.id ?? null;
          if (conversationPropertyId !== normalizedPropertyId) return false;
          return true;
        }) || null
      );
    },
    [conversations]
  );

  // --- Mutations ---
  const createConversation = useMutation<
    ConversationSummary,
    Error,
    { participantId: string; propertyId?: string; type?: string }
  >({
    mutationFn: async ({ participantId, propertyId, type }) => {
      const res = await apiRequest("POST", "/api/conversations", { participantId, propertyId, type });
      return parseJsonResponse<ConversationSummary>(res, "Failed to create conversation");
    },
    onSuccess: (conversation: ConversationSummary) => {
      setSelectedConversationId(conversation.id);
      setShowNewChatDialog(false);
      resetUnreadCount(conversation.id);
      queryClient.setQueryData<ConversationSummary[]>(["/api/conversations"], (existing = []) => {
        if (existing.some((c) => c.id === conversation.id)) {
          return existing;
        }
        return [conversation, ...existing];
      });
      void conversationsQuery.refetch();
    },
  });

  const sendMessage = useMutation<
    ChatMessage,
    Error,
    { conversationId: string; content: string }
  >({
    mutationFn: async ({ conversationId, content }) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content });
      return parseJsonResponse<ChatMessage>(res, "Failed to send message");
    },
    onSuccess: (message) => {
      setNewMessage("");
      setChatError(null);
      resetUnreadCount(message.conversationId);
      scrollToBottom();
      queryClient.setQueryData<ChatMessage[]>(
        ["/api/conversations", message.conversationId, "messages"],
        (existing = []) => {
          if (existing.some((existingMessage) => existingMessage.id === message.id)) {
            return existing;
          }
          return [...existing, message];
        }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: (error) => {
      setChatError(error.message || "Unable to send message");
    },
  });

  // --- Derived data ---
  const filteredConversations = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return conversations.filter((conversation) => {
      const title = (conversation.property?.title || "General Chat").toLowerCase();
      const participantName = conversation.otherParticipant?.name?.toLowerCase() || "";
      return title.includes(query) || participantName.includes(query);
    });
  }, [conversations, searchQuery]);

  const filteredNetworkUsers = useMemo(() => {
    const query = userSearchQuery.toLowerCase();
    return networkUsers.filter((networkUser) => {
      const name = networkUser.name?.toLowerCase() || "";
      const agencyName = networkUser.agencyName?.toLowerCase() || "";
      return name.includes(query) || agencyName.includes(query);
    });
  }, [networkUsers, userSearchQuery]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`messages-stream-${user.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const record = payload.new as {
          id: string;
          conversation_id: string;
          sender_id: string;
          content: string;
          created_at: string;
        };

        if (!record) return;

        const isOwnMessage = currentUserId && record.sender_id === currentUserId;
        const isActiveConversation = activeConversation?.id === record.conversation_id;

        if (isActiveConversation) {
          queryClient.setQueryData<ChatMessage[]>(
            ["/api/conversations", activeConversation.id, "messages"],
            (existing = []) => {
              if (existing.some((message) => message.id === record.id)) {
                return existing;
              }
              return [
                ...existing,
                {
                  id: record.id,
                  conversationId: record.conversation_id,
                  senderId: record.sender_id,
                  content: record.content,
                  createdAt: record.created_at,
                },
              ];
            }
          );
          scrollToBottom();
          resetUnreadCount(record.conversation_id);
        }

        queryClient.setQueryData<ConversationSummary[]>(["/api/conversations"], (existing = []) => {
          let found = false;
          const updated = existing.map((conversation) => {
            if (conversation.id !== record.conversation_id) {
              return conversation;
            }
            found = true;
            const nextUnread = isActiveConversation || isOwnMessage
              ? 0
              : (conversation.unreadCount || 0) + 1;
            return {
              ...conversation,
              unreadCount: nextUnread,
              lastMessage: {
                id: record.id,
                content: record.content,
                senderId: record.sender_id,
                createdAt: record.created_at,
              },
              lastMessageAt: record.created_at,
            };
          });
          return found ? updated : existing;
        });

        if (!isActiveConversation && !isOwnMessage) {
          // Ensure badges stay accurate even if cache missed
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        }

      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeConversation?.id, currentUserId, queryClient, resetUnreadCount, scrollToBottom]);

  useEffect(() => {
    if (!activeConversation || messages.length === 0) return;
    scrollToBottom();
  }, [messages, activeConversation, scrollToBottom]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="p-8 text-center space-y-3">
          <MessageCircle className="mx-auto text-neutral-400" size={48} />
          <p className="text-sm text-neutral-600">Please sign in to view your messages.</p>
        </Card>
      </div>
    );
  }

  // --- Handlers ---
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    resetUnreadCount(conversationId);
  };

  const startConversation = (participantId: string, propertyId?: string | null, type = "general") => {
    const existing = findExistingConversation(participantId, propertyId, type);
    if (existing) {
      handleSelectConversation(existing.id);
      setShowNewChatDialog(false);
      return;
    }
    createConversation.mutate({ participantId, propertyId: propertyId ?? undefined, type });
  };

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversation || sendMessage.isPending) return;
    sendMessage.mutate({
      conversationId: activeConversation.id,
      content: newMessage.trim(),
    });
  };
  const messagesQueryError = messagesQuery.error ?? null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case "inquiry":
        return "bg-blue-100 text-blue-800";
      case "colisting":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // --- Chat view ---
  if (activeConversation) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConversationId(null)}>←</Button>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">
                {activeConversation.otherParticipant?.name || "Unknown user"}
              </h2>
              <p className="text-sm text-neutral-600">
                {activeConversation.property?.title || "General Chat"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm"><Phone size={16} /></Button>
            <Button variant="ghost" size="sm"><MoreVertical size={16} /></Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
          {messagesQuery.isLoading ? (
            <p className="text-sm text-neutral-500">Loading messages...</p>
          ) : messagesQueryError ? (
            <p className="text-sm text-red-500">{messagesQueryError.message}</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-neutral-500">No messages yet. Say hello!</p>
          ) : (
            <>
              {messages.map((msg: ChatMessage) => (
                <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                      msg.senderId === currentUserId
                        ? "bg-neutral-900 text-white"
                        : "bg-white border border-neutral-200 text-neutral-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-normal wrap-break-word">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.senderId === currentUserId ? "text-white/70" : "text-neutral-500"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-neutral-200 px-6 py-4">
          <div className="flex flex-col gap-2">
            {chatError ? <p className="text-xs text-red-500">{chatError}</p> : null}
            <div className="flex items-center space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (chatError) {
                    setChatError(null);
                  }
                }}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={sendMessage.isPending}
              />
              <Button onClick={handleSend} disabled={!newMessage.trim() || sendMessage.isPending}>
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Conversations List ---
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
          <p className="text-sm text-neutral-600">{filteredConversations.length} conversations</p>
        </div>
        <Dialog open={showNewChatDialog} onOpenChange={(o) => { setShowNewChatDialog(o); setUserSearchQuery(""); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-1" /> New Chat
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
            <DialogHeader><DialogTitle>Start New Conversation</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <Input
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search network users..."
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredNetworkUsers.map((u: NetworkUser) => (
                  <Card key={u.id} className="p-3 cursor-pointer hover:bg-neutral-50" onClick={() => startConversation(u.id)}>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User size={18} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-neutral-900">{u.name}</p>
                        <p className="text-xs text-neutral-600">{u.agencyName}</p>
                        {u.phone && <p className="text-xs text-neutral-500">{u.phone}</p>}
                      </div>
                      <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Verified</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search bar */}
      <div className="bg-white border-b border-neutral-200 px-6 py-3 relative">
        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search conversations..."
          className="pl-10"
        />
      </div>

      {/* Conversation list */}
      <div className="px-6 py-4">
        {filteredConversations.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageCircle className="mx-auto text-neutral-400 mb-4" size={48} />
            <h3 className="font-semibold text-neutral-900 mb-2">No messages yet</h3>
            <p className="text-neutral-600 text-sm mb-4">
              Start conversations with property inquiries and co-listing requests
            </p>
            <Button variant="outline"><Building2 size={16} className="mr-2" />Browse Properties</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleSelectConversation(c.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-neutral-900 text-sm truncate">
                          {c.otherParticipant?.name || "Unknown User"}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {c.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white text-xs">{c.unreadCount}</Badge>
                          )}
                          <Badge className={`text-xs ${getTypeColor(c.type)}`}>{c.type}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-600 mb-2">{c.property?.title || "General Chat"}</p>
                      <p className="text-sm text-neutral-700 truncate mb-1">{c.lastMessage?.content || "Start a conversation..."}</p>
                      <div className="flex items-center text-xs text-neutral-500">
                        <Clock size={12} className="mr-1" />
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : "Just now"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}