/*
# Community content: edits, build galleries, article slugs

1. discussion_comments had INSERT/DELETE policies but no UPDATE, so a
   reply could never be edited by its author (TC-09-03). Adds an author-only
   UPDATE policy plus a guard so an edit cannot move the reply to another
   thread or hand it to another member. (discussions already has
   update_own_discussions = author OR is_admin(), from 015/027, which is
   also what lets an admin flip is_featured - guard_discussion_featured
   keeps that column admin-only.)

2. builds.image_urls text[] - up to 4 images per build (TC-09-08).
   image_url stays for back-compat; the app writes image_urls[1] there too.
   Existing image_url values are copied into image_urls once.

3. articles.slug - unique, URL-safe, backfilled from title. A BEFORE INSERT
   (and BEFORE UPDATE when slug is blank) trigger fills it, so the admin
   article form keeps working without sending a slug (TC-10-03). Slugs do
   not follow later title edits, so shared links keep working.
   Published articles also get an anon SELECT policy so /articles/{slug}
   (and its server-side metadata) renders for guests.

Idempotent: safe to re-run.
*/

-- ---------------------------------------------------------------------------
-- 1. DISCUSSION REPLIES - author edits own reply
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "update_own_discussion_comments" ON discussion_comments;
CREATE POLICY "update_own_discussion_comments" ON discussion_comments FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE OR REPLACE FUNCTION guard_discussion_comment_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.discussion_id := OLD.discussion_id;
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_discussion_comment_owner ON discussion_comments;
CREATE TRIGGER guard_discussion_comment_owner BEFORE UPDATE ON discussion_comments
  FOR EACH ROW EXECUTE FUNCTION guard_discussion_comment_owner();

-- ---------------------------------------------------------------------------
-- 2. BUILDS - image gallery (max 4)
-- ---------------------------------------------------------------------------

ALTER TABLE builds ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';

UPDATE builds
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL AND image_url <> '' AND cardinality(image_urls) = 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'builds_image_urls_max_4') THEN
    ALTER TABLE builds ADD CONSTRAINT builds_image_urls_max_4 CHECK (cardinality(image_urls) <= 4);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. ARTICLES - slug
-- ---------------------------------------------------------------------------

ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug text;

CREATE OR REPLACE FUNCTION slugify_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(
      left(trim(BOTH '-' FROM regexp_replace(lower(COALESCE(input, '')), '[^a-z0-9]+', '-', 'g')), 80),
      ''
    ),
    'article'
  );
$$;

CREATE OR REPLACE FUNCTION unique_article_slug(base text, self_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text := base;
  n integer := 1;
BEGIN
  WHILE EXISTS (SELECT 1 FROM articles WHERE slug = candidate AND id IS DISTINCT FROM self_id) LOOP
    n := n + 1;
    candidate := base || '-' || n;
  END LOOP;
  RETURN candidate;
END;
$$;

-- Backfill, oldest first so the original article keeps the bare slug.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id, title FROM articles WHERE slug IS NULL OR slug = '' ORDER BY created_at, id LOOP
    UPDATE articles SET slug = unique_article_slug(slugify_text(r.title), r.id) WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS articles_slug_key ON articles(slug);

CREATE OR REPLACE FUNCTION set_article_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR btrim(NEW.slug) = '' THEN
    NEW.slug := unique_article_slug(slugify_text(NEW.title), NEW.id);
  ELSE
    NEW.slug := unique_article_slug(slugify_text(NEW.slug), NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Insert: always derive (from the given slug, else the title). Update: only
-- when the caller touches slug, so a title edit keeps the published URL.
DROP TRIGGER IF EXISTS set_article_slug ON articles;
DROP TRIGGER IF EXISTS set_article_slug_insert ON articles;
CREATE TRIGGER set_article_slug_insert BEFORE INSERT ON articles
  FOR EACH ROW EXECUTE FUNCTION set_article_slug();

DROP TRIGGER IF EXISTS set_article_slug_update ON articles;
CREATE TRIGGER set_article_slug_update BEFORE UPDATE OF slug ON articles
  FOR EACH ROW
  WHEN (NEW.slug IS DISTINCT FROM OLD.slug OR NEW.slug IS NULL OR btrim(NEW.slug) = '')
  EXECUTE FUNCTION set_article_slug();

-- Guests read published articles (detail page + server-side metadata).
DROP POLICY IF EXISTS "select_articles_published_public" ON articles;
CREATE POLICY "select_articles_published_public" ON articles FOR SELECT
  TO anon, authenticated USING (is_published = true);
