import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { authConfigured } from "@/lib/auth";
import { configured } from "@/lib/supabase";
export const dynamic = "force-dynamic";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!authConfigured() || !configured())
    return (
      <main className="setup">
        <span className="eyebrow">Cicero / Content studio</span>
        <h1>Connect your content studio.</h1>
        <p>
          The dashboard is locked until Clerk, the administrator account, and
          Supabase are configured. Follow the setup steps in README.md.
        </p>
        <a className="button" href="/">
          View website
        </a>
      </main>
    );
  const { userId } = await auth();
  if (!userId) redirect("/admin/sign-in");
  if (userId !== process.env.CLERK_ADMIN_USER_ID)
    return (
      <main className="setup">
        <h1>Access restricted</h1>
        <p>This dashboard is available to the site owner’s account.</p>
        <UserButton />
        <a href="/">Return to website</a>
      </main>
    );
  return (
    <>
      <header className="admin-header">
        <a className="brand" href="/admin">
          cicero<span>.</span>
          <small>CONTENT STUDIO</small>
        </a>
        <div className="header-actions">
          <a href="/" target="_blank" rel="noreferrer">
            View website ↗
          </a>
          <UserButton />
        </div>
      </header>
      <div className="admin-shell">
        <aside className="sidebar">
          <span className="eyebrow">Workspace</span>
          <nav aria-label="Dashboard">
            <a href="/admin">Overview</a>
            <a href="/admin#pages">Pages</a>
            <a href="/admin/posts">Journal & insights</a>
            <a href="/admin/media">Image library</a>
          </nav>
          <p>
            Make it yours.
            <br />
            Keep it Cicero.
          </p>
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </>
  );
}
