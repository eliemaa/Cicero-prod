import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readPage, template, pages } from "@/lib/content";
import { localeOf } from "@/lib/types";
import PageEditor from "@/components/admin/page-editor";
export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdmin();
  const { slug } = await params;
  const locale = localeOf((await searchParams).lang);
  if (!pages.some((p) => p.slug === slug)) notFound();
  const [initial, t] = await Promise.all([
    readPage(slug, locale),
    template(slug, locale),
  ]);
  return <PageEditor key={slug + locale} initial={initial} template={t} />;
}
