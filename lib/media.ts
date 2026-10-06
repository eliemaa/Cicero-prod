import "server-only";
import fs from "node:fs/promises";
import { db } from "./supabase";
import { ClientError } from "./validation";
import type { RichNode } from "./types";
export function mediaURL(path: string) {
  return db().storage.from("site-media").getPublicUrl(path).data.publicUrl;
}
export function richImages(node: RichNode): string[] {
  return [
    ...(node.type === "image" ? [String(node.attrs?.src || "")] : []),
    ...(node.content || []).flatMap(richImages),
  ];
}
export async function validateImages(sources: string[]): Promise<string[]> {
  const srcs = [...new Set(sources.filter(Boolean))];
  const local = new Set(
    (await fs.readdir("public/images")).map((x) => "/images/" + x),
  );
  const paths: string[] = [];
  for (const src of srcs) {
    if (local.has(src)) continue;
    const prefix = mediaURL("");
    if (!src.startsWith(prefix))
      throw new ClientError("Choose an image from the media library.");
    const path = src.slice(prefix.length);
    if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(path))
      throw new ClientError("Invalid image path.");
    paths.push(path);
  }
  if (!paths.length) return [];
  const { data, error } = await db()
    .from("media")
    .select("id,path")
    .in("path", paths);
  if (error) throw error;
  if (data.length !== paths.length)
    throw new ClientError(
      "An image was removed. Choose it again before saving.",
    );
  return data.map((m) => m.id);
}
