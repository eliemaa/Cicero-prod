import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { unstable_cache } from "next/cache";
import { db, configured } from "./supabase";
import pages from "@/content/pages.json";
import seedPosts from "@/content/posts.json";
import type { Locale, Template, PageContent, Post } from "./types";
export { pages };
export async function template(
  slug: string,
  locale: Locale,
): Promise<Template> {
  if (
    ![...pages.map((x) => x.slug), ...seedPosts.map((x) => x.slug)].includes(
      slug,
    )
  )
    throw new Error("Unknown template");
  return JSON.parse(
    await fs.readFile(
      path.join(process.cwd(), "content/templates", `${slug}.${locale}.json`),
      "utf8",
    ),
  );
}
export async function readPage(
  slug: string,
  locale: Locale,
): Promise<PageContent> {
  const t = await template(slug, locale);
  if (!configured())
    return {
      page_id: slug,
      locale,
      sections: t.defaults,
      seo_title: t.title,
      seo_description: t.description,
      social_image: null,
      noindex: false,
      version: 1,
    };
  const { data, error } = await db()
    .from("page_content")
    .select("*")
    .eq("page_id", slug)
    .eq("locale", locale)
    .single();
  if (error) throw error;
  return data;
}
export function getPage(slug: string, locale: Locale) {
  return configured()
    ? unstable_cache(
        () => readPage(slug, locale),
        ["page-content", slug, locale],
        { tags: [`page:${slug}`] },
      )()
    : readPage(slug, locale);
}
export async function readPosts(published = true): Promise<Post[]> {
  if (!configured())
    return (seedPosts as Post[]).filter(
      (p) => !published || p.status === "published",
    );
  let q = db()
    .from("posts")
    .select("*,post_content(*)")
    .order("published_at", { ascending: false, nullsFirst: false });
  if (published) q = q.eq("status", "published");
  const { data, error } = await q;
  if (error) throw error;
  return data as Post[];
}
const cachedPosts = unstable_cache(() => readPosts(true), ["published-posts"], {
  tags: ["posts"],
});
export function getPosts() {
  return configured() ? cachedPosts() : readPosts(true);
}
export function localizedPost(p: Post, locale: Locale) {
  return (
    p.post_content.find((c) => c.locale === locale) ||
    p.post_content.find((c) => c.locale === "en")!
  );
}
