export type FeedKind = 'job' | 'project' | 'build' | 'event';

export interface PayloadGetFeed {
  limit: number;
}

/** One row of public activity, already normalised across source tables. */
export interface DataFeed {
  id: string;
  kind: FeedKind;
  actor: string | null;
  avatarUrl: string | null;
  title: string;
  href: string;
  created_at: string;
}

export interface DataFeedCourses {
  id: string;
  title: string;
  level: string;
  category: string | null;
  created_at: string;
}

export interface DataFeedEvents {
  id: string;
  title: string;
  event_type: string;
  location: string;
  event_date: string;
}

export interface Feed {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataFeed[] | null;
}
