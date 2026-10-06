"use client";
import { useEffect, useRef, useState } from "react";
import type { Media, ImageValue } from "@/lib/types";
import { Notice, Field } from "./common";
export function MediaLibrary({ onSelect }: { onSelect?: (m: Media) => void }) {
  const [items, setItems] = useState<Media[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [progress, setProgress] = useState<number | null>(null),
    [busy, setBusy] = useState(""),
    [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/media", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Images could not load.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function upload(file?: File) {
    if (!file || progress !== null) return;
    if (
      file.size > 4 * 1024 * 1024 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    ) {
      setError("Choose a JPG, PNG, or WebP image under 4 MB.");
      return;
    }
    setError("");
    setProgress(0);
    const body = new FormData();
    body.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media");
    xhr.timeout = 120000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = xhr.ontimeout = () => {
      setError("Upload interrupted. Drop the image again to retry.");
      setProgress(null);
    };
    xhr.onload = () => {
      setProgress(null);
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status !== 201) throw new Error(data.error || "Upload failed.");
        setItems((old) => [data, ...old]);
        onSelect?.(data);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Upload failed. Please retry.",
        );
      }
    };
    xhr.send(body);
  }
  async function remove(item: Media) {
    if (!confirm(`Delete “${item.filename}”? This cannot be undone.`)) return;
    setBusy(item.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/media?id=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((items) => items.filter((m) => m.id !== item.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete image.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <div
        className={`dropzone ${drag ? "dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          upload(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <strong>
          {progress !== null
            ? progress === 100
              ? "Processing image…"
              : `Uploading… ${progress}%`
            : "Drop an image here"}
        </strong>
        <p>JPG, PNG or WebP · up to 4 MB</p>
        <button
          type="button"
          className="button secondary"
          disabled={progress !== null}
          onClick={() => input.current?.click()}
        >
          Choose a file
        </button>
        {progress !== null && (
          <progress value={progress} max={100} aria-label="Upload progress" />
        )}
      </div>
      <Notice error={error} />
      {error && (
        <button type="button" className="button secondary" onClick={load}>
          Reload library
        </button>
      )}
      {loading ? (
        <p role="status">Loading images…</p>
      ) : (
        <div className="media-grid">
          {items.map((item) => (
            <div className="media-card" key={item.id}>
              {onSelect ? (
                <button
                  type="button"
                  className="image-choice"
                  onClick={() => onSelect(item)}
                  aria-label={`Select ${item.filename}`}
                >
                  <img src={item.url} alt={item.filename} />
                </button>
              ) : (
                <img src={item.url} alt={item.filename} />
              )}
              <p>{item.filename}</p>
              <small>
                {item.width} × {item.height}
              </small>
              <button
                type="button"
                className="text-button danger"
                disabled={Boolean(busy)}
                onClick={() => remove(item)}
              >
                {busy === item.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          ))}
        </div>
      )}
      {!loading && !items.length && (
        <p className="muted">
          Your uploaded images will appear here. Existing site images stay in
          their current page placements until replaced.
        </p>
      )}
    </>
  );
}
export function MediaChooser({
  onSelect,
  label = "Choose image",
}: {
  onSelect: (m: Media) => void;
  label?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  return (
    <>
      <button
        type="button"
        className="button secondary"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        className="media-dialog"
        onClose={() => setOpen(false)}
      >
        <div className="section-heading">
          <h2>Image library</h2>
          <button
            type="button"
            className="button secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>
        {open && (
          <MediaLibrary
            onSelect={(m) => {
              onSelect(m);
              setOpen(false);
            }}
          />
        )}
      </dialog>
    </>
  );
}
export function ImageField({
  value,
  onChange,
  label = "Image",
}: {
  value: ImageValue;
  onChange: (v: ImageValue) => void;
  label?: string;
}) {
  return (
    <div className="image-field">
      <strong>{label}</strong>
      {value.src && (
        <img
          className="image-preview"
          src={value.src}
          alt={value.alt}
          style={{ objectPosition: value.position }}
        />
      )}
      <div className="row">
        <MediaChooser
          label={value.src ? "Replace image" : "Add image"}
          onSelect={(m) => onChange({ ...value, src: m.url })}
        />
        {value.src && (
          <button
            type="button"
            className="text-button"
            onClick={() => onChange({ ...value, src: "" })}
          >
            Remove
          </button>
        )}
      </div>
      <Field
        label="Alternative text (describe the image, or leave empty if decorative)"
        value={value.alt}
        onChange={(alt) => onChange({ ...value, alt })}
        maxLength={500}
      />
      <label className="field">
        <span>Crop position</span>
        <select
          value={value.position}
          onChange={(e) => onChange({ ...value, position: e.target.value })}
        >
          {!["50% 50%", "50% 0%", "50% 100%", "0% 50%", "100% 50%"].includes(
            value.position,
          ) && (
            <option value={value.position}>Original ({value.position})</option>
          )}
          <option value="50% 50%">Center</option>
          <option value="50% 0%">Top</option>
          <option value="50% 100%">Bottom</option>
          <option value="0% 50%">Left</option>
          <option value="100% 50%">Right</option>
        </select>
      </label>
    </div>
  );
}
