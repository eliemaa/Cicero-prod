export const locales = ["en", "ar", "fr", "de", "es", "it", "pt"] as const;
export type Locale = (typeof locales)[number];
export const localeNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
};
export function localeOf(value?: string): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : "en";
}
export type ImageValue = { src: string; alt: string; position: string };
export type Sections = {
  text: Record<string, string>;
  images: Record<string, ImageValue>;
  links: Record<string, string>;
};
export type Field = { key: string; label: string; group: string };
export type Template = {
  html: string;
  fields: Field[];
  images: Field[];
  links: Field[];
  defaults: Sections;
  title: string;
  description: string;
};
export type PageContent = {
  page_id: string;
  locale: Locale;
  sections: Sections;
  seo_title: string;
  seo_description: string;
  social_image: string | null;
  noindex: boolean;
  version: number;
};
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: RichNode[];
};
export type PostContent = {
  locale: Locale;
  byline: string;
  reading_time: string;
  title: string;
  excerpt: string;
  body: RichNode;
  cover: ImageValue;
  seo_title: string;
  seo_description: string;
  social_image: string | null;
  noindex: boolean;
  version: number;
};
export type Post = {
  id: string;
  slug: string;
  category: string;
  status: "draft" | "published";
  published_at: string | null;
  updated_at: string;
  version: number;
  post_content: PostContent[];
};
export type Media = {
  id: string;
  path: string;
  filename: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  created_at: string;
  url: string;
};
