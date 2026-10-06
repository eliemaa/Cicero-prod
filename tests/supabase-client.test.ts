import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { supabaseServerOptions } from "../lib/supabase-options";

test("server and seed clients initialize without a native WebSocket", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "WebSocket");
  Object.defineProperty(globalThis, "WebSocket", { value: undefined, configurable: true });
  try {
    const client = createClient(
      "https://example.supabase.co",
      "test-key-not-a-real-secret",
      supabaseServerOptions,
    );
    assert.ok(client.from("pages"));
    assert.ok(client.storage.from("site-media"));
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "WebSocket", descriptor);
    else Reflect.deleteProperty(globalThis, "WebSocket");
  }
});
