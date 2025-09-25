/**
 * レポート関連の型定義
 */

export type ReportType = 'daily' | 'medical' | 'incident' | 'progress' | 'family-communication' | 'monthly-summary';

export type ReportStatus = 'draft' | 'pending-review' | 'approved' | 'published' | 'archived';

export interface ReportTemplate {
  id: string;
  name: string;
  type: ReportType;
  sections: ReportSection[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'text' | 'checklist' | 'rating' | 'file' | 'signature';
  isRequired: boolean;
  order: number;
  config: Record<string, any>;
}

export interface Report {
  id: string;
  userId: string; // 利用者ID
  authorId: string; // 作成職員ID
  authorName: string;
  templateId?: string;
  type: ReportType;
  title: string;
  content: string;
  sections: ReportSectionData[];
  attachments: Attachment[];
  date: Date;
  status: ReportStatus;
  isPublishedToFamily: boolean;
  publishedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSectionData {
  sectionId: string;
  title: string;
  type: string;
  value: any;
  isCompleted: boolean;
}

export interface ReportFilter {
  searchTerm?: string;
  type?: ReportType[];
  status?: ReportStatus[];
  authorId?: string[];
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  isPublishedToFamily?: boolean;
}

export interface ReportSortOption {
  field: keyof Report;
  direction: 'asc' | 'desc';
}

export interface ReportStatistics {
  totalReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByStatus: Record<ReportStatus, number>;
  averageCompletionTime: number; // minutes
  publishedToFamilyCount: number;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}