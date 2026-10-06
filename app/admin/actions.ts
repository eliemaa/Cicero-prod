"use server";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { template, pages } from "@/lib/content";
import { validateImages, richImages } from "@/lib/media";
import {
  pageInputSchema,
  postInputSchema,
  ClientError,
  errorMessage,
} from "@/lib/validation";
import { publicPath } from "@/lib/urls";
import { z } from "zod";
function databaseError(error: { message: string; code?: string }) {
  if (error.message.includes("CMS_CONFLICT"))
    throw new ClientError(
      "This content changed in another tab. Reload before saving again. Copy your unsaved changes first.",
    );
  if (error.code === "23505")
    throw new ClientError(
      "That URL is already used by another post. Choose a different slug.",
    );
  throw error;
}
function invalidatePosts(slugs: string[]) {
  updateTag("posts");
  for (const slug of slugs) if (slug) revalidatePath(`/insights/${slug}`);
  revalidatePath("/insights");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/posts");
}
export async function savePage(input: unknown) {
  try {
    await requireAdmin();
    const p = pageInputSchema.parse(input);
    if (!pages.some((x) => x.slug === p.page_id))
      throw new ClientError("Unknown page.");
    const t = await template(p.page_id, p.locale);
    if (
      JSON.stringify(Object.keys(p.sections.text).sort()) !==
        JSON.stringify(Object.keys(t.defaults.text).sort()) ||
      JSON.stringify(Object.keys(p.sections.images).sort()) !==
        JSON.stringify(Object.keys(t.defaults.images).sort())
    )
      throw new ClientError("The page structure changed. Reload the editor.");
    if (
      JSON.stringify(Object.keys(p.sections.links).sort()) !==
      JSON.stringify(Object.keys(t.defaults.links).sort())
    )
      throw new ClientError("The page links changed. Reload the editor.");
    const media_ids = await validateImages([
      ...Object.values(p.sections.images).map((i) => i.src),
      p.social_image || "",
    ]);
    const { data, error } = await db().rpc("save_page", { p, media_ids });
    if (error) databaseError(error);
    updateTag(`page:${p.page_id}`);
    revalidatePath(publicPath(p.page_id));
    revalidatePath("/sitemap.xml");
    revalidatePath(`/admin/pages/${p.page_id}`);
    return { ok: true as const, version: data as number };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error) };
  }
}
export async function savePost(input: unknown) {
  try {
    await requireAdmin();
    const p = postInputSchema.parse(input);
    const media_ids = await validateImages([
      p.cover.src,
      p.social_image || "",
      ...richImages(p.body),
    ]);
    const { data, error } = await db().rpc("save_post", { p, media_ids });
    if (error) databaseError(error);
    invalidatePosts([p.slug, data.previous_slug]);
    return {
      ok: true as const,
      id: data.id as string,
      version: data.version as number,
    };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error) };
  }
}
export async function deletePost(input: unknown) {
  try {
    await requireAdmin();
    const p = z
      .object({ id: z.uuid(), version: z.number().int().positive() })
      .parse(input);
    const { data, error } = await db().rpc("delete_post", {
      pid: p.id,
      expected_version: p.version,
    });
    if (error) databaseError(error);
    invalidatePosts([data]);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: errorMessage(error) };
  }
}
