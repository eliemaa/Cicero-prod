import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readPosts, localizedPost } from "@/lib/content";
import { localeOf } from "@/lib/types";
import PostEditor from "@/components/admin/post-editor";
export default async function EditPost({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const locale = localeOf((await searchParams).lang);
  const post = (await readPosts(false)).find((p) => p.id === id);
  if (!post) notFound();
  return (
    <PostEditor
      key={id + locale}
      post={post}
      content={localizedPost(post, locale)}
      locale={locale}
    />
  );
}
