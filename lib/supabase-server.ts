// lib/supabase-server.ts
import { createClient as create } from "@supabase/supabase-js";

export function createClient() {
  return create(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
