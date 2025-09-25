/**
 * チャット関連の型定義
 */

export type SenderType = 'staff' | 'family' | 'system';

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string; // MIME type
  size: number; // bytes
  uploadedAt: Date;
}

export interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderType: SenderType;
  content: string;
  attachments: Attachment[];
  timestamp: Date;
  isRead: boolean;
  readBy: string[]; // ユーザーIDの配列
  replyTo?: string; // 返信先メッセージID
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface Participant {
  id: string;
  name: string;
  type: SenderType;
  isOnline: boolean;
  lastSeenAt: Date;
  role?: string;
}

export interface ChatRoom {
  id: string;
  userId: string; // 利用者ID
  name: string;
  participants: Participant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatFilter {
  searchTerm?: string;
  senderType?: SenderType[];
  dateRange?: { start: Date; end: Date };
  hasAttachments?: boolean;
  isUnread?: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  chatRoomId: string;
  timestamp: Date;
}

export interface ChatNotification {
  id: string;
  chatRoomId: string;
  messageId: string;
  recipientId: string;
  type: 'new_message' | 'mention' | 'file_shared';
  isRead: boolean;
  createdAt: Date;
}