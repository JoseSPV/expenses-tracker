import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { isSupabaseConfigured, supabaseEnv } from "./env.ts";

const URL = "NEXT_PUBLIC_SUPABASE_URL";
const KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

describe("supabaseEnv", () => {
  const previous = { url: process.env[URL], key: process.env[KEY] };

  afterEach(() => {
    if (previous.url === undefined) delete process.env[URL];
    else process.env[URL] = previous.url;
    if (previous.key === undefined) delete process.env[KEY];
    else process.env[KEY] = previous.key;
  });

  it("stays unconfigured when either value is missing", () => {
    delete process.env[URL];
    delete process.env[KEY];
    assert.equal(supabaseEnv(), null);
    assert.equal(isSupabaseConfigured(), false);

    process.env[URL] = "https://example.supabase.co";
    assert.equal(isSupabaseConfigured(), false);
  });

  it("reads the public URL and the publishable key", () => {
    process.env[URL] = "https://example.supabase.co";
    process.env[KEY] = "sb_publishable_example";
    assert.deepEqual(supabaseEnv(), { url: "https://example.supabase.co", key: "sb_publishable_example" });
  });

  it("refuses a URL that is not the hosted project", () => {
    process.env[KEY] = "sb_publishable_example";
    for (const url of ["http://example.supabase.co", "https://evil.example", "https://user:pass@example.supabase.co"]) {
      process.env[URL] = url;
      assert.equal(supabaseEnv(), null);
    }
  });

  it("refuses the service-role key", () => {
    process.env[URL] = "https://example.supabase.co";
    process.env[KEY] = "service_role";
    assert.equal(supabaseEnv(), null);

    const payload = btoa(JSON.stringify({ role: "service_role" }));
    process.env[KEY] = `header.${payload}.signature`;
    assert.equal(supabaseEnv(), null);
  });
});
