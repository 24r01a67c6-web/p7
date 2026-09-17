import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasValidConfiguration =
  Boolean(supabaseUrl) &&
  Boolean(supabaseKey) &&
  !supabaseUrl.startsWith("YOUR_") &&
  !supabaseKey.startsWith("YOUR_");

if (!hasValidConfiguration) {
  console.error(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
  );
}

export const supabase = hasValidConfiguration
  ? createClient(supabaseUrl, supabaseKey)
  : null;
