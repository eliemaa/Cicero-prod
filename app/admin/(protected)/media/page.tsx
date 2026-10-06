import { requireAdmin } from "@/lib/auth";
import { MediaLibrary } from "@/components/admin/media-picker";
export default async function MediaPage() {
  await requireAdmin();
  return (
    <>
      <span className="eyebrow">Image library</span>
      <h1>
        A different perspective<span>.</span>
      </h1>
      <p className="intro">Upload once, use across your website.</p>
      <MediaLibrary />
    </>
  );
}
