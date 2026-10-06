import { requireAdmin } from "@/lib/auth";
import { readPosts } from "@/lib/content";
import PostList from "@/components/admin/post-list";
export default async function Posts() {
  await requireAdmin();
  return <PostList initial={await readPosts(false)} />;
}
