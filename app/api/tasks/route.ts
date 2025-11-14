// app/api/tasks/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const owner_phone = url.searchParams.get("owner_phone");

    let q = supabase.from("tasks").select("*").order("created_at", { ascending: false }).limit(500);
    if (owner_phone) {
      // we stored user_id for tasks in schema; but user asked to add profile id when creating tasks.
      // fallback: return tasks for which tasks.owner_phone matches (if you have that column)
      q = q.ilike("user_id", `%${owner_phone}%`); // harmless if no rows
    }

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // expected fields: task_text, user_id (profiles.id), deal_id (optional), priority
    const { task_text, user_id, priority } = body;
    if (!task_text || !user_id) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const { data, error } = await supabase.from("tasks").insert({
      task_text,
      user_id,
      status: false,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/tasks error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
