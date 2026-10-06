import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { load } from "cheerio";
import { generateJSON } from "@tiptap/html/server";
import { richExtensions } from "../lib/rich-extensions";
import { locales, type Template, type Sections, type Post } from "../lib/types";
const raw = await fs.readFile("js/i18n.js", "utf8");
const translations = JSON.parse(
  raw
    .slice(raw.indexOf("=") + 1)
    .trim()
    .replace(/;$/, ""),
);
const files = (await fs.readdir(".")).filter((x) => x.endsWith(".html"));
const posts: Post[] = [];
const manifest: { slug: string; title: string; file: string }[] = [];
const postSlugs = files
  .filter((x) => /^(post-|research-|guide-)/.test(x))
  .map((x) => x.replace(".html", ""));
function route(href: string) {
  const [file, tail = ""] = href.split(/(?=[?#])/s);
  if (file === "index.html") return "/" + tail;
  if (files.includes(file))
    return (
      (postSlugs.includes(file.replace(".html", "")) ? "/insights/" : "/") +
      file.replace(".html", "") +
      tail
    );
  return href;
}
await fs.mkdir("content/templates", { recursive: true });
for (const file of files) {
  const slug = file === "index.html" ? "home" : file.replace(".html", "");
  const article = postSlugs.includes(slug);
  const hex = createHash("sha256").update(slug).digest("hex");
  const stableId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  const post: Post = {
    id: stableId,
    slug,
    category: slug.startsWith("research-")
      ? "research"
      : slug.startsWith("guide-")
        ? "guide"
        : "essay",
    status: "published",
    published_at: "2026-10-06T00:00:00Z",
    updated_at: "2026-10-06T00:00:00Z",
    version: 1,
    post_content: [],
  };
  for (const locale of locales) {
    const $ = load(await fs.readFile(file, "utf8"));
    $("[data-t]").each((_, el) => {
      const id = $(el).attr("data-t")!;
      $(el).html(
        translations.s[locale][id] ?? translations.s.en[id] ?? $(el).html(),
      );
    });
    $("[data-ta]").each((_, el) => {
      $(el)
        .attr("data-ta")!
        .split("|")
        .forEach((pair) => {
          const [attr, id] = pair.split(":");
          $(el).attr(
            attr,
            translations.s[locale][id] ??
              translations.s.en[id] ??
              $(el).attr(attr),
          );
        });
    });
    $("[href]").each((_, el) => {
      $(el).attr("href", route($(el).attr("href")!));
    });
    $("[src],[poster]").each((_, el) => {
      for (const attr of ["src", "poster"]) {
        const s = $(el).attr(attr);
        if (s && /^(images|film|js)\//.test(s)) $(el).attr(attr, "/" + s);
      }
    });
    $("script").remove();
    $("[data-t],[data-ta]").removeAttr("data-t").removeAttr("data-ta");
    const title = $("title").text();
    const description = $('meta[name="description"]').attr("content") || "";
    if (article) {
      post.post_content.push({
        locale,
        byline: $("#main .details dd").first().text(),
        reading_time:
          article && slug.startsWith("research-")
            ? ""
            : $("#main .details dd").eq(1).text(),
        title: $("#main h1").text(),
        excerpt: $("#main .dek,#main .lead").first().text(),
        body: generateJSON(
          $("#main .prose,#main .paper .body").first().html() || "<p></p>",
          richExtensions(),
        ) as any,
        cover: {
          src: $("article .photo img").first().attr("src") || "",
          alt: $("article .photo img").first().attr("alt") || "",
          position: "50% 50%",
        },
        seo_title: title,
        seo_description: description,
        social_image: null,
        noindex: false,
        version: 1,
      });
    }
    // The listing is rendered from published database posts, never a stale HTML copy.
    if (slug === "insights") {
      $(".feature-post").parent("[data-cat]").remove();
      $(".post").remove();
      $(".post-grid,.posts").each((_, el) => {
        if (!$(el).text().trim()) $(el).remove();
      });
      $("section[aria-label]")
        .first()
        .prepend('<div id="cms-post-list"></div>');
    }
    const defaults: Sections = { text: {}, images: {}, links: {} };
    const fields: Template["fields"] = [];
    const images: Template["images"] = [];
    const links: Template["links"] = [];
    let i = 0;
    const groupNames = new Map<any, string>();
    $("section,article,header,footer").each((_, el) => {
      groupNames.set(
        el,
        $(el).is("header")
          ? "Navigation"
          : $(el).is("footer")
            ? "Footer & contact"
            : $(el).find("h1,h2").first().text().slice(0, 90) || "Page details",
      );
    });
    function group(el: any) {
      return (
        groupNames.get($(el).closest("section,article,header,footer")[0]) ||
        "Page details"
      );
    }
    $("a[href]").each((j, el) => {
      if ($(el).is("[data-setlang]")) return;
      const key = `l${j}`;
      const href = $(el).attr("href")!;
      defaults.links[key] = href;
      links.push({
        key,
        label: $(el).text().trim().slice(0, 90) || href,
        group: group(el),
      });
      $(el).attr("href", `{{CMS_LINK_${key}}}`);
    });
    // Only text nodes are editable. Existing elements, links, SVGs and event hooks remain fixed.
    $("body *").each((_, el) => {
      if ($(el).closest('svg,script,style,select,[aria-hidden="true"]').length)
        return;
      $(el)
        .contents()
        .each((_, node) => {
          if (
            node.type !== "text" ||
            !node.data.trim() ||
            /^[.·↗←→—]+$/.test(node.data.trim())
          )
            return;
          const key = `t${i++}`;
          const value = node.data.trim();
          defaults.text[key] = value;
          fields.push({ key, label: value.slice(0, 90), group: group(el) });
          node.data = node.data.replace(value, `{{CMS_TEXT_${key}}}`);
        });
    });
    $("img").each((j, el) => {
      const key = `i${j}`;
      const src = $(el).attr("src") || "";
      defaults.images[key] = {
        src,
        alt: $(el).attr("alt") || "",
        position:
          ($(el).attr("style") || "").match(/object-position:([^;]+)/)?.[1] ||
          "50% 50%",
      };
      images.push({
        key,
        label: src.split("/").pop() || "Image",
        group: group(el),
      });
      $(el)
        .attr("src", `{{CMS_IMAGE_${key}}}`)
        .attr("alt", `{{CMS_ALT_${key}}}`)
        .attr("style", `object-position:{{CMS_POSITION_${key}}}`);
    });
    const template: Template = {
      html: $("body").html()!,
      fields,
      images,
      links,
      defaults,
      title,
      description,
    };
    await fs.writeFile(
      `content/templates/${slug}.${locale}.json`,
      JSON.stringify(template),
    );
    if (locale === "en" && !article) manifest.push({ slug, title, file });
  }
  if (article) posts.push(post);
}
await fs.writeFile("content/pages.json", JSON.stringify(manifest, null, 2));
await fs.writeFile("content/posts.json", JSON.stringify(posts));
for (const folder of ["images", "film"])
  await fs.cp(folder, `public/${folder}`, { recursive: true });
await fs.mkdir("public/js", { recursive: true });
let script = await fs.readFile("js/site.js", "utf8");
script = script.replace(
  "var PAGE=document.body.getAttribute('data-page')||'home';",
  "var PAGE=document.querySelector('[data-page]')?.getAttribute('data-page')||'home';",
);
script = script.replace(
  "return id==='home'?'index.html':id+'.html'",
  "return id==='home'?'/':'/'+id",
);
script = script.replace(
  "var l=t.getAttribute('data-setlang');store(LS,l);applyLocale(l);closeLang();return",
  "var l=t.getAttribute('data-setlang');store(LS,l);var url=new URL(location.href);url.searchParams.set('lang',l);location.assign(url);return",
);
// The server supplies translated content. Do not overwrite CMS values from the old dictionary.
script = script.replace(
  "var D=window.CICERO_I18N||null;",
  `var D={js:${JSON.stringify(translations.js)}};`,
);
script = script.replace("if(D){", "if(D&&D.s){");
script = script.replace(
  "var s=recall(LS); if(s&&SUP.indexOf(s)>=0) return s;",
  "return (root.getAttribute('lang')||'en').slice(0,2);",
);
script = script.replaceAll("demo.html", "/demo");
script = script.replace(
  "(function(){",
  "(function(){if(window.__ciceroSiteStarted)return;window.__ciceroSiteStarted=true;",
);
await fs.writeFile("public/js/site.js", script);
const ui = await fs.readFile("js/ui.js", "utf8");
await fs.writeFile(
  "public/js/ui.js",
  `(function(){if(window.__ciceroUIStarted)return;window.__ciceroUIStarted=true;${ui}})();`,
);
console.log(
  `Imported ${manifest.length} pages, ${posts.length} posts, ${locales.length} languages.`,
);
