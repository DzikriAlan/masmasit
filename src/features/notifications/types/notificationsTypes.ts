export interface DataNotifications {
  id: string;
  type: string;
  title: string;
  body: string | null;
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
