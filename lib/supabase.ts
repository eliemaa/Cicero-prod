import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerOptions } from "./supabase-options";
export function configured() {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
export function db() {
  if (!configured())
    throw new Error("Supabase is not configured. Follow README.md.");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    supabaseServerOptions,
  );
}
