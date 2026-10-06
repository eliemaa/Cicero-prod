import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  pageInputSchema,
  postInputSchema,
  validateRich,
} from "../lib/validation";
import { safeLink, escapeHTML } from "../lib/urls";
import { locales } from "../lib/types";
const page = {
  page_id: "home",
  locale: "en",
  sections: { text: { hero: "Hello" }, images: {}, links: {} },
  seo_title: "Cicero",
  seo_description: "Description",
  social_image: null,
  noindex: false,
  version: 1,
};
const post = {
  locale: "en",
  slug: "first-post",
  category: "essay",
  status: "published",
  title: "First post",
  excerpt: "An introduction",
  body: {
    type: "doc",
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Article body" }] },
    ],
  },
  cover: { src: "", alt: "", position: "50% 50%" },
  seo_title: "First post",
  seo_description: "",
  social_image: null,
  noindex: false,
  version: 0,
};
test("rejects unsafe links, invalid images, malformed rich text and invalid publish input", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,x",
    "//evil.example",
    "/\\evil.example",
    "https://a.example\nscript",
  ])
    assert.equal(safeLink(url), false, url);
  for (const url of [
    "/demo?topic=claims",
    "https://example.com",
    "mailto:hello@example.com",
    "#main",
  ])
    assert.equal(safeLink(url), true, url);
  assert.equal(escapeHTML('<script>"&'), "&lt;script&gt;&quot;&amp;");
  assert.equal(pageInputSchema.safeParse(page).success, true);
  assert.equal(postInputSchema.safeParse(post).success, true);
  assert.equal(
    postInputSchema.safeParse({ ...post, slug: "Not a slug" }).success,
    false,
  );
  assert.equal(
    postInputSchema.safeParse({ ...post, body: { type: "doc", content: [] } })
      .success,
    false,
  );
  assert.equal(
    postInputSchema.safeParse({
      ...post,
      status: "draft",
      body: { type: "doc", content: [{ type: "paragraph" }] },
    }).success,
    true,
  );
  assert.equal(
    validateRich({
      type: "doc",
      content: [
        {
          type: "text",
          text: "test",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    }),
    false,
  );
  assert.equal(
    validateRich({
      type: "doc",
      content: [
        { type: "image", attrs: { src: "/image", onerror: "alert(1)" } },
      ],
    }),
    false,
  );
  assert.equal(
    validateRich({
      type: "doc",
      content: [{ type: "script", text: "alert(1)" }],
    }),
    false,
  );
});
test("all imported translations pass validation and keep their editable structure", async () => {
  const posts = JSON.parse(await fs.readFile("content/posts.json", "utf8"));
  assert.equal(posts.length, 6);
  for (const p of posts) {
    assert.equal(p.post_content.length, 7);
    for (const c of p.post_content)
      assert.equal(
        postInputSchema.safeParse({ ...p, ...c, version: p.version }).success,
        true,
        `${p.slug}/${c.locale}`,
      );
  }
  const pages = JSON.parse(await fs.readFile("content/pages.json", "utf8"));
  for (const p of pages)
    for (const locale of locales) {
      const t = JSON.parse(
        await fs.readFile(`content/templates/${p.slug}.${locale}.json`, "utf8"),
      );
      const result = pageInputSchema.safeParse({
        ...page,
        page_id: p.slug,
        locale,
        sections: t.defaults,
        seo_title: t.title,
        seo_description: t.description,
      });
      assert.equal(
        result.success,
        true,
        `${p.slug}/${locale}: ${result.success ? "" : result.error.message}`,
      );
      assert.equal(t.fields.length, Object.keys(t.defaults.text).length);
      assert.equal(t.images.length, Object.keys(t.defaults.images).length);
    }
});
test("Postgres transactions enforce conflicts, permissions, unique slugs and image references", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`,
    );
    await db.exec(await fs.readFile("supabase/migrations/001_cms.sql", "utf8"));
    await db.query(
      `insert into public.pages(id,slug,template) values('home','home','home')`,
    );
    await db.query(
      `insert into public.page_content(page_id,locale,sections,seo_title) values('home','en',$1,'Cicero')`,
      [page.sections],
    );
    const mid = "11111111-1111-4111-8111-111111111111";
    await db.query(
      `insert into public.media(id,path,filename,mime_type,size,width,height) values($1,'image.webp','image.webp','image/webp',100,100,100)`,
      [mid],
    );
    const save = await db.query<{ version: number }>(
      "select public.save_page($1,$2) as version",
      [page, [mid]],
    );
    assert.equal(save.rows[0].version, 2);
    await assert.rejects(
      db.query("select public.save_page($1,$2)", [page, []]),
      /CMS_CONFLICT/,
    );
    await assert.rejects(
      db.query("delete from public.media where id=$1", [mid]),
      /foreign key/,
    );
    await db.query("select public.save_page($1,$2)", [
      { ...page, version: 2 },
      [],
    ]);
    await db.query("delete from public.media where id=$1", [mid]);
    const created = await db.query<{ saved: { id: string; version: number } }>(
      "select public.save_post($1,$2) as saved",
      [post, []],
    );
    const saved = created.rows[0].saved;
    assert.equal(saved.version, 1);
    await assert.rejects(
      db.query("select public.save_post($1,$2)", [post, []]),
      /unique constraint/,
    );
    const edited = { ...post, id: saved.id, version: 1, status: "draft" };
    await db.query("select public.save_post($1,$2)", [edited, []]);
    await assert.rejects(
      db.query("select public.save_post($1,$2)", [edited, []]),
      /CMS_CONFLICT/,
    );
    const published = await db.query(
      `select id from public.posts where status='published'`,
    );
    assert.equal(published.rows.length, 0);
    const content = await db.query(
      `select title from public.post_content where post_id=$1`,
      [saved.id],
    );
    assert.equal(content.rows.length, 1);
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from public.posts"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.save_page($1,$2)", [page, []]),
      /permission denied/,
    );
    await db.exec("reset role");
    await db.exec("set role authenticated");
    await assert.rejects(
      db.query("select * from public.page_content"),
      /permission denied/,
    );
    await db.exec("reset role");
    await assert.rejects(
      db.query("select public.delete_post($1,$2)", [saved.id, 1]),
      /CMS_CONFLICT/,
    );
    await db.query("select public.delete_post($1,$2)", [saved.id, 2]);
    assert.equal(
      (await db.query("select * from public.post_content")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
