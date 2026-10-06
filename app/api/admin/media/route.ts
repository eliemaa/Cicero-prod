import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { mediaURL } from "@/lib/media";
import { ClientError, errorMessage } from "@/lib/validation";
import { z } from "zod";
export const runtime = "nodejs";
const MAX = 4 * 1024 * 1024;
function sameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  if (origin !== new URL(allowed).origin)
    throw new ClientError(
      "Upload request origin is not allowed. Reload the dashboard.",
    );
}
async function authorize() {
  try {
    await requireAdmin();
    return null;
  } catch {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }
}
export async function GET() {
  const denied = await authorize();
  if (denied) return denied;
  const { data, error } = await db()
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error)
    return NextResponse.json(
      { error: "Could not load images. Please retry." },
      { status: 500 },
    );
  return NextResponse.json(
    data.map((m) => ({ ...m, url: mediaURL(m.path) })),
    { headers: { "Cache-Control": "no-store" } },
  );
}
export async function POST(req: NextRequest) {
  const denied = await authorize();
  if (denied) return denied;
  try {
    sameOrigin(req);
    // Bound the multipart body even when Content-Length is absent or inaccurate.
    const reader = req.body?.getReader();
    if (!reader) throw new ClientError("Choose an image.");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX + 65536) {
        await reader.cancel();
        throw new ClientError("Images must be 4 MB or smaller.");
      }
      chunks.push(value);
    }
    const form = await new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX)
      throw new ClientError("Choose a JPG, PNG, or WebP image under 4 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(bytes, { limitInputPixels: 40000000 }).metadata();
    if (
      !["jpeg", "png", "webp"].includes(meta.format || "") ||
      (meta.pages || 1) > 1
    )
      throw new ClientError("Use a still JPG, PNG, or WebP image.");
    // Decode and re-encode: validate the actual image, normalize orientation, strip metadata.
    const { data: clean, info } = await sharp(bytes, {
      limitInputPixels: 40000000,
    })
      .rotate()
      .webp({ quality: 88 })
      .toBuffer({ resolveWithObject: true });
    if (clean.length > MAX)
      throw new ClientError("This image is too large. Choose a smaller image.");
    const path = `${crypto.randomUUID()}.webp`;
    const store = db();
    const upload = await store.storage.from("site-media").upload(path, clean, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (upload.error) throw upload.error;
    const { data, error } = await store
      .from("media")
      .insert({
        path,
        filename: file.name.slice(0, 255),
        mime_type: "image/webp",
        size: clean.length,
        width: info.width,
        height: info.height,
      })
      .select()
      .single();
    if (error) {
      await store.storage.from("site-media").remove([path]);
      throw error;
    }
    return NextResponse.json({ ...data, url: mediaURL(path) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: error instanceof ClientError ? 400 : 500 },
    );
  }
}
export async function DELETE(req: NextRequest) {
  const denied = await authorize();
  if (denied) return denied;
  try {
    sameOrigin(req);
    const id = z.uuid().parse(req.nextUrl.searchParams.get("id"));
    const store = db();
    const { data, error } = await store
      .from("media")
      .delete()
      .eq("id", id)
      .select()
      .single();
    if (error?.code === "23503")
      throw new ClientError(
        "This image is used by a page or post. Replace it there before deleting it.",
      );
    if (error) throw error;
    const removed = await store.storage.from("site-media").remove([data.path]);
    if (removed.error) {
      await store.from("media").insert(data);
      throw new ClientError(
        "Storage could not remove this image. Please retry.",
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: errorMessage(error) },
      { status: error instanceof ClientError ? 409 : 500 },
    );
  }
}
