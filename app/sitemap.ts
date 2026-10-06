import type { MetadataRoute } from "next";
import { pages, getPosts, getPage, localizedPost } from "@/lib/content";
import { locales } from "@/lib/types";
import { siteURL, publicPath } from "@/lib/urls";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const result: MetadataRoute.Sitemap = [];
  for (const page of pages)
    for (const locale of locales) {
      const c = await getPage(page.slug, locale);
      if (!c.noindex)
        result.push({
          url:
            siteURL() +
            publicPath(page.slug) +
            (locale === "en" ? "" : `?lang=${locale}`),
        });
    }
  for (const post of await getPosts())
    for (const locale of locales) {
      const c = localizedPost(post, locale);
      if (!c.noindex)
        result.push({
          url: `${siteURL()}/insights/${post.slug}${locale === "en" ? "" : `?lang=${locale}`}`,
          lastModified: post.updated_at,
        });
    }
  return result;
}
