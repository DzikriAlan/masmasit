export interface DataDiscussions {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_featured: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
  discussion_comments?: { count: number }[];
}

export interface DataDiscussionsComments {
  id: string;
  discussion_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface PayloadPostDiscussions {
  user_id: string;
  title: string;
  body: string;
}

export interface PayloadPostDiscussionsComments {
  discussion_id: string;
  user_id: string;
  body: string;
}

export interface Discussions {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDiscussions[] | null;
}

export interface DiscussionsDetail {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDiscussions | null;
}

export interface DiscussionsComments {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataDiscussionsComments[] | null;
}
