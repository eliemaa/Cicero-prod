"use client";
import { useEffect } from "react";
import { locales, localeNames, type Locale } from "@/lib/types";
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const unload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const click = (e: MouseEvent) => {
      const a = (e.target as Element).closest("a");
      if (
        a &&
        a.target !== "_blank" &&
        !a.getAttribute("href")?.startsWith("#") &&
        !confirm("You have unsaved changes. Leave this page?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
export function LanguageSelect({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (l: Locale) => void;
}) {
  return (
    <label className="language-label">
      Editing language
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Notice({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  return error ? (
    <p role="alert" className="notice error">
      {error}
    </p>
  ) : message ? (
    <p role="status" className="notice success">
      {message}
    </p>
  ) : null;
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength = 20000,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          maxLength={maxLength}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
        />
      ) : (
        <input
          value={value}
          maxLength={maxLength}
          required={required}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
