"use client";

import { useState } from "react";
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

// Optional: remove or replace with your auth context
// import { useAuth } from "@/hooks/use-auth";

interface Conversation {
  id: number;
  propertyId: number;
  propertyTitle: string;
  otherUser: {
    id: number;
    name: string;
    phone: string;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: "inquiry" | "colisting" | "general";
}

export default function MessagesPage() {
  // Optional if you don’t have an auth hook
  const user = { id: 1, name: "Demo User" };

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // --- Queries ---
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["/api/conversations"],
  });

  const { data: networkUsers = [] } = useQuery({
    queryKey: ["/api/network-users"],
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation,
  });

  // --- Mutations ---
  const createConversation = useMutation({
    mutationFn: async ({ participantId, propertyId, type }: { participantId: number; propertyId?: number; type?: string }) => {
      const res = await apiRequest("POST", "/api/conversations", { participantId, propertyId, type });
      return res.json();
    },
    onSuccess: (conversation) => {
      setSelectedConversation(conversation);
      setShowNewChatDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      refetchConversations();
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/conversations/${conversationId}/messages`, { content });
      return res.json();
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  // --- Derived data ---
  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter((c: any) =>
        (c.property?.title || "General Chat").toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredNetworkUsers = Array.isArray(networkUsers)
    ? networkUsers.filter((u: any) =>
        u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.agencyName?.toLowerCase().includes(userSearchQuery.toLowerCase())
      )
    : [];

  // --- Handlers ---
  const startConversation = (participantId: number) => {
    createConversation.mutate({ participantId, type: "general" });
  };

  const handleSend = () => {
    if (newMessage.trim() && selectedConversation) {
      sendMessage.mutate({
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
      });
    }
  };

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
  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedConversation(null)}>←</Button>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900">
                {selectedConversation.otherParticipant?.name}
              </h2>
              <p className="text-sm text-neutral-600">
                {selectedConversation.property?.title || "General Chat"}
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
          {Array.isArray(messages) &&
            messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === user.id ? "bg-primary text-white" : "bg-white border border-neutral-200"
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.senderId === user.id ? "text-primary-200" : "text-neutral-500"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* Input */}
        <div className="bg-white border-t border-neutral-200 px-6 py-4 flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()}>
            <Send size={16} />
          </Button>
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
          <DialogContent>
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
                {filteredNetworkUsers.map((u: any) => (
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
            {filteredConversations.map((c: any) => (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedConversation(c)}>
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
