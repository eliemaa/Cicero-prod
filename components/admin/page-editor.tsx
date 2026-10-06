"use client";
import { useState } from "react";
import type { PageContent, Template } from "@/lib/types";
import { savePage } from "@/app/admin/actions";
import { Field, LanguageSelect, Notice, useUnsaved } from "./common";
import { ImageField } from "./media-picker";
import SEOFields from "./seo-fields";
import { publicPath } from "@/lib/urls";
export default function PageEditor({
  initial,
  template,
}: {
  initial: PageContent;
  template: Template;
}) {
  const [value, setValue] = useState(initial),
    [saved, setSaved] = useState(JSON.stringify(initial)),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState("");
  const dirty = JSON.stringify(value) !== saved;
  useUnsaved(dirty);
  const groups = [
    ...new Set(
      [...template.fields, ...template.images, ...template.links].map(
        (f) => f.group,
      ),
    ),
  ];
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await savePage(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const next = { ...value, version: result.version };
      setValue(next);
      setSaved(JSON.stringify(next));
      setMessage("Saved. Your changes are live.");
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
          <a className="back" href="/admin">
            ← All pages
          </a>
          <h1>
            {template.title.replace(/ · Cicero$/, "")}
            <span>.</span>
          </h1>
          <p>Edit your content. The layout stays consistent.</p>
        </div>
        <LanguageSelect
          locale={value.locale}
          onChange={(l) => {
            if (
              !dirty ||
              confirm("Discard unsaved changes and switch language?")
            )
              location.assign(`?lang=${l}`);
          }}
        />
      </div>
      <div className="save-bar">
        <span>{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <div className="row">
          <a
            target="_blank"
            rel="noreferrer"
            href={`${publicPath(value.page_id)}?lang=${value.locale}`}
          >
            View page ↗
          </a>
          <button className="button" disabled={busy || !dirty}>
            {busy ? "Saving…" : "Save & publish"}
          </button>
        </div>
      </div>
      <Notice error={error} message={message} />
      <fieldset disabled={busy}>
        <label className="field">
          <span>Find a section or phrase</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search page content…"
          />
        </label>
        <div dir={value.locale === "ar" ? "rtl" : "ltr"}>
          {groups.map((group, i) => {
            const match = (f: { label: string; group: string }) =>
              (f.label + " " + f.group)
                .toLowerCase()
                .includes(search.toLowerCase());
            const fields = template.fields.filter(
                (f) => f.group === group && match(f),
              ),
              images = template.images.filter(
                (f) => f.group === group && match(f),
              );
            const links = template.links.filter(
              (f) => f.group === group && match(f),
            );
            if (!fields.length && !images.length && !links.length) return null;
            return (
              <details
                className="editor-section"
                key={group}
                open={search ? true : undefined}
              >
                <summary>
                  {group}
                  <small>
                    {fields.length} text fields · {images.length} images ·{" "}
                    {links.length} links
                  </small>
                </summary>
                <div className="section-body">
                  {fields.map((f) => (
                    <Field
                      key={f.key}
                      label={f.label}
                      value={value.sections.text[f.key]}
                      multiline={value.sections.text[f.key].length > 100}
                      onChange={(text) =>
                        setValue({
                          ...value,
                          sections: {
                            ...value.sections,
                            text: { ...value.sections.text, [f.key]: text },
                          },
                        })
                      }
                    />
                  ))}
                  {links.map((f) => (
                    <Field
                      key={f.key}
                      label={`Link: ${f.label}`}
                      value={value.sections.links[f.key]}
                      maxLength={2048}
                      onChange={(link) =>
                        setValue({
                          ...value,
                          sections: {
                            ...value.sections,
                            links: { ...value.sections.links, [f.key]: link },
                          },
                        })
                      }
                    />
                  ))}
                  {images.map((f) => (
                    <ImageField
                      key={f.key}
                      label={f.label}
                      value={value.sections.images[f.key]}
                      onChange={(image) =>
                        setValue({
                          ...value,
                          sections: {
                            ...value.sections,
                            images: {
                              ...value.sections.images,
                              [f.key]: image,
                            },
                          },
                        })
                      }
                    />
                  ))}
                </div>
              </details>
            );
          })}
        </div>
        <SEOFields
          value={value}
          onChange={(v) => setValue({ ...value, ...v })}
        />
      </fieldset>
    </form>
  );
}
