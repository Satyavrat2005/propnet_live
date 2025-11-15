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

export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    // Get logged-in user ID
    const token = readSessionCookie(req);
    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const payload = await verifySession(token);
    const userId = payload.sub;

    // Next.js may pass params as a Promise — await it first.
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    // Accept boolean `status` in body
    const status = typeof body.status === "boolean" ? body.status : null;
    if (status === null) {
      return NextResponse.json({ error: "Missing or invalid 'status' (boolean) in request body" }, { status: 400 });
    }

    // Update the tasks table only for tasks belonging to the logged-in user
    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("task_id", id)
      .eq("user_id", userId) // Only allow updating own tasks
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Task not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
