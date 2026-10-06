import { siteURL } from "@/lib/urls";
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin"] },
    sitemap: `${siteURL()}/sitemap.xml`,
  };
}
