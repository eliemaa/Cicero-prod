import WebSocket from "ws";

// Supabase initializes Realtime even when only database/storage APIs are used.
// Node 20 needs an explicit transport because it has no native WebSocket.
export const supabaseServerOptions = {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: WebSocket },
};
