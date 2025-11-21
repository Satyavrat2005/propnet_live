// app/api/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySession } from "@/lib/auth/session";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function readSessionCookie(req: NextRequest) {
  const cookie = req.headers.get("cookie") || "";
  const part = cookie.split(";").find((c) => c.trim().startsWith("session="));
  if (!part) return null;
  const token = part.split("=")[1];
  return token || null;
}

export async function GET(req: NextRequest) {
  try {
    // Get logged-in user ID
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    // Support both old format (id) and new format (sub)
    const userId = (payload as any).sub || (payload as any).id;

    // Only return tasks for the logged-in user
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get logged-in user ID
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    // Support both old format (id) and new format (sub)
    const userId = (payload as any).sub || (payload as any).id;

    const body = await req.json();
    const { task_text } = body;
    if (!task_text) return NextResponse.json({ error: "Missing task_text" }, { status: 400 });

    const { data, error } = await supabase.from("tasks").insert({
      task_text,
      user_id: userId, // Use the authenticated user's ID
      status: false,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
