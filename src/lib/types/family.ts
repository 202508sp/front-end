/**
 * 家族ポータル関連の型定義
 */

import type { Report } from './report.js';
import type { User } from './user.js';
import type { ChatRoom } from './chat.js';

export interface FamilyUser {
  id: string;
  name: string;
  email: string;
  relationship: string;
  userId: string; // 関連する利用者ID
  hasPortalAccess: boolean;
  permissions: FamilyPermission[];
  createdAt: Date;
  updatedAt: Date;
}

export type FamilyPermission = 'view_reports' | 'view_chat' | 'receive_notifications';

export interface FamilyDashboardData {
  user: User;
  recentReports: Report[];
  unreadMessages: number;
  upcomingEvents: FamilyEvent[];
  notifications: FamilyNotification[];
}

export interface FamilyEvent {
  id: string;
  title: string;
  description?: string;
  date: Date;
  type: 'medical' | 'activity' | 'visit' | 'meeting';
  isImportant: boolean;
}

export interface FamilyNotification {
  id: string;
  title: string;
  message: string;
  type: 'report' | 'message' | 'event' | 'system';
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export interface ReportSearchFilter {
  searchTerm?: string;
  dateRange?: { start: Date; end: Date };
  type?: string[];
  tags?: string[];
}

export interface SimplifiedUser {
  id: string;
  name: string;
  profileImage?: string;
  careLevel: number;
  admissionDate: Date;
}