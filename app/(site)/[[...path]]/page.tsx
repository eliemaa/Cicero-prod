import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { load } from "cheerio";
import {
  pages,
  template,
  getPage,
  getPosts,
  localizedPost,
} from "@/lib/content";
import { localeOf, locales } from "@/lib/types";
import {
  renderTemplate,
  renderPostList,
  renderArticle,
  localizeLinks,
} from "@/lib/render";
import { siteURL, publicPath } from "@/lib/urls";
import SiteBehavior from "@/components/site-behavior";
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<{ lang?: string }>;
};
async function resolve(props: Props) {
  const [{ path = [] }, { lang }] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const locale = localeOf(lang);
  if (path.length === 2 && path[0] === "insights") {
    const post = (await getPosts()).find((p) => p.slug === path[1]);
    if (!post) notFound();
    return { locale, post, slug: "insights", url: `/insights/${post.slug}` };
  }
  const slug = path.length === 0 ? "home" : path.length === 1 ? path[0] : "";
  if (!pages.some((p) => p.slug === slug)) notFound();
  return { locale, slug, url: publicPath(slug), post: null };
}
export async function generateMetadata(props: Props): Promise<Metadata> {
  const r = await resolve(props);
  const c = r.post
    ? localizedPost(r.post, r.locale)
    : await getPage(r.slug, r.locale);
  const canonical = r.url + (r.locale === "en" ? "" : `?lang=${r.locale}`);
  return {
    metadataBase: new URL(siteURL()),
    title: { absolute: c.seo_title },
    description: c.seo_description,
    robots: { index: !c.noindex, follow: true },
    alternates: {
      canonical,
      languages: Object.fromEntries(
        locales.map((l) => [l, r.url + (l === "en" ? "" : `?lang=${l}`)]),
      ),
    },
    openGraph: {
      title: c.seo_title,
      description: c.seo_description,
      url: canonical,
      ...(c.social_image ? { images: [c.social_image] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: c.seo_title,
      description: c.seo_description,
      ...(c.social_image ? { images: [c.social_image] } : {}),
    },
  };
}
export default async function PublicPage(props: Props) {
  const r = await resolve(props);
  const slug = r.post ? "insights" : r.slug;
  const [t, c, posts] = await Promise.all([
    template(slug, r.locale),
    getPage(slug, r.locale),
    getPosts(),
  ]);
  const $ = load(renderTemplate(t, c.sections), null, false);
  $('img[src=""]').remove();
  if (r.post) $("#main").html(renderArticle(r.post, r.locale));
  else if (slug === "insights")
    $("#cms-post-list").html(renderPostList(posts, r.locale));
  // A removed/unpublished post must not leave a prominent dead link in shared navigation.
  $('a[href^="/insights/"]').each((_, el) => {
    const href = $(el).attr("href")!.split("?")[0];
    if (!posts.some((p) => href === `/insights/${p.slug}`))
      $(el).attr("href", "/insights");
  });
  return (
    <>
      <div
        lang={r.locale}
        dir={r.locale === "ar" ? "rtl" : "ltr"}
        dangerouslySetInnerHTML={{ __html: localizeLinks($.html(), r.locale) }}
      />
      <SiteBehavior locale={r.locale} />
    </>
  );
}
