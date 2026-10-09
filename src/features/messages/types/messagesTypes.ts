export interface DataMessages {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read: boolean;
  created_at: string;
  /** Object path in the private `message-attachments` bucket (migration 029b). */
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
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
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_type?: string | null;
  attachment_size?: number | null;
}

export interface PayloadPostMessagesAttachment {
  sender_id: string;
  recipient_id: string;
  file: File;
}

export interface DataMessagesAttachment {
  attachment_url: string;
  attachment_name: string;
  attachment_type: string;
  attachment_size: number;
}

export interface Messages {
  status: string;
  statusTitle: string;
  statusSubtitle: string;
  data: DataMessages[] | null;
}
