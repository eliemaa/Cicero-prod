import { requireAdmin } from "@/lib/auth";
import PostEditor from "@/components/admin/post-editor";
export default async function NewPost() {
  await requireAdmin();
  return (
    <PostEditor
      locale="en"
      content={{
        locale: "en",
        byline: "",
        reading_time: "",
        title: "",
        excerpt: "",
        body: { type: "doc", content: [{ type: "paragraph" }] },
        cover: { src: "", alt: "", position: "50% 50%" },
        seo_title: "",
        seo_description: "",
        social_image: null,
        noindex: false,
        version: 0,
      }}
    />
  );
}
