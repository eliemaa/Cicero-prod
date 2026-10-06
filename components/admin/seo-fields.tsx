"use client";
import { Field } from "./common";
import { MediaChooser } from "./media-picker";
type SEO = {
  seo_title: string;
  seo_description: string;
  social_image: string | null;
  noindex: boolean;
};
export default function SEOFields({
  value,
  onChange,
}: {
  value: SEO;
  onChange: (v: SEO) => void;
}) {
  return (
    <details className="editor-section">
      <summary>Search & social preview</summary>
      <div className="section-body">
        <Field
          label="SEO title"
          value={value.seo_title}
          onChange={(seo_title) => onChange({ ...value, seo_title })}
          maxLength={160}
          required
        />
        <small>Aim for about 60 characters. {value.seo_title.length}/160</small>
        <Field
          label="Search description"
          value={value.seo_description}
          onChange={(seo_description) =>
            onChange({ ...value, seo_description })
          }
          multiline
          maxLength={500}
        />
        <small>
          Aim for about 160 characters. {value.seo_description.length}/500
        </small>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.noindex}
            onChange={(e) => onChange({ ...value, noindex: e.target.checked })}
          />
          Hide this page from search engines
        </label>
        {value.social_image && (
          <img
            className="image-preview"
            src={value.social_image}
            alt="Social sharing preview"
          />
        )}
        <div className="row">
          <MediaChooser
            label="Choose social image"
            onSelect={(m) => onChange({ ...value, social_image: m.url })}
          />
          {value.social_image && (
            <button
              type="button"
              className="text-button"
              onClick={() => onChange({ ...value, social_image: null })}
            >
              Remove social image
            </button>
          )}
        </div>
        <div className="search-preview">
          <strong>{value.seo_title}</strong>
          <p>{value.seo_description || "Add a search description."}</p>
        </div>
      </div>
    </details>
  );
}
