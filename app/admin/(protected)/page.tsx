import { pages, readPosts } from "@/lib/content";
import { requireAdmin, authConfigured } from "@/lib/auth";
import { configured } from "@/lib/supabase";
export default async function Dashboard() {
  if (!authConfigured() || !configured()) return null;
  await requireAdmin();
  const posts = await readPosts(false);
  return (
    <>
      <span className="eyebrow">Your website, up to date</span>
      <h1>
        Good ideas deserve
        <br />a clear voice<span>.</span>
      </h1>
      <p className="intro">
        Update your pages, share a new perspective, or find the right image.
      </p>
      <div className="metrics">
        <div>
          <strong>{pages.length}</strong>
          <span>Editable pages</span>
        </div>
        <div>
          <strong>
            {posts.filter((p) => p.status === "published").length}
          </strong>
          <span>Published insights</span>
        </div>
        <div>
          <strong>{posts.filter((p) => p.status === "draft").length}</strong>
          <span>Drafts in progress</span>
        </div>
      </div>
      <div className="section-heading" id="pages">
        <h2>Website pages</h2>
        <span>Changes go live when you save</span>
      </div>
      <div className="page-cards">
        {pages.map((p) => (
          <a className="page-card" key={p.slug} href={`/admin/pages/${p.slug}`}>
            <span className="eyebrow">
              {p.slug === "home"
                ? "Homepage"
                : p.slug === "demo"
                  ? "Contact"
                  : p.slug}
            </span>
            <h3>{p.title.replace(/ · Cicero$/, "")}</h3>
            <span>
              Edit copy, images & SEO <b>↗</b>
            </span>
          </a>
        ))}
      </div>
      <div className="callout">
        <div>
          <h2>Something to say?</h2>
          <p>Create an insight and publish when it’s ready.</p>
        </div>
        <a className="button" href="/admin/posts/new">
          ↗ New post
        </a>
      </div>
    </>
  );
}
