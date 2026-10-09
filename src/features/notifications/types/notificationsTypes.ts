export interface DataNotifications {
  id: string;
  type: string;
  title: string;
  body: string | null;
  /** Indonesian copy (migration 029); null on rows written before it. */
  title_id: string | null;
  body_id: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface Notifications {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataNotifications[] | null;
}
