/*
# admin_user_activity(): per-member feature usage for the admin panel

The admin panel could answer "what is waiting for me" but not "who is
actually using this platform, and for what". This adds one function that
returns a row per member with a count for every feature they have touched,
plus a derived activity summary.

Why a SECURITY DEFINER function rather than a view: the counts span tables
whose RLS deliberately hides other people's rows (messages, applications,
bookings). A view would be filtered down to whatever the caller can already
see, which is exactly the wrong answer for an admin report. The function
bypasses RLS and then re-imposes the only check that matters, is_admin(),
so a non-admin calling it gets an exception rather than data.

last_active_at is the most recent timestamp across everything the member has
created, which is the closest thing to a real activity signal without adding
session tracking.
*/

CREATE OR REPLACE FUNCTION admin_user_activity()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  location text,
  roles text[],
  joined_at timestamptz,
  last_active_at timestamptz,
  jobs_posted bigint,
  job_applications bigint,
  projects_posted bigint,
  project_bids bigint,
  courses_taught bigint,
  enrollments bigint,
  certificates bigint,
  events_created bigint,
  event_rsvps bigint,
  bookings_as_talent bigint,
  bookings_as_client bigint,
  discussions bigint,
  discussion_comments bigint,
  builds bigint,
  build_likes bigint,
  teams_owned bigint,
  team_memberships bigint,
  team_collabs bigint,
  agencies_owned bigint,
  articles bigint,
  messages_sent bigint,
  experiences bigint,
  skills bigint,
  total_records bigint,
  features_used int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id, p.full_name, p.email, p.avatar_url, p.location, p.created_at,
      COALESCE((SELECT array_agg(r.role ORDER BY r.role) FROM user_roles r WHERE r.user_id = p.id), ARRAY[]::text[]) AS roles,
      (SELECT count(*) FROM jobs j JOIN companies c ON c.id = j.company_id WHERE c.user_id = p.id) AS c_jobs,
      (SELECT count(*) FROM job_applications x WHERE x.user_id = p.id) AS c_apps,
      (SELECT count(*) FROM projects x WHERE x.user_id = p.id) AS c_projects,
      (SELECT count(*) FROM project_bids x WHERE x.user_id = p.id) AS c_bids,
      (SELECT count(*) FROM courses x WHERE x.coach_id = p.id) AS c_courses,
      (SELECT count(*) FROM enrollments x WHERE x.user_id = p.id) AS c_enrol,
      (SELECT count(*) FROM certificates x WHERE x.user_id = p.id) AS c_certs,
      (SELECT count(*) FROM events x WHERE x.created_by = p.id) AS c_events,
      (SELECT count(*) FROM event_rsvps x WHERE x.user_id = p.id) AS c_rsvps,
      (SELECT count(*) FROM bookings x WHERE x.talent_id = p.id) AS c_btal,
      (SELECT count(*) FROM bookings x WHERE x.client_id = p.id) AS c_bcli,
      (SELECT count(*) FROM discussions x WHERE x.user_id = p.id) AS c_disc,
      (SELECT count(*) FROM discussion_comments x WHERE x.user_id = p.id) AS c_cmt,
      (SELECT count(*) FROM builds x WHERE x.user_id = p.id) AS c_builds,
      (SELECT count(*) FROM build_likes x WHERE x.user_id = p.id) AS c_likes,
      (SELECT count(*) FROM teams x WHERE x.owner_id = p.id) AS c_teams,
      (SELECT count(*) FROM team_members x WHERE x.user_id = p.id) AS c_tmem,
      (SELECT count(*) FROM team_collabs x WHERE x.created_by = p.id) AS c_collab,
      (SELECT count(*) FROM agencies x WHERE x.owner_id = p.id) AS c_agency,
      (SELECT count(*) FROM articles x WHERE x.author_id = p.id) AS c_articles,
      (SELECT count(*) FROM messages x WHERE x.sender_id = p.id) AS c_msgs,
      (SELECT count(*) FROM experiences x WHERE x.user_id = p.id) AS c_exp,
      (SELECT count(*) FROM user_skills x WHERE x.user_id = p.id) AS c_skills,
      GREATEST(
        p.created_at,
        COALESCE((SELECT max(x.created_at) FROM discussions x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM discussion_comments x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM builds x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM build_likes x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM messages x WHERE x.sender_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM job_applications x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM project_bids x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.enrolled_at) FROM enrollments x WHERE x.user_id = p.id), p.created_at),
        COALESCE((SELECT max(x.created_at) FROM event_rsvps x WHERE x.user_id = p.id), p.created_at)
      ) AS last_active
    FROM profiles p
  )
  SELECT
    b.id, b.full_name, b.email, b.avatar_url, b.location, b.roles, b.created_at, b.last_active,
    b.c_jobs, b.c_apps, b.c_projects, b.c_bids, b.c_courses, b.c_enrol, b.c_certs,
    b.c_events, b.c_rsvps, b.c_btal, b.c_bcli, b.c_disc, b.c_cmt, b.c_builds, b.c_likes,
    b.c_teams, b.c_tmem, b.c_collab, b.c_agency, b.c_articles, b.c_msgs, b.c_exp, b.c_skills,
    (b.c_jobs + b.c_apps + b.c_projects + b.c_bids + b.c_courses + b.c_enrol + b.c_certs
     + b.c_events + b.c_rsvps + b.c_btal + b.c_bcli + b.c_disc + b.c_cmt + b.c_builds
     + b.c_likes + b.c_teams + b.c_tmem + b.c_collab + b.c_agency + b.c_articles
     + b.c_msgs + b.c_exp + b.c_skills) AS total_records,
    ( (b.c_jobs>0)::int + (b.c_apps>0)::int + (b.c_projects>0)::int + (b.c_bids>0)::int
    + (b.c_courses>0)::int + (b.c_enrol>0)::int + (b.c_certs>0)::int + (b.c_events>0)::int
    + (b.c_rsvps>0)::int + (b.c_btal>0)::int + (b.c_bcli>0)::int + (b.c_disc>0)::int
    + (b.c_cmt>0)::int + (b.c_builds>0)::int + (b.c_likes>0)::int + (b.c_teams>0)::int
    + (b.c_tmem>0)::int + (b.c_collab>0)::int + (b.c_agency>0)::int + (b.c_articles>0)::int
    + (b.c_msgs>0)::int + (b.c_exp>0)::int + (b.c_skills>0)::int ) AS features_used
  FROM base b
  ORDER BY total_records DESC, b.full_name;
END;
$$;

REVOKE ALL ON FUNCTION admin_user_activity() FROM public;
GRANT EXECUTE ON FUNCTION admin_user_activity() TO authenticated;
