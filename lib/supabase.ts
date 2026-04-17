import { createClient } from "@supabase/supabase-js";

// Check for environment variables and provide a placeholder to prevent crashes during build/dev
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key-placeholder";

export const supabase = createClient(supabaseUrl, supabaseKey);
