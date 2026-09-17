import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://placeholder-eduplay.supabase.co";
const supabasePublishableKey =
  import.meta.env?.VITE_PUBLISHABLE_KEY ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "placeholder-anon-key";

/**
 * Typed Supabase Client instance bound to EduPlay's PostgreSQL database schema
 */
export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
);

export default supabase;
