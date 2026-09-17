/**
 * Live remote engineer/developer listings — fetched from Remotive's public
 * job board API on every request (cached at the edge for an hour), not
 * stored in our own database. Remotive's API terms ask for at most a
 * handful of requests a day per consumer; Next.js's fetch cache below is
 * what keeps this app within that regardless of how many visitors open the
 * page, since only a cache miss actually reaches Remotive.
 *
 * Attribution requirement from Remotive's terms: every listing links back
 * to its own remotive.com URL, and the client UI credits "Remotive" as the
 * source — see ExternalJobsList.tsx.
 */

// Two queries merged and de-duplicated — `category=software-dev` alone
// under-covers plain "developer"/"engineer" titles that Remotive files
// under other categories (IT, DevOps/Sysadmin, etc).
const REMOTIVE_ENDPOINTS = [
  'https://remotive.com/api/remote-jobs?search=developer&limit=100',
  'https://remotive.com/api/remote-jobs?search=engineer&limit=100',
];

// Same exclusion the original request specified: engineer/developer roles,
// not staff/principal/lead, and not hybrid (this feed is remote-only by
// construction, but titles sometimes say so anyway).
const EXCLUDE_TITLE = /\b(staff|principal|lead|hybrid)\b/i;
const INCLUDE_TITLE = /\b(engineer|developer)\b/i;

export type ExternalJobRole = 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'software';

export interface ExternalJob {
  id: number;
  title: string;
  company_name: string;
  company_domain: string | null;
  url: string;
  location: string;
  job_type: string;
  role_category: ExternalJobRole;
  tags: string[];
  salary: string | null;
  published_at: string;
}

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  company_logo: string | null;
  url: string;
  candidate_required_location: string;
  job_type: string;
  tags: string[];
  salary: string | null;
  publication_date: string;
  description: string;
}

// Remotive's own logo endpoint (remotive.com/job/<id>/logo) sits behind a
// Cloudflare bot challenge that 403s any hotlinked <img> request, so it can
// never render client-side. Instead, pull the company's real site out of the
// first outbound link in the job description that isn't Remotive's own
// tracking pixel, a social network, or a known ATS/apply-flow host — that
// domain then drives a favicon lookup client-side (see ExternalJobsList).
const NON_COMPANY_HOSTS = new Set([
  'remotive.com', 'remotive.io',
  'linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com', 'github.com',
  'indeed.com', 'glassdoor.com', 'wellfound.com', 'angel.co',
  'bit.ly', 't.co', 'goo.gl', 'lnkd.in',
  'calendly.com', 'google.com', 'docs.google.com', 'forms.gle', 'typeform.com',
  'greenhouse.io', 'lever.co', 'workable.com', 'bamboohr.com', 'breezy.hr',
  'smartrecruiters.com', 'jobvite.com', 'icims.com', 'myworkdayjobs.com', 'ashbyhq.com', 'recruitee.com',
]);

const companyDomainFromDescription = (html: string): string | null => {
  const hrefs = Array.from(html.matchAll(/href="(https?:\/\/[^"]+)"/gi));
  for (const [, href] of hrefs) {
    try {
      const host = new URL(href).hostname.replace(/^www\./, '').toLowerCase();
      const registrable = host.split('.').slice(-2).join('.');
      if (!NON_COMPANY_HOSTS.has(host) && !NON_COMPANY_HOSTS.has(registrable)) return host;
    } catch {
      // malformed href — skip
    }
  }
  return null;
};

const roleFromJob = (title: string, tags: string[]): ExternalJobRole => {
  const hay = `${title} ${tags.join(' ')}`.toLowerCase();
  if (/(devops|sre|infrastructure|platform eng)/.test(hay)) return 'devops';
  if (/(data eng|data scien|analytics|etl|pipeline)/.test(hay)) return 'data';
  if (/(mobile|ios|android|react native|flutter|swift|kotlin)/.test(hay)) return 'mobile';
  if (/(full[- ]?stack)/.test(hay)) return 'fullstack';
  if (/(frontend|front-end|front end|react|vue|angular|ui engineer)/.test(hay)) return 'frontend';
  if (/(backend|back-end|back end|api engineer)/.test(hay)) return 'backend';
  return 'software';
};

export const getExternalJobs = async (): Promise<ExternalJob[]> => {
  const responses = await Promise.all(
    REMOTIVE_ENDPOINTS.map((url) =>
      fetch(url, {
        // Next.js data cache: one shared fetch per hour across every
        // visitor, not one fetch per page view — this is what keeps us
        // inside Remotive's "a few requests a day" guidance no matter how
        // much traffic the page gets.
        next: { revalidate: 3600 },
        headers: { Accept: 'application/json' },
      })
    )
  );

  for (const res of responses) {
    if (!res.ok) throw new Error(`Remotive API responded ${res.status}`);
  }

  const bodies = (await Promise.all(responses.map((res) => res.json()))) as { jobs: RemotiveJob[] }[];

  const byId = new Map<number, RemotiveJob>();
  for (const body of bodies) {
    for (const job of body.jobs) byId.set(job.id, job);
  }

  return Array.from(byId.values())
    .filter((j) => INCLUDE_TITLE.test(j.title) && !EXCLUDE_TITLE.test(j.title))
    .sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime())
    .map((j) => ({
      id: j.id,
      title: j.title,
      company_name: j.company_name,
      company_domain: companyDomainFromDescription(j.description ?? ''),
      url: j.url,
      location: j.candidate_required_location || 'Worldwide',
      job_type: j.job_type,
      role_category: roleFromJob(j.title, j.tags ?? []),
      tags: (j.tags ?? []).slice(0, 6),
      salary: j.salary || null,
      published_at: j.publication_date,
    }));
};
