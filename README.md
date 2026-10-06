# Cicero website and content studio

Next.js App Router website with a custom CMS at `/admin`, Clerk authentication for one client account, and Supabase Postgres + Storage. The CMS uses the site's burgundy buttons, typography, and black-and-white palette.

## What the client can edit

- Page copy, CTA/navigation/contact links, image placements, alternative text and crop positions, grouped by the existing sections. Layouts stay fixed.
- Eight standard pages: home, platform, languages, security, pricing, insights, contact/booking (`demo`), and the case study.
- Six imported insights, including the guide and research note; create, edit, delete, publish, or unpublish posts. Rich text supports headings, lists, links, quotes, tables, and images.
- SEO titles, descriptions, social images and search indexing per page/post and language.
- All seven existing languages: English, Arabic, French, German, Spanish, Italian and Portuguese. Arabic renders RTL. New posts begin in English; opening another language starts with English copy until its translation is saved. There is no automatic translation.
- Drag-and-drop JPG/PNG/WebP uploads up to 4 MB, with progress and retry. The server validates/decode-checks images, limits pixel count, strips metadata, normalizes orientation and stores WebP. Referenced images cannot be deleted, including images used by draft posts.

Pages save directly to the live site. Only posts have drafts. There are no roles, approval workflows, or revision-history UI. The admin's `version` counters prevent one browser tab from silently overwriting another tab's edits.

## First-time setup

Requires Node.js 20.19+ (Node 22 LTS recommended), npm, a Clerk application, and a Supabase project. No live services or deployment were created by the local implementation.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local`. Keep secrets out of source control and browser code.
3. Set `NEXT_PUBLIC_SITE_URL` to the exact origin you will use (for example `http://localhost:3000` locally, or your production HTTPS domain). Media mutations verify this origin. Do not mix `localhost` and `127.0.0.1`.
4. In Clerk, create/invite the one client account, disable public sign-up, and restrict access to that account. Copy its stable `user_…` identifier to `CLERK_ADMIN_USER_ID`. Set the publishable and secret keys. Use production Clerk keys/domain configuration for production hosting. Sign-in lives at `/admin/sign-in` and returns to `/admin`.
5. In your Supabase SQL editor, run [`supabase/migrations/001_cms.sql`](supabase/migrations/001_cms.sql). It creates tables, constraints, protected transaction functions and the `site-media` bucket. Use a dedicated project, or inspect the migration before applying it to an existing project.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. This key is server-only. No public Supabase key or browser database client is needed.
7. Run `npm run db:seed` to import all existing copy and translations. The seed does not overwrite existing page content. It skips existing posts and their translations, preserving subsequent client edits. Run it once after applying the migration.
8. Run `npm run dev`, open `/admin`, and sign in with the configured account.

When credentials are absent, the public website renders the imported original content; `/admin` stays locked. When Supabase is configured, database failures show an error rather than silently serving the seed as if it were live content.

## Deployment

Use a Next.js-capable host (for example a Node server or Vercel), **not static HTML hosting or `output: 'export'`**. Configure production environment variables and seed the database before running `npm run build`; start a Node deployment with `npm start`.

After connecting services, verify:

1. The allowed client can sign in; a different account cannot access page data, actions or uploads.
2. Edit one English page field and an Arabic field, save, and verify each public page and its metadata immediately.
3. Upload an image, use it on a page, and verify deletion is blocked while it is referenced.
4. Create a draft post and verify its public URL returns 404. Publish, edit, unpublish and delete it; check `/insights` and `/sitemap.xml` after each change.
5. Open the same editor in two tabs, save in one, then save in the other. The second save must report a conflict.

Supabase database/storage backups and Clerk account recovery should be configured through those services. Uploaded images are public marketing assets even when attached to a draft; unpublished article content is not publicly readable.

## Routes and data

Public routes: `/`, `/platform`, `/languages`, `/security`, `/pricing`, `/demo`, `/case-late-production`, `/insights`, `/insights/[slug]`. Old `.html` addresses redirect permanently to their new routes. Language links use `?lang=ar` (or another supported locale). New post slugs must be unique; changing a published slug changes its address, so prefer keeping it stable.

Admin routes: `/admin`, `/admin/pages/[slug]`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]`, `/admin/media`, `/admin/sign-in`. Media operations use `/api/admin/media`; content saves use authenticated Next.js Server Actions.

Tables: `pages`, `page_content`, `posts`, `post_content`, `media`, plus `page_media`/`post_media` reference tables. Database reads and mutations are server-only. RLS is enabled, anonymous/authenticated SQL grants are revoked, and save/delete RPCs are executable only by `service_role`. Every admin operation independently checks the configured Clerk user ID. Post mutations and media reference changes are atomic database transactions.

Public content is cached with page-specific tags and a published-posts tag. Saving expires affected tags with `updateTag` and revalidates the relevant routes and sitemap with `revalidatePath`. There is no unauthenticated revalidation endpoint.

## Development and checks

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
```

Browser tests start their own local server. They use installed Chrome on macOS or Playwright Chromium elsewhere; set `CHROME_PATH` for a custom browser location.

Tests run against embedded PostgreSQL (PGlite) and validate schema/RPC behavior, stale-write conflicts, duplicate slugs, media foreign-key protection, draft filtering, access grants, rich-text safety, and every imported language. Browser checks also covered public routing, language switching, menus, booking-button colors, mobile editor layout, rich text, the media chooser, and rejection of unauthenticated saves. Live Clerk/Supabase integration needs the credentials described above.

- `app/` — public/admin routes, authenticated actions, media handler, sitemap and metadata.
- `components/admin/` — page/post editors, image library, rich text and SEO controls.
- `lib/` — authentication, validation, rendering, cached data and media checks.
- `supabase/migrations/` — database setup.
- `content/templates/` — fixed presentation templates and editable-field definitions, one per page/language. Client values are escaped; clients cannot change template HTML.
- `content/posts.json` — initial multilingual article seed.
- `scripts/import-content.ts` — deterministic migration from original HTML/translation files. `npm run content:import` regenerates template seeds and public assets; it does not modify live database content. Changing field structure after client editing requires a database content migration; do not reseed over client edits.
- `public/images`, `public/film`, `public/js` — migrated assets and preserved interactions.
- Root `.html`, `js/` and `images/` files remain as migration source material, not served public routes.

Existing quote carousel, language selection, menu, pricing calculator, accordions, tabs and hero film are retained. Contact-request and briefing-signup forms retain their original behavior; connecting them to email or a CRM is outside this CMS implementation.
