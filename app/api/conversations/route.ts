import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getSessionUser } from "@/lib/auth/getSessionUser";

// Service role client for privileged operations (never expose to frontend)
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type ConversationRow = {
  id: string;
  type: string | null;
  property_id: string | null;
  created_at: string;
  updated_at: string | null;
};

type ParticipantProfile = {
  id: string;
  name: string | null;
  phone: string | null;
  agency_name: string | null;
};

type ParticipantRow = {
  conversation_id: string;
  profile: ParticipantProfile | ParticipantProfile[] | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function asSingleProfile(profile: ParticipantRow["profile"]): ParticipantProfile | null {
  if (!profile) return null;
  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

async function fetchConversationPayload(conversationIds: string[], currentUserId: string) {
  if (conversationIds.length === 0) {
    return [];
  }

  const [{ data: conversationRows, error: conversationsError }, { data: participantRows, error: participantsError }, { data: messageRows, error: messagesError }] = await Promise.all([
    serviceSupabase
      .from("conversations")
      .select("id, type, property_id, created_at, updated_at")
      .in("id", conversationIds),
    serviceSupabase
      .from("conversation_participants")
      .select(
        "conversation_id, profile:profiles(id, name, phone, agency_name)"
      )
      .in("conversation_id", conversationIds),
    serviceSupabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: false }),
  ]);

  if (conversationsError || participantsError || messagesError) {
    throw new Error(
      conversationsError?.message || participantsError?.message || messagesError?.message || "Failed to load conversations"
    );
  }

  const propertyIds = (conversationRows || [])
    .map((row) => row.property_id)
    .filter((value): value is string => Boolean(value));

  const propertyMap = new Map<string, { id: string; title: string; location: string | null }>();
  if (propertyIds.length > 0) {
    const { data: propertyRows, error: propertyError } = await serviceSupabase
      .from("properties")
      .select("property_id, property_title, location")
      .in("property_id", propertyIds);

    if (propertyError) {
      throw new Error(propertyError.message);
    }

    (propertyRows || []).forEach((property) => {
      propertyMap.set(property.property_id, {
        id: property.property_id,
        title: property.property_title || "Property",
        location: property.location || null,
      });
    });
  }

  const latestMessageByConversation = new Map<string, MessageRow>();
  (messageRows || []).forEach((row) => {
    if (!latestMessageByConversation.has(row.conversation_id)) {
      latestMessageByConversation.set(row.conversation_id, row);
    }
  });

  return (conversationRows || []).map((conversation: ConversationRow) => {
    const otherParticipant = (participantRows || [])
      .filter((participant: ParticipantRow) => participant.conversation_id === conversation.id)
      .map((participant) => asSingleProfile(participant.profile))
      .find((profile) => profile && profile.id !== currentUserId) || null;

    const latestMessage = latestMessageByConversation.get(conversation.id) || null;

    return {
      id: conversation.id,
      type: conversation.type || "general",
      property: conversation.property_id ? propertyMap.get(conversation.property_id) || null : null,
      otherParticipant: otherParticipant
        ? {
            id: otherParticipant.id,
            name: otherParticipant.name || "Unknown user",
            phone: otherParticipant.phone,
            agencyName: otherParticipant.agency_name,
          }
        : null,
      lastMessage: latestMessage
        ? {
            id: latestMessage.id,
            content: latestMessage.content,
            senderId: latestMessage.sender_id,
            createdAt: latestMessage.created_at,
          }
        : null,
      lastMessageAt: latestMessage?.created_at || conversation.updated_at || conversation.created_at,
      unreadCount: 0,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: participationRows, error } = await serviceSupabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", session.sub);

    if (error) {
      console.error("[GET /api/conversations] participation error", error);
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

    const conversationIds = (participationRows || []).map((row) => row.conversation_id);
    if (conversationIds.length === 0) {
      return NextResponse.json([]);
    }

    const payload = await fetchConversationPayload(conversationIds, session.sub);
    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[GET /api/conversations] unexpected", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session?.sub) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const participantId: string | undefined = body?.participantId;
    const propertyId: string | null = body?.propertyId || null;
    const type: string = body?.type || "general";

    if (!participantId) {
      return NextResponse.json({ error: "participantId is required" }, { status: 400 });
    }

    if (participantId === session.sub) {
      return NextResponse.json({ error: "Cannot start a conversation with yourself" }, { status: 400 });
    }

    const { data: participantProfile, error: participantLookupError } = await serviceSupabase
      .from("profiles")
      .select("id")
      .eq("id", participantId)
      .single();

    if (participantLookupError) {
      console.error("[POST /api/conversations] participant lookup failed", participantLookupError, {
        participantId,
      });
      return NextResponse.json({ error: "Failed to verify participant" }, { status: 500 });
    }

    if (!participantProfile) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    const { data: userConversationRows, error: listError } = await serviceSupabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", session.sub);

    if (listError) {
      console.error("[POST /api/conversations] unable to list user conversations", listError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    const existingConversationIds = (userConversationRows || []).map((row) => row.conversation_id);
    let existingConversationId: string | null = null;

    if (existingConversationIds.length > 0) {
      const { data: sharedConversations } = await serviceSupabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", participantId)
        .in("conversation_id", existingConversationIds);

      existingConversationId = sharedConversations?.[0]?.conversation_id || null;
    }

    if (existingConversationId) {
      const payload = await fetchConversationPayload([existingConversationId], session.sub);
      const existing = payload?.[0];
      if (!existing) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json(existing, { status: 200 });
    }

    const { data: newConversation, error: insertConversationError } = await serviceSupabase
      .from("conversations")
      .insert({ type, property_id: propertyId })
      .select("id")
      .single();

    if (insertConversationError || !newConversation) {
      console.error("[POST /api/conversations] create conversation failed", insertConversationError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    const participantsPayload = [
      { conversation_id: newConversation.id, profile_id: session.sub },
      { conversation_id: newConversation.id, profile_id: participantId },
    ];

    // Use service role for privileged insert
    const { error: participantsInsertError } = await serviceSupabase
      .from("conversation_participants")
      .insert(participantsPayload);

    if (participantsInsertError) {
      console.error("[POST /api/conversations] insert participants failed", participantsInsertError);
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    const payload = await fetchConversationPayload([newConversation.id], session.sub);
    const createdConversation = payload?.[0];
    if (!createdConversation) {
      return NextResponse.json({ error: "Conversation payload missing" }, { status: 500 });
    }
    return NextResponse.json(createdConversation, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[POST /api/conversations] unexpected", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
