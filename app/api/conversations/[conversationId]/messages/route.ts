import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserIdFromSession } from "@/lib/auth/session";

// Service role client stays on the server, never expose to the browser
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

async function ensureParticipant(conversationId: string, profileId: string) {
  const { data, error } = await serviceSupabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return false;
  }

  return true;
}

async function broadcastConversationMessage(message: MessageRow) {
  try {
    const channel = serviceSupabase.channel(`conversation-stream-${message.conversation_id}`);
    await channel.subscribe();
    await channel.send({
      type: "broadcast",
      event: "message",
      payload: { message },
    });
    await channel.unsubscribe();
  } catch (err) {
    console.error("[messages broadcast]", err);
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const isMember = await ensureParticipant(conversationId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { data, error } = await serviceSupabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/conversations/:id/messages]", error);
      return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
    }

    const payload = (data || []).map((message) => ({
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      content: message.content,
      createdAt: message.created_at,
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[GET /api/conversations/:id/messages] unexpected", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = getUserIdFromSession(session);
    if (!userId) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { conversationId } = await context.params;
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const body = await req.json();
    const content: string | undefined = body?.content;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const isMember = await ensureParticipant(conversationId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const messagePayload = {
      conversation_id: conversationId,
      sender_id: userId,
      content: content.trim(),
    };

    const { data, error } = await serviceSupabase
      .from("messages")
      .insert(messagePayload)
      .select("id, conversation_id, sender_id, content, created_at")
      .single();

    if (error || !data) {
      console.error("[POST /api/conversations/:id/messages]", error);
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    await serviceSupabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    await broadcastConversationMessage(data as MessageRow);

    return NextResponse.json(
      {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[POST /api/conversations/:id/messages] unexpected", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
