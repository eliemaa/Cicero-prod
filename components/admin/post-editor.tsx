"use client";
import { useState } from "react";
import type { Post, PostContent, Locale } from "@/lib/types";
import { savePost } from "@/app/admin/actions";
import { Field, LanguageSelect, Notice, useUnsaved } from "./common";
import { ImageField } from "./media-picker";
import SEOFields from "./seo-fields";
import RichEditor from "./rich-editor";
export default function PostEditor({
  post,
  content,
  locale,
}: {
  post?: Post;
  content: PostContent;
  locale: Locale;
}) {
  const initial = {
    ...content,
    id: post?.id,
    locale,
    slug: post?.slug || "",
    category: post?.category || "essay",
    status: post?.status || "draft",
    version: post?.version || 0,
  };
  const [value, setValue] = useState(initial),
    [saved, setSaved] = useState(JSON.stringify(initial)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const dirty = saved !== JSON.stringify(value);
  useUnsaved(dirty);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await savePost(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = { ...value, id: result.id, version: result.version };
      setValue(next);
      setSaved(JSON.stringify(next));
      setMessage(
        value.status === "published"
          ? "Saved. Your article is live."
          : "Draft saved. Only you can see this article.",
      );
      if (!post)
        window.history.replaceState(
          null,
          "",
          `/admin/posts/${result.id}?lang=${locale}`,
        );
    } catch {
      setError(
        "Connection lost. Retry saving; if the earlier save completed, reload to see it.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="editor-heading">
        <div>
          <a className="back" href="/admin/posts">
            ← All posts
          </a>
          <h1>
            {post ? "Edit insight" : "A new perspective"}
            <span>.</span>
          </h1>
        </div>
        {value.id && (
          <LanguageSelect
            locale={locale}
            onChange={(l) => {
              if (
                !dirty ||
                confirm("Discard unsaved changes and switch language?")
              )
                location.assign(`/admin/posts/${value.id}?lang=${l}`);
            }}
          />
        )}
      </div>
      <div className="save-bar">
        <span>
          {dirty
            ? "Unsaved changes"
            : value.id
              ? "All changes saved"
              : "Start with a draft"}
        </span>
        <button className="button" disabled={busy}>
          {busy
            ? "Saving…"
            : value.status === "published"
              ? "Save & publish"
              : "Save draft"}
        </button>
      </div>
      <Notice error={error} message={message} />
      <fieldset disabled={busy}>
        <div className="editor-panel" dir={locale === "ar" ? "rtl" : "ltr"}>
          <Field
            label="Article title"
            value={value.title}
            required
            maxLength={240}
            onChange={(title) =>
              setValue({
                ...value,
                title,
                seo_title:
                  value.seo_title === value.title || !value.seo_title
                    ? title
                    : value.seo_title,
              })
            }
          />
          <Field
            label="URL slug"
            value={value.slug}
            required
            maxLength={100}
            onChange={(slug) => setValue({ ...value, slug })}
          />
          <p className="muted">
            /insights/{value.slug || "your-article"} · Use lowercase letters and
            hyphens. Changing a published URL changes its address.
          </p>
          <div className="two-col">
            <label className="field">
              <span>Category</span>
              <select
                value={value.category}
                onChange={(e) =>
                  setValue({ ...value, category: e.target.value })
                }
              >
                <option value="essay">Essay</option>
                <option value="research">Research</option>
                <option value="guide">Guide</option>
                <option value="news">News</option>
              </select>
            </label>
            <label className="field">
              <span>Visibility (all languages)</span>
              <select
                value={value.status}
                onChange={(e) =>
                  setValue({
                    ...value,
                    status: e.target.value as "draft" | "published",
                  })
                }
              >
                <option value="draft">Draft — private</option>
                <option value="published">Published — live on save</option>
              </select>
            </label>
          </div>
          <Field
            label="Short introduction"
            value={value.excerpt}
            multiline
            maxLength={1000}
            onChange={(excerpt) => setValue({ ...value, excerpt })}
          />
          <div className="two-col">
            <Field
              label="Author / attribution"
              value={value.byline}
              maxLength={300}
              onChange={(byline) => setValue({ ...value, byline })}
            />
            <Field
              label="Reading time"
              value={value.reading_time}
              maxLength={100}
              onChange={(reading_time) => setValue({ ...value, reading_time })}
            />
          </div>
          <ImageField
            label="Cover image"
            value={value.cover}
            onChange={(cover) => setValue({ ...value, cover })}
          />
          <label className="field">
            <span>Article content</span>
          </label>
          <RichEditor
            value={value.body}
            onChange={(body) => setValue((v) => ({ ...v, body }))}
          />
        </div>
        <SEOFields
          value={value}
          onChange={(v) => setValue({ ...value, ...v })}
        />
      </fieldset>
    </form>
  );
}
