import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function PATCH(req: Request, { params }: { params: any }) {
  try {
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

    // Update the tasks table
    const { data, error } = await supabase
      .from("tasks")
      .update({ status })
      .eq("task_id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Database error", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, task: data });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
}
