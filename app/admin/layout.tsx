import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./admin.css";
export const metadata: Metadata = {
  title: "Cicero · Content studio",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = <div className="admin">{children}</div>;
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY ? (
    <ClerkProvider>{content}</ClerkProvider>
  ) : (
    content
  );
}
