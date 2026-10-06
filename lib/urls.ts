export function safeLink(value: string): boolean {
  return (
    /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) &&
    !/[\u0000-\u0020\\]/.test(value)
  );
}
export function escapeHTML(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function publicPath(slug: string) {
  return slug === "home" ? "/" : `/${slug}`;
}
export function siteURL() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
