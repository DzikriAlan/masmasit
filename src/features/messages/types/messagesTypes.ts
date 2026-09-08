export interface DataMessages {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface DataMessagesPartner {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  location: string | null;
}

export interface DataMessagesConversation {
  partner: DataMessagesPartner;
  lastMessage: DataMessages | null;
  unreadCount: number;
}

export interface PayloadPostMessages {
  sender_id: string;
  recipient_id: string;
  body: string;
}

export interface Messages {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataMessages[] | null;
}
