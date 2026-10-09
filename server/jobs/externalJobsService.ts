/**
 * Live remote engineer/developer listings — fetched from Remotive's and
 * Jobicy's public job board APIs on every request (cached at the edge for an
 * hour), not stored in our own database. Both ask consumers to poll sparingly;
 * Next.js's fetch cache below is what keeps this app within that regardless
 * of how many visitors open the page, since only a cache miss reaches them.
 *
 * Attribution requirement from both boards' terms: every listing links back
 * to its own posting URL, and each card credits its board by name — see
 * `source` here and ExternalJobsList.tsx.
 *
 * Why two boards: since Oct 2026 Remotive's free API returns a fixed batch of
 * ~18 jobs and ignores `search`, which left this page with ~9 listings and a
 * search box that changed nothing. Jobicy's `tag` search does filter.
 */

// Two queries merged and de-duplicated — `category=software-dev` alone
// under-covers plain "developer"/"engineer" titles that Remotive files
// under other categories (IT, DevOps/Sysadmin, etc).
const REMOTIVE_ENDPOINTS = [
  'https://remotive.com/api/remote-jobs?search=developer&limit=100',
  'https://remotive.com/api/remote-jobs?search=engineer&limit=100',
];
const JOBICY_ENDPOINTS = [
  'https://jobicy.com/api/v2/remote-jobs?count=50&tag=developer',
  'https://jobicy.com/api/v2/remote-jobs?count=50&tag=engineer',
];

// Same exclusion the original request specified: engineer/developer roles,
// not staff/principal/lead, and not hybrid (this feed is remote-only by
// construction, but titles sometimes say so anyway).
const EXCLUDE_TITLE = /\b(staff|principal|lead|hybrid)\b/i;
const INCLUDE_TITLE = /\b(engineer|developer)\b/i;

export type ExternalJobRole = 'backend' | 'frontend' | 'fullstack' | 'mobile' | 'devops' | 'data' | 'software';

export type ExternalJobSource = 'Remotive' | 'Jobicy';

export interface ExternalJob {
  /** `<source>-<board id>` — the two boards' numeric ids can collide. */
  id: string;
  source: ExternalJobSource;
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

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobDescription?: string;
  pubDate: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
}

// Remotive's own logo endpoint (remotive.com/job/<id>/logo) sits behind a
// Cloudflare bot challenge that 403s any hotlinked <img> request, so it can
// never render client-side. Instead, pull the company's real site out of the
// first outbound link in the job description that isn't Remotive's own
// tracking pixel, a social network, or a known ATS/apply-flow host — that
// domain then drives a favicon lookup client-side (see ExternalJobsList).
const NON_COMPANY_HOSTS = new Set([
  'remotive.com', 'remotive.io', 'jobicy.com',
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

// A caller-supplied query is forwarded to Remotive's own `search` param
// (nothing is stored on our side). With one, the developer/engineer title
// gate is dropped — otherwise searching "designer" could never return
// anything — while the staff/principal/lead/hybrid exclusion stays.
const MAX_QUERY_LENGTH = 60;

// Next.js data cache: one shared fetch per hour across every visitor, not
// one fetch per page view — this is what keeps us inside both boards'
// "poll sparingly" guidance no matter how much traffic the page gets.
const fetchJson = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { next: { revalidate: 3600 }, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${new URL(url).hostname} responded ${res.status}`);
  return (await res.json()) as T;
};

const jobicySalary = (j: JobicyJob): string | null => {
  if (!j.salaryMin && !j.salaryMax) return null;
  const fmt = (n: number) => n.toLocaleString('en-US');
  const range = j.salaryMin && j.salaryMax && j.salaryMin !== j.salaryMax
    ? `${fmt(j.salaryMin)}–${fmt(j.salaryMax)}`
    : fmt((j.salaryMin || j.salaryMax) as number);
  return [j.salaryCurrency, range, j.salaryPeriod && `/ ${j.salaryPeriod}`].filter(Boolean).join(' ');
};

const fromRemotive = (j: RemotiveJob): ExternalJob => ({
  id: `remotive-${j.id}`,
  source: 'Remotive',
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
});

const fromJobicy = (j: JobicyJob): ExternalJob => ({
  id: `jobicy-${j.id}`,
  source: 'Jobicy',
  title: j.jobTitle,
  company_name: j.companyName,
  company_domain: companyDomainFromDescription(j.jobDescription ?? ''),
  url: j.url,
  location: j.jobGeo?.trim() || 'Worldwide',
  job_type: (j.jobType?.[0] ?? '').toLowerCase().replace(/-/g, '_'),
  role_category: roleFromJob(j.jobTitle, j.jobIndustry ?? []),
  tags: (j.jobIndustry ?? []).slice(0, 6),
  salary: jobicySalary(j),
  published_at: j.pubDate,
});

export const getExternalJobs = async (query?: string): Promise<ExternalJob[]> => {
  const q = query?.trim().slice(0, MAX_QUERY_LENGTH) ?? '';
  const remotiveUrls = q
    ? [`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=100`]
    : REMOTIVE_ENDPOINTS;
  const jobicyUrls = q
    ? [`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(q)}`]
    : JOBICY_ENDPOINTS;

  // allSettled: one board being down (or rate-limiting us) should thin the
  // list, not blank the page. Only when every request fails is it an error.
  const results = await Promise.allSettled([
    ...remotiveUrls.map(async (url) => (await fetchJson<{ jobs: RemotiveJob[] }>(url)).jobs.map(fromRemotive)),
    ...jobicyUrls.map(async (url) => (await fetchJson<{ jobs?: JobicyJob[] }>(url)).jobs?.map(fromJobicy) ?? []),
  ]);

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length === results.length) throw failures[0].reason;
  for (const f of failures) console.warn('[external-jobs] source failed:', f.reason);

  const byId = new Map<string, ExternalJob>();
  for (const r of results) {
    if (r.status === 'fulfilled') for (const job of r.value) byId.set(job.id, job);
  }

  // Remotive ignores `search` (see top of file), so its batch is filtered
  // against the query here; Jobicy's `tag` search already did that upstream.
  const qLower = q.toLowerCase();
  const matchesQuery = (j: ExternalJob) =>
    j.source !== 'Remotive' || `${j.title} ${j.company_name} ${j.tags.join(' ')}`.toLowerCase().includes(qLower);

  return Array.from(byId.values())
    .filter((j) => (q ? matchesQuery(j) : INCLUDE_TITLE.test(j.title)) && !EXCLUDE_TITLE.test(j.title))
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
};
