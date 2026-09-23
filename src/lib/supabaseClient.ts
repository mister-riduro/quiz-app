import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const rawUrl = import.meta.env?.VITE_SUPABASE_URL || "";
const rawKey =
  import.meta.env?.VITE_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes("placeholder-eduplay") &&
  !rawUrl.includes("your-project-id") &&
  !rawKey.includes("placeholder") &&
  !rawKey.includes("your-publishable-key"),
);

const supabaseUrl = rawUrl || "https://placeholder-eduplay.supabase.co";
const supabasePublishableKey = rawKey || "placeholder-anon-key";

/**
 * Typed Supabase Client instance bound to EduPlay's PostgreSQL database schema
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
);

export default supabase;
