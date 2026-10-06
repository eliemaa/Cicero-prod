import { createClient } from "@supabase/supabase-js";
import { supabaseServerOptions } from "../lib/supabase-options";
import fs from "node:fs/promises";
import pages from "../content/pages.json";
import posts from "../content/posts.json";
import { locales } from "../lib/types";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Set Supabase credentials in .env.local first.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseServerOptions,
);
function check(result: any) {
  if (result.error) throw result.error;
}
for (const p of pages) {
  check(
    await db
      .from("pages")
      .upsert(
        { id: p.slug, slug: p.slug, template: p.slug },
        { onConflict: "id", ignoreDuplicates: true },
      ),
  );
  for (const locale of locales) {
    const t = JSON.parse(
      await fs.readFile(`content/templates/${p.slug}.${locale}.json`, "utf8"),
    );
    check(
      await db
        .from("page_content")
        .upsert(
          {
            page_id: p.slug,
            locale,
            sections: t.defaults,
            seo_title: t.title,
            seo_description: t.description,
          },
          { onConflict: "page_id,locale", ignoreDuplicates: true },
        ),
    );
  }
}
for (const p of posts) {
  const { post_content, ...row } = p;
  const { data, error } = await db
    .from("posts")
    .select("id")
    .eq("slug", p.slug)
    .maybeSingle();
  if (error) throw error;
  if (data) continue; // Never overwrite editorial changes when seeding again.
  check(await db.from("posts").insert(row));
  check(
    await db
      .from("post_content")
      .insert(post_content.map((c) => ({ ...c, post_id: p.id }))),
  );
}
console.log("Seed complete. Existing content was preserved.");
