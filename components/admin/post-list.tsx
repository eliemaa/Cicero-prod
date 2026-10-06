"use client";
import { useState } from "react";
import type { Post } from "@/lib/types";
import { deletePost } from "@/app/admin/actions";
import { Notice } from "./common";
export default function PostList({ initial }: { initial: Post[] }) {
  const [posts, setPosts] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [filter, setFilter] = useState("all");
  async function remove(p: Post) {
    if (!confirm("Permanently delete this post and all its translations?"))
      return;
    setBusy(p.id);
    setError("");
    try {
      const r = await deletePost({ id: p.id, version: p.version });
      if (!r.ok) setError(r.error);
      else setPosts((rows) => rows.filter((x) => x.id !== p.id));
    } catch {
      setError("Could not confirm deletion. Reload and retry.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div className="editor-heading">
        <div>
          <span className="eyebrow">Journal & insights</span>
          <h1>
            From the record<span>.</span>
          </h1>
        </div>
        <a className="button" href="/admin/posts/new">
          ↗ New post
        </a>
      </div>
      <label className="field">
        <span>Show</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All posts</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </label>
      <Notice error={error} />
      <div className="post-list">
        {posts
          .filter((p) => filter === "all" || p.status === filter)
          .map((p) => (
            <article key={p.id}>
              <div>
                <span className={`badge ${p.status}`}>{p.status}</span>
                <h2>
                  <a href={`/admin/posts/${p.id}`}>
                    {p.post_content.find((c) => c.locale === "en")?.title ||
                      p.slug}
                  </a>
                </h2>
                <p>
                  {p.category} · {p.post_content.length} languages
                </p>
              </div>
              <div className="row">
                <a href={`/admin/posts/${p.id}`}>Edit ↗</a>
                <button
                  className="text-button danger"
                  disabled={Boolean(busy)}
                  onClick={() => remove(p)}
                >
                  {busy === p.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </article>
          ))}
      </div>
      {!posts.some((p) => filter === "all" || p.status === filter) && (
        <div className="editor-panel">
          <h2>No posts here yet.</h2>
          <p>Create a post to get started.</p>
        </div>
      )}
    </>
  );
}
