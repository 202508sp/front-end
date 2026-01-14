/**
 * レポート管理用ストア
 */

import type { Report, ReportTemplate, ReportFilter, ReportSortOption, ReportType, ReportStatus } from '$lib/types/report';

const FAVORITE_REPORTS_STORAGE_KEY = 'favorite-reports';

function loadStringArrayFromStorage(key: string, defaultValue: string[] = []): string[] {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return defaultValue;
    return parsed.filter((v): v is string => typeof v === 'string');
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function saveStringArrayToStorage(key: string, value: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

export class ReportStore {
  // 基本状態
  reports = $state<Report[]>([]);
  templates = $state<ReportTemplate[]>([]);
  selectedReport = $state<Report | null>(null);
  selectedTemplate = $state<ReportTemplate | null>(null);

  // お気に入り（ピン留め）
  favoriteReportIds = $state<string[]>(loadStringArrayFromStorage(FAVORITE_REPORTS_STORAGE_KEY, []));
  
  // UI状態
  isLoading = $state(false);
  error = $state<string | null>(null);
  filter = $state<ReportFilter>({});
  sortOption = $state<ReportSortOption>({ field: 'createdAt', direction: 'desc' });
  
  // 派生状態
  filteredReports = $derived(() => {
    let filtered = this.reports.slice();
    
    // 検索フィルタ
    if (this.filter.searchTerm) {
      const term = this.filter.searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(term) ||
        report.content.toLowerCase().includes(term) ||
        report.authorName.toLowerCase().includes(term)
      );
    }
    
    // タイプフィルタ
    if (this.filter.type && this.filter.type.length > 0) {
      filtered = filtered.filter(report => this.filter.type!.includes(report.type));
    }
    
    // ステータスフィルタ
    if (this.filter.status && this.filter.status.length > 0) {
      filtered = filtered.filter(report => this.filter.status!.includes(report.status));
    }
    
    // 作成者フィルタ
    if (this.filter.authorId && this.filter.authorId.length > 0) {
      filtered = filtered.filter(report => this.filter.authorId!.includes(report.authorId));
    }
    
    // 日付範囲フィルタ
    if (this.filter.dateRange) {
      const { start, end } = this.filter.dateRange;
      filtered = filtered.filter((report) => {
        const reportDate = report.date instanceof Date ? report.date : new Date(report.date);
        return reportDate >= start && reportDate <= end;
      });
    }
    
    // タグフィルタ
    if (this.filter.tags && this.filter.tags.length > 0) {
      filtered = filtered.filter(report => 
        this.filter.tags!.some(tag => report.tags.includes(tag))
      );
    }
    
    // 家族公開フィルタ
    if (this.filter.isPublishedToFamily !== undefined) {
      filtered = filtered.filter(report => report.isPublishedToFamily === this.filter.isPublishedToFamily);
    }
    
    // ソート
    return filtered.sort((a, b) => {
      const aValue = a[this.sortOption.field] as any;
      const bValue = b[this.sortOption.field] as any;
      
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return this.sortOption.direction === 'asc' ? -1 : 1;
      if (bValue == null) return this.sortOption.direction === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return this.sortOption.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOption.direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  favoriteReports = $derived.by(() => {
    if (this.favoriteReportIds.length === 0) return [];
    const byId = new Map(this.filteredReports.map((r) => [r.id, r] as const));
    return this.favoriteReportIds.map((id) => byId.get(id)).filter((r): r is Report => !!r);
  });

  nonFavoriteReports = $derived.by(() => {
    if (this.favoriteReportIds.length === 0) return this.filteredReports;
    const favoriteSet = new Set(this.favoriteReportIds);
    return this.filteredReports.filter((r) => !favoriteSet.has(r.id));
  });
  
  // デフォルトテンプレート
  defaultTemplates = $derived.by(() => 
    this.templates.filter(template => template.isDefault)
  );
  
  // アクション
  async loadReports(userId?: string) {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: Firebase連携実装
      // 仮のデータ
      this.reports = [
        {
          id: '1',
          userId: userId || 'user1',
          authorId: 'staff1',
          authorName: '田中 花子',
          type: 'daily',
          title: '日次レポート - 2024/01/15',
          content: '本日の様子について報告いたします。',
          sections: [],
          attachments: [],
          date: new Date('2024-01-15'),
          status: 'published',
          isPublishedToFamily: true,
          publishedAt: new Date('2024-01-15T18:00:00'),
          tags: ['日常', '健康'],
          createdAt: new Date('2024-01-15T17:30:00'),
          updatedAt: new Date('2024-01-15T18:00:00')
        }
      ];

      this.cleanupFavorites();
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'レポートの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }

  private cleanupFavorites(): void {
    if (this.favoriteReportIds.length === 0) return;
    const existing = new Set(this.reports.map((r) => r.id));
    const cleaned = this.favoriteReportIds.filter((id) => existing.has(id));
    if (cleaned.length !== this.favoriteReportIds.length) {
      this.favoriteReportIds = cleaned;
      saveStringArrayToStorage(FAVORITE_REPORTS_STORAGE_KEY, cleaned);
    }
  }

  toggleFavoriteReport(reportId: string): void {
    const index = this.favoriteReportIds.indexOf(reportId);
    if (index === -1) {
      this.favoriteReportIds = [reportId, ...this.favoriteReportIds];
    } else {
      this.favoriteReportIds = this.favoriteReportIds.filter((id) => id !== reportId);
    }

    saveStringArrayToStorage(FAVORITE_REPORTS_STORAGE_KEY, this.favoriteReportIds);
  }

  moveFavoriteReport(draggedReportId: string, targetReportId: string, insertAfter: boolean): void {
    if (draggedReportId === targetReportId) return;

    const ids = this.favoriteReportIds.slice();
    const fromIndex = ids.indexOf(draggedReportId);
    const targetIndex = ids.indexOf(targetReportId);
    if (fromIndex === -1 || targetIndex === -1) return;

    ids.splice(fromIndex, 1);
    let insertIndex = targetIndex;
    if (fromIndex < targetIndex) insertIndex -= 1;
    if (insertAfter) insertIndex += 1;
    ids.splice(insertIndex, 0, draggedReportId);

    this.favoriteReportIds = ids;
    saveStringArrayToStorage(FAVORITE_REPORTS_STORAGE_KEY, ids);
  }
  
  async loadTemplates() {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: Firebase連携実装
      // 仮のデフォルトテンプレート
      this.templates = [
        {
          id: 'template-daily',
          name: '日次レポート',
          type: 'daily',
          sections: [
            {
              id: 'section-1',
              title: '体調・健康状態',
              type: 'text',
              isRequired: true,
              order: 1,
              config: { placeholder: '体温、血圧、食事量など' }
            },
            {
              id: 'section-2',
              title: '活動内容',
              type: 'text',
              isRequired: true,
              order: 2,
              config: { placeholder: 'レクリエーション、リハビリなど' }
            },
            {
              id: 'section-3',
              title: '特記事項',
              type: 'text',
              isRequired: false,
              order: 3,
              config: { placeholder: '気になることがあれば記載' }
            }
          ],
          isDefault: true,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'template-medical',
          name: '医療レポート',
          type: 'medical',
          sections: [
            {
              id: 'section-1',
              title: '症状・所見',
              type: 'text',
              isRequired: true,
              order: 1,
              config: {}
            },
            {
              id: 'section-2',
              title: '処置・投薬',
              type: 'text',
              isRequired: true,
              order: 2,
              config: {}
            },
            {
              id: 'section-3',
              title: '医師への連絡事項',
              type: 'text',
              isRequired: false,
              order: 3,
              config: {}
            }
          ],
          isDefault: true,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'テンプレートの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }
  
  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: Firebase連携実装
      const newReport: Report = {
        ...report,
        id: `report-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.reports.push(newReport);
      return newReport;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'レポートの作成に失敗しました';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  async updateReport(id: string, updates: Partial<Report>) {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: Firebase連携実装
      const index = this.reports.findIndex(report => report.id === id);
      if (index !== -1) {
        this.reports[index] = {
          ...this.reports[index],
          ...updates,
          updatedAt: new Date()
        };
      }
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'レポートの更新に失敗しました';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  async deleteReport(id: string) {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: Firebase連携実装
      this.reports = this.reports.filter(report => report.id !== id);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'レポートの削除に失敗しました';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }
  
  // フィルタ・ソート操作
  setFilter(filter: Partial<ReportFilter>) {
    this.filter = { ...this.filter, ...filter };
  }
  
  clearFilter() {
    this.filter = {};
  }
  
  setSortOption(sortOption: ReportSortOption) {
    this.sortOption = sortOption;
  }
  
  // 選択操作
  selectReport(report: Report | null) {
    this.selectedReport = report;
  }
  
  selectTemplate(template: ReportTemplate | null) {
    this.selectedTemplate = template;
  }
  
  // エラークリア
  clearError() {
    this.error = null;
  }
}

export const reportStore = new ReportStore();