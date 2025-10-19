import type {
  StatisticsData,
  DateRange,
  StatFilter,
  StatPeriod,
  ChartData,
  StatCard
} from '$lib/types/statistics';
import type { User } from '$lib/types/user';
import type { Staff } from '$lib/types/staff';
import type { Report } from '$lib/types/report';
import { StatisticsService } from '$lib/services/statistics';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * 統計データ管理ストア
 */
class StatisticsStore {
  // 基本状態
  data = $state<StatisticsData | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  // フィルター状態
  currentPeriod = $state<StatPeriod>('month');
  dateRange = $state<DateRange>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  filters = $state<StatFilter>({
    period: 'month',
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    }
  });

  // 表示設定
  selectedChartTypes = $state<string[]>(['users', 'staff', 'reports']);
  selectedStatCards = $state<string[]>(['total-users', 'active-users', 'total-staff', 'occupancy-rate']);

  // 派生状態
  get statCards() {
    if (!this.data) return [];
    return StatisticsService.generateStatCards(this.data);
  }

  get filteredStatCards() {
    return this.statCards.filter((card: StatCard) => 
      this.selectedStatCards.includes(card.id)
    );
  }

  get userChartData() {
    if (!this.data) return { labels: [], datasets: [] };
    
    const usersByLevel = this.data.users.usersByCareLevel;
    return {
      labels: Object.keys(usersByLevel).map(level => `要介護${level}`),
      datasets: [{
        label: '利用者数',
        data: Object.values(usersByLevel) as number[],
        backgroundColor: [
          '#3b82f6',
          '#ef4444',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#06b6d4'
        ],
        borderWidth: 1
      }]
    };
  }

  get staffChartData() {
    if (!this.data) return { labels: [], datasets: [] };
    
    const staffByRole = this.data.staff.staffByRole;
    const roleLabels: Record<string, string> = {
      admin: '管理者',
      manager: 'マネージャー',
      caregiver: '介護士',
      nurse: '看護師',
      therapist: 'セラピスト'
    };
    
    return {
      labels: Object.keys(staffByRole).map(role => roleLabels[role] || role),
      datasets: [{
        label: '職員数',
        data: Object.values(staffByRole) as number[],
        backgroundColor: [
          '#f59e0b',
          '#8b5cf6',
          '#10b981',
          '#ef4444',
          '#06b6d4'
        ],
        borderWidth: 1
      }]
    };
  }

  get reportsChartData() {
    if (!this.data) return { labels: [], datasets: [] };
    
    const reportsByType = this.data.reports.reportsByType;
    const typeLabels: Record<string, string> = {
      daily: '日次レポート',
      medical: '医療レポート',
      incident: 'インシデント',
      progress: '進捗レポート',
      'family-communication': '家族連絡'
    };
    
    return {
      labels: Object.keys(reportsByType).map(type => typeLabels[type] || type),
      datasets: [{
        label: 'レポート数',
        data: Object.values(reportsByType) as number[],
        backgroundColor: [
          '#06b6d4',
          '#ef4444',
          '#f59e0b',
          '#10b981',
          '#8b5cf6'
        ],
        borderWidth: 1
      }]
    };
  }

  // アクション
  async loadStatistics(users: User[], staff: Staff[], reports: Report[]) {
    this.isLoading = true;
    this.error = null;

    try {
      // フィルターを適用
      const filteredUsers = StatisticsService.applyFilters(users, this.filters);
      const filteredStaff = StatisticsService.applyFilters(staff, this.filters);
      const filteredReports = StatisticsService.applyFilters(reports, this.filters);

      // 統計データを生成
      this.data = StatisticsService.generateStatisticsData(
        filteredUsers,
        filteredStaff,
        filteredReports,
        this.dateRange
      );
    } catch (err) {
      this.error = err instanceof Error ? err.message : '統計データの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }

  updateDateRange(newRange: DateRange) {
    this.dateRange = newRange;
    this.filters = {
      ...this.filters,
      dateRange: newRange
    };
  }

  updatePeriod(period: StatPeriod) {
    this.currentPeriod = period;
    this.filters = {
      ...this.filters,
      period
    };
  }

  updateFilters(newFilters: Partial<StatFilter>) {
    this.filters = {
      ...this.filters,
      ...newFilters
    };
  }

  toggleStatCard(cardId: string) {
    const index = this.selectedStatCards.indexOf(cardId);
    if (index > -1) {
      this.selectedStatCards.splice(index, 1);
    } else {
      this.selectedStatCards.push(cardId);
    }
  }

  toggleChartType(chartType: string) {
    const index = this.selectedChartTypes.indexOf(chartType);
    if (index > -1) {
      this.selectedChartTypes.splice(index, 1);
    } else {
      this.selectedChartTypes.push(chartType);
    }
  }

  exportData(format: 'csv' = 'csv', sections: string[] = ['users', 'staff', 'reports', 'facility']) {
    if (!this.data) return;

    StatisticsService.exportStatistics(this.data, {
      format,
      includeCharts: false,
      dateRange: this.dateRange,
      sections
    });
  }

  reset() {
    this.data = null;
    this.error = null;
    this.isLoading = false;
    this.currentPeriod = 'month';
    this.dateRange = {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    };
    this.filters = {
      period: 'month',
      dateRange: this.dateRange
    };
    this.selectedChartTypes = ['users', 'staff', 'reports'];
    this.selectedStatCards = ['total-users', 'active-users', 'total-staff', 'occupancy-rate'];
  }
}

// シングルトンインスタンスをエクスポート
export const statisticsStore = new StatisticsStore();