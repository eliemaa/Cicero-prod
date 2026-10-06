create table public.pages (
 id text primary key, slug text not null unique, template text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.page_content (
 page_id text not null references public.pages(id) on delete cascade,
 locale text not null check(locale in ('en','ar','fr','de','es','it','pt')),
 sections jsonb not null check(jsonb_typeof(sections)='object'),
 seo_title text not null check(length(seo_title) between 1 and 160), seo_description text not null default '' check(length(seo_description)<=500),
 social_image text, noindex boolean not null default false, version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(), primary key(page_id,locale)
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=100),
 category text not null check(category in ('essay','research','guide','news')),
 status text not null default 'draft' check(status in ('draft','published')),
 published_at timestamptz, version integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(status='draft' or published_at is not null)
);
create table public.post_content (
 post_id uuid not null references public.posts(id) on delete cascade,
 locale text not null check(locale in ('en','ar','fr','de','es','it','pt')),
 byline text not null default '' check(length(byline)<=300), reading_time text not null default '' check(length(reading_time)<=100),
 title text not null check(length(title) between 1 and 240), excerpt text not null default '' check(length(excerpt)<=1000),
 body jsonb not null check(body->>'type'='doc'), cover jsonb not null,
 seo_title text not null check(length(seo_title) between 1 and 160), seo_description text not null default '' check(length(seo_description)<=500),
 social_image text, noindex boolean not null default false, version integer not null default 1,
 updated_at timestamptz not null default now(), primary key(post_id,locale)
);
create table public.media (
 id uuid primary key default gen_random_uuid(), path text not null unique,
 filename text not null, mime_type text not null check(mime_type in ('image/jpeg','image/png','image/webp')),
 size integer not null check(size>0 and size<=4194304), width integer not null, height integer not null,
 created_at timestamptz not null default now()
);
create table public.page_media (
 page_id text not null, locale text not null, media_id uuid not null references public.media(id) on delete restrict,
 foreign key(page_id,locale) references public.page_content(page_id,locale) on delete cascade,
 primary key(page_id,locale,media_id)
);
create table public.post_media (
 post_id uuid not null, locale text not null, media_id uuid not null references public.media(id) on delete restrict,
 foreign key(post_id,locale) references public.post_content(post_id,locale) on delete cascade,
 primary key(post_id,locale,media_id)
);
create index posts_published on public.posts(published_at desc) where status='published';
create index page_media_lookup on public.page_media(media_id);
create index post_media_lookup on public.post_media(media_id);
-- All data access is through authenticated Next.js server code. No browser grants.
alter table public.pages enable row level security;
alter table public.page_content enable row level security;
alter table public.posts enable row level security;
alter table public.post_content enable row level security;
alter table public.media enable row level security;
alter table public.page_media enable row level security;
alter table public.post_media enable row level security;
revoke all on public.pages,public.page_content,public.posts,public.post_content,public.media,public.page_media,public.post_media from anon,authenticated;
grant all on public.pages,public.page_content,public.posts,public.post_content,public.media,public.page_media,public.post_media to service_role;

-- Compare-and-swap plus media references commit atomically, including cross-tab edits.
create function public.save_page(p jsonb, media_ids uuid[]) returns integer language plpgsql set search_path='' as $$
declare next_version integer;
begin
 update public.page_content set sections=p->'sections',seo_title=p->>'seo_title',seo_description=p->>'seo_description',social_image=p->>'social_image',noindex=(p->>'noindex')::boolean,version=version+1,updated_at=now()
 where page_id=p->>'page_id' and locale=p->>'locale' and version=(p->>'version')::integer returning version into next_version;
 if next_version is null then raise exception 'CMS_CONFLICT'; end if;
 delete from public.page_media where page_id=p->>'page_id' and locale=p->>'locale';
 insert into public.page_media select p->>'page_id',p->>'locale',unnest(media_ids);
 update public.pages set updated_at=now() where id=p->>'page_id';
 return next_version;
end $$;
create function public.save_post(p jsonb, media_ids uuid[]) returns jsonb language plpgsql set search_path='' as $$
declare pid uuid; next_version integer; previous_slug text;
begin
 if p->>'id' is null then
  if p->>'locale'<>'en' then raise exception 'CMS_ENGLISH_FIRST'; end if;
  insert into public.posts(slug,category,status,published_at) values(p->>'slug',p->>'category',p->>'status',case when p->>'status'='published' then now() else null end) returning id,version into pid,next_version;
 else
  pid=(p->>'id')::uuid;
  select slug into previous_slug from public.posts where id=pid for update;
  update public.posts set slug=p->>'slug',category=p->>'category',status=p->>'status',published_at=case when p->>'status'='published' then coalesce(published_at,now()) else published_at end,version=version+1,updated_at=now()
   where id=pid and version=(p->>'version')::integer returning version into next_version;
  if next_version is null then raise exception 'CMS_CONFLICT'; end if;
 end if;
 insert into public.post_content(post_id,locale,byline,reading_time,title,excerpt,body,cover,seo_title,seo_description,social_image,noindex)
 values(pid,p->>'locale',coalesce(p->>'byline',''),coalesce(p->>'reading_time',''),p->>'title',p->>'excerpt',p->'body',p->'cover',p->>'seo_title',p->>'seo_description',p->>'social_image',(p->>'noindex')::boolean)
 on conflict(post_id,locale) do update set byline=excluded.byline,reading_time=excluded.reading_time,title=excluded.title,excerpt=excluded.excerpt,body=excluded.body,cover=excluded.cover,seo_title=excluded.seo_title,seo_description=excluded.seo_description,social_image=excluded.social_image,noindex=excluded.noindex,version=public.post_content.version+1,updated_at=now();
 delete from public.post_media where post_id=pid and locale=p->>'locale';
 insert into public.post_media select pid,p->>'locale',unnest(media_ids);
 return jsonb_build_object('id',pid,'version',next_version,'previous_slug',previous_slug);
end $$;
create function public.delete_post(pid uuid, expected_version integer) returns text language plpgsql set search_path='' as $$
declare removed_slug text;
begin
 delete from public.posts where id=pid and version=expected_version returning slug into removed_slug;
 if removed_slug is null then raise exception 'CMS_CONFLICT'; end if;
 return removed_slug;
end $$;
revoke all on function public.save_page(jsonb,uuid[]),public.save_post(jsonb,uuid[]),public.delete_post(uuid,integer) from public,anon,authenticated;
grant execute on function public.save_page(jsonb,uuid[]),public.save_post(jsonb,uuid[]),public.delete_post(uuid,integer) to service_role;
-- Images are public marketing assets. Upload/delete remain server-only; drafts themselves are private.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('site-media','site-media',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
