import { generateHTML } from "@tiptap/html/server";
import { load } from "cheerio";
import { richExtensions } from "./rich-extensions";
import { escapeHTML as e } from "./urls";
import { localizedPost } from "./content";
import type { Sections, Template, Post, Locale } from "./types";
export function renderTemplate(t: Template, s: Sections) {
  return t.html.replace(
    /\{\{CMS_(TEXT|LINK|IMAGE|ALT|POSITION)_(\w+)\}\}/g,
    (_, type, key) =>
      e(
        type === "LINK"
          ? (s.links[key] ?? t.defaults.links[key] ?? "")
          : type === "TEXT"
            ? (s.text[key] ?? t.defaults.text[key] ?? "")
            : ((s.images[key] ?? t.defaults.images[key])?.[
                type === "IMAGE" ? "src" : type === "ALT" ? "alt" : "position"
              ] ?? ""),
      ),
  );
}
export function renderPostList(posts: Post[], locale: Locale) {
  return `<div class="post-grid">${posts
    .map((p) => {
      const c = localizedPost(p, locale);
      return `<a class="post" href="/insights/${e(p.slug)}?lang=${locale}" data-cat="${e(p.category)}">${c.cover.src ? `<div class="photo"><img src="${e(c.cover.src)}" alt="${e(c.cover.alt)}" loading="lazy" style="object-position:${e(c.cover.position)}"></div>` : ""}<div class="meta">${e(p.category)}</div><h3>${e(c.title)}</h3><p>${e(c.excerpt)}</p></a>`;
    })
    .join("")}</div>`;
}
export function renderArticle(post: Post, locale: Locale) {
  const c = localizedPost(post, locale);
  return `<div data-page="insights" class="active"><article class="wrap article"><a class="back" href="/insights?lang=${locale}">← Insights</a><span class="eyebrow">${e(post.category)}</span><h1>${e(c.title)}</h1><p class="dek">${e(c.excerpt)}</p><p class="meta">${e(c.byline)}${c.reading_time ? ` · ${e(c.reading_time)}` : ""}</p>${c.cover.src ? `<div class="photo"><img src="${e(c.cover.src)}" alt="${e(c.cover.alt)}" style="object-position:${e(c.cover.position)}"></div>` : ""}<div class="prose">${generateHTML(c.body, richExtensions())}</div></article></div>`;
}
export function localizeLinks(html: string, locale: Locale) {
  const $ = load(html, null, false);
  $('a[href^="/"]').each((_, el) => {
    const a = $(el);
    const href = a.attr("href")!;
    if (!href.startsWith("//")) {
      const u = new URL(href, "https://local.test");
      if (locale !== "en") u.searchParams.set("lang", locale);
      a.attr("href", u.pathname + u.search + u.hash);
    }
  });
  return $.html();
}
