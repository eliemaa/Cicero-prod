import { z } from "zod";
import { getSchema } from "@tiptap/core";
import { richExtensions } from "./rich-extensions";
const richSchema = getSchema(richExtensions());
import { locales, type RichNode } from "./types";
import { safeLink } from "./urls";
export const localeSchema = z.enum(locales);
export const imageSchema = z.object({
  src: z.string().max(2048),
  alt: z.string().max(500),
  position: z
    .string()
    .regex(/^\d{1,3}% \d{1,3}%$/)
    .refine(
      (v) => v.split(" ").every((n) => parseInt(n) <= 100),
      "Crop position must be 0–100%.",
    ),
});
export const seoSchema = z.object({
  seo_title: z.string().trim().min(1, "Enter an SEO title.").max(160),
  seo_description: z.string().trim().max(500),
  social_image: z.string().max(2048).nullable(),
  noindex: z.boolean(),
});
export const sectionsSchema = z.object({
  text: z.record(z.string(), z.string().max(20000)),
  images: z.record(z.string(), imageSchema),
  links: z.record(
    z.string(),
    z
      .string()
      .max(2048)
      .refine(safeLink, "Enter a valid web, email, phone, or local link."),
  ),
});
export const pageInputSchema = seoSchema.extend({
  page_id: z.string().min(1).max(100),
  locale: localeSchema,
  sections: sectionsSchema,
  version: z.number().int().positive(),
});
const nodeTypes = new Set([
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "codeBlock",
  "image",
  "table",
  "tableRow",
  "tableHeader",
  "tableCell",
]);
const marks = new Set([
  "bold",
  "italic",
  "strike",
  "underline",
  "code",
  "link",
]);
export function validateRich(value: unknown): value is RichNode {
  let nodes = 0;
  function walk(n: any, depth: number): boolean {
    if (
      !n ||
      typeof n !== "object" ||
      Array.isArray(n) ||
      ++nodes > 10000 ||
      depth > 30 ||
      !nodeTypes.has(n.type)
    )
      return false;
    if (
      n.text !== undefined &&
      (n.type !== "text" ||
        typeof n.text !== "string" ||
        n.text.length > 100000)
    )
      return false;
    if (n.attrs) {
      const allowed: Record<string, string[]> = {
        heading: ["level"],
        orderedList: ["start", "type"],
        codeBlock: ["language"],
        image: ["src", "alt", "title", "width", "height"],
        table: ["style"],
        tableCell: ["colspan", "rowspan", "colwidth", "align"],
        tableHeader: ["colspan", "rowspan", "colwidth", "align"],
      };
      if (
        Object.keys(n.attrs).some((k) => !(allowed[n.type] || []).includes(k))
      )
        return false;
      if (n.type === "heading" && ![2, 3].includes(n.attrs.level)) return false;
      if (
        n.type === "image" &&
        (typeof n.attrs.src !== "string" || !safeLink(n.attrs.src))
      )
        return false;
      if (n.attrs.style != null) return false;
      for (const k of ["width", "height", "colspan", "rowspan", "start"])
        if (
          n.attrs[k] != null &&
          (!Number.isInteger(n.attrs[k]) ||
            n.attrs[k] < 1 ||
            n.attrs[k] > 10000)
        )
          return false;
      if (
        n.attrs.colwidth != null &&
        (!Array.isArray(n.attrs.colwidth) ||
          n.attrs.colwidth.length > 50 ||
          n.attrs.colwidth.some(
            (x: unknown) =>
              !Number.isInteger(x) || Number(x) < 1 || Number(x) > 10000,
          ))
      )
        return false;
      if (
        n.attrs.align != null &&
        !["left", "center", "right"].includes(n.attrs.align)
      )
        return false;
      for (const k of ["alt", "title", "language"])
        if (
          n.attrs[k] != null &&
          (typeof n.attrs[k] !== "string" || n.attrs[k].length > 500)
        )
          return false;
    }
    if (
      n.marks &&
      (!Array.isArray(n.marks) ||
        n.marks.some(
          (m: any) =>
            !marks.has(m.type) ||
            (m.type === "link" &&
              (!m.attrs ||
                typeof m.attrs.href !== "string" ||
                !safeLink(m.attrs.href))) ||
            (m.attrs &&
              Object.keys(m.attrs).some(
                (k) => !["href", "target", "rel", "class", "title"].includes(k),
              )),
        ))
    )
      return false;
    return (
      !n.content ||
      (Array.isArray(n.content) &&
        n.content.every((c: any) => walk(c, depth + 1)))
    );
  }
  if (
    (value as any)?.type !== "doc" ||
    JSON.stringify(value).length > 1000000 ||
    !walk(value, 0)
  )
    return false;
  try {
    richSchema.nodeFromJSON(value).check();
    return true;
  } catch {
    return false;
  }
}
export const postInputSchema = seoSchema
  .extend({
    id: z.uuid().optional(),
    byline: z.string().max(300).default(""),
    reading_time: z.string().max(100).default(""),
    locale: localeSchema,
    slug: z
      .string()
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers and hyphens.",
      )
      .max(100),
    category: z.enum(["essay", "research", "guide", "news"]),
    status: z.enum(["draft", "published"]),
    title: z.string().trim().min(1).max(240),
    excerpt: z.string().max(1000),
    body: z.custom<RichNode>(
      validateRich,
      "The article contains unsupported formatting or an unsafe link.",
    ),
    cover: imageSchema,
    version: z.number().int().nonnegative(),
  })
  .superRefine((v, ctx) => {
    if (v.status === "published" && !JSON.stringify(v.body).includes('"text"'))
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Add article content before publishing.",
      });
  });
export function errorMessage(error: unknown) {
  if (error instanceof z.ZodError)
    return error.issues
      .map((x) => `${x.path.join(".")}: ${x.message}`)
      .slice(0, 3)
      .join(" ");
  if (error instanceof Error && error.name === "ClientError")
    return error.message;
  console.error("CMS operation failed", error);
  return "Something went wrong. Your changes have not been confirmed. Please retry.";
}
export class ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClientError";
  }
}
