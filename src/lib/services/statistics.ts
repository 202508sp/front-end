import type {
  StatisticsData,
  UserStatistics,
  StaffStatistics,
  Statistics,
  FacilityStatistics,
  DateRange,
  StatFilter,
  ExportOptions,
  ChartData,
  StatCard
} from '$lib/types/statistics';
import type { User } from '$lib/types/user';
import type { Staff } from '$lib/types/staff';
import type { Report } from '$lib/types/report';
import { format, differenceInDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 統計データ処理サービス
 */
export class StatisticsService {
  /**
   * 利用者統計を計算
   */
  static calculateUserStatistics(users: User[], dateRange: DateRange): UserStatistics {
    const filteredUsers = users.filter(user => 
      isWithinInterval(user.createdAt, dateRange)
    );

    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive !== false).length;
    const newUsersThisMonth = filteredUsers.length;

    // 要介護度別集計
    const usersByCareLevel = users.reduce((acc, user) => {
      const level = user.careLevel || 0;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // 性別別集計
    const usersByGender = users.reduce((acc, user) => {
      const gender = user.gender || 'unknown';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 平均年齢計算
    const currentYear = new Date().getFullYear();
    const ages = users
      .filter(user => user.birthDate)
      .map(user => currentYear - user.birthDate.getFullYear());
    const averageAge = ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0;

    // 入退所数（仮の計算）
    const admissionsThisMonth = Math.floor(newUsersThisMonth * 0.8);
    const dischargesThisMonth = Math.floor(newUsersThisMonth * 0.2);

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      usersByCareLevel,
      usersByGender,
      averageAge: Math.round(averageAge * 10) / 10,
      admissionsThisMonth,
      dischargesThisMonth
    };
  }

  /**
   * 職員統計を計算
   */
  static calculateStaffStatistics(staff: Staff[], dateRange: DateRange): StaffStatistics {
    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.isActive !== false).length;

    // 役職別集計
    const staffByRole = staff.reduce((acc, s) => {
      const role = s.role || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 部署別集計
    const staffByDepartment = staff.reduce((acc, s) => {
      const dept = s.department || 'unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 平均労働時間（仮の計算）
    const averageWorkHours = 8.5;
    const overtimeHours = 2.3;
    const absenteeismRate = 3.2;

    return {
      totalStaff,
      activeStaff,
      staffByRole,
      staffByDepartment,
      averageWorkHours,
      overtimeHours,
      absenteeismRate
    };
  }

  /**
   * レポート統計を計算
   */
  static calculateReportStatistics(reports: Report[], dateRange: DateRange): Statistics {
    const filteredReports = reports.filter(report =>
      isWithinInterval(report.createdAt, dateRange)
    );

    const totalReports = reports.length;
    const reportsThisMonth = filteredReports.length;

    // レポートタイプ別集計
    const reportsByType = reports.reduce((acc, report) => {
      const type = report.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // 利用者あたりの平均レポート数（仮の計算）
    const averageReportsPerUser = totalReports > 0 ? totalReports / 50 : 0; // 50は仮の利用者数

    // 家族エンゲージメント率（仮の計算）
    const familyEngagementRate = 78.5;

    // レポート完了率（仮の計算）
    const reportCompletionRate = 92.3;

    return {
      totalReports,
      reportsThisMonth,
      reportsByType,
      averageReportsPerUser: Math.round(averageReportsPerUser * 10) / 10,
      familyEngagementRate,
      reportCompletionRate
    };
  }

  /**
   * 施設統計を計算
   */
  static calculateFacilityStatistics(): FacilityStatistics {
    // 実際の実装では、これらの値は実データから計算される
    return {
      occupancyRate: 87.5,
      bedUtilization: 92.1,
      staffToUserRatio: 0.65,
      averageStayDuration: 245,
      satisfactionScore: 4.3,
      incidentCount: 3
    };
  }

  /**
   * 統合統計データを生成
   */
  static generateStatisticsData(
    users: User[],
    staff: Staff[],
    reports: Report[],
    dateRange: DateRange
  ): StatisticsData {
    return {
      users: this.calculateUserStatistics(users, dateRange),
      staff: this.calculateStaffStatistics(staff, dateRange),
      reports: this.calculateReportStatistics(reports, dateRange),
      facility: this.calculateFacilityStatistics(),
      generatedAt: new Date()
    };
  }

  /**
   * フィルターを適用してデータを絞り込み
   */
  static applyFilters<T extends { createdAt: Date; [key: string]: any }>(
    data: T[],
    filters: StatFilter
  ): T[] {
    let filtered = data;

    // 日付範囲フィルター
    if (filters.dateRange) {
      filtered = filtered.filter(item =>
        isWithinInterval(item.createdAt, filters.dateRange!)
      );
    }

    // 利用者IDフィルター
    if (filters.userIds && filters.userIds.length > 0) {
      filtered = filtered.filter(item =>
        filters.userIds!.includes(item.userId || item.id)
      );
    }

    // 職員IDフィルター
    if (filters.staffIds && filters.staffIds.length > 0) {
      filtered = filtered.filter(item =>
        filters.staffIds!.includes(item.staffId || item.authorId || item.id)
      );
    }

    // 部署フィルター
    if (filters.departments && filters.departments.length > 0) {
      filtered = filtered.filter(item =>
        filters.departments!.includes(item.department)
      );
    }

    // 要介護度フィルター
    if (filters.careLevel && filters.careLevel.length > 0) {
      filtered = filtered.filter(item =>
        filters.careLevel!.includes(item.careLevel)
      );
    }

    return filtered;
  }

  /**
   * チャート用データを生成
   */
  static generateChartData(
    data: any[],
    labelField: string,
    valueField: string,
    groupBy?: 'day' | 'week' | 'month'
  ): ChartData {
    if (groupBy) {
      // 期間別グループ化
      const grouped = data.reduce((acc, item) => {
        let key: string;
        const date = new Date(item.createdAt);

        switch (groupBy) {
          case 'day':
            key = format(date, 'yyyy-MM-dd', { locale: ja });
            break;
          case 'week':
            key = format(date, 'yyyy-ww', { locale: ja });
            break;
          case 'month':
            key = format(date, 'yyyy-MM', { locale: ja });
            break;
          default:
            key = format(date, 'yyyy-MM-dd', { locale: ja });
        }

        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(item);
        return acc;
      }, {} as Record<string, any[]>);

      const labels = Object.keys(grouped).sort();
      const values = labels.map(label => grouped[label].length as number);

      return {
        labels,
        datasets: [{
          label: 'データ数',
          data: values,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 2
        }]
      };
    } else {
      // 単純な集計
      const grouped = data.reduce((acc, item) => {
        const key = item[labelField] || 'その他';
        acc[key] = (acc[key] || 0) + (item[valueField] || 1);
        return acc;
      }, {} as Record<string, number>);

      const labels = Object.keys(grouped);
      const values = Object.values(grouped) as number[];

      return {
        labels,
        datasets: [{
          label: 'データ',
          data: values,
          backgroundColor: [
            '#3b82f6',
            '#ef4444',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#06b6d4',
            '#84cc16',
            '#f97316'
          ],
          borderWidth: 1
        }]
      };
    }
  }

  /**
   * 統計カードデータを生成
   */
  static generateStatCards(statistics: StatisticsData): StatCard[] {
    return [
      {
        id: 'total-users',
        title: '総利用者数',
        value: statistics.users.totalUsers,
        unit: '人',
        change: 5.2,
        changeType: 'increase',
        icon: 'material-symbols:group',
        color: '#3b82f6',
        description: '施設の総利用者数'
      },
      {
        id: 'active-users',
        title: 'アクティブ利用者',
        value: statistics.users.activeUsers,
        unit: '人',
        change: 2.1,
        changeType: 'increase',
        icon: 'material-symbols:person-check',
        color: '#10b981',
        description: '現在アクティブな利用者数'
      },
      {
        id: 'total-staff',
        title: '総職員数',
        value: statistics.staff.totalStaff,
        unit: '人',
        change: -1.5,
        changeType: 'decrease',
        icon: 'material-symbols:badge',
        color: '#f59e0b',
        description: '施設の総職員数'
      },
      {
        id: 'occupancy-rate',
        title: '入居率',
        value: statistics.facility.occupancyRate,
        unit: '%',
        change: 3.2,
        changeType: 'increase',
        icon: 'material-symbols:home',
        color: '#8b5cf6',
        description: '施設の入居率'
      },
      {
        id: 'satisfaction-score',
        title: '満足度スコア',
        value: statistics.facility.satisfactionScore,
        unit: '/5.0',
        change: 0.2,
        changeType: 'increase',
        icon: 'material-symbols:star',
        color: '#ef4444',
        description: '利用者・家族の満足度'
      },
      {
        id: 'reports-this-month',
        title: '今月のレポート',
        value: statistics.reports.reportsThisMonth,
        unit: '件',
        change: 12.5,
        changeType: 'increase',
        icon: 'material-symbols:description',
        color: '#06b6d4',
        description: '今月作成されたレポート数'
      }
    ];
  }

  /**
   * データをCSV形式でエクスポート
   */
  static exportToCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * 統計データをエクスポート
   */
  static exportStatistics(
    statistics: StatisticsData,
    options: ExportOptions
  ): void {
    const { format: exportFormat, dateRange, sections } = options;
    
    const exportData: any[] = [];
    
    if (sections.includes('users')) {
      exportData.push({
        section: '利用者統計',
        totalUsers: statistics.users.totalUsers,
        activeUsers: statistics.users.activeUsers,
        newUsersThisMonth: statistics.users.newUsersThisMonth,
        averageAge: statistics.users.averageAge
      });
    }
    
    if (sections.includes('staff')) {
      exportData.push({
        section: '職員統計',
        totalStaff: statistics.staff.totalStaff,
        activeStaff: statistics.staff.activeStaff,
        averageWorkHours: statistics.staff.averageWorkHours
      });
    }
    
    if (sections.includes('facility')) {
      exportData.push({
        section: '施設統計',
        occupancyRate: statistics.facility.occupancyRate,
        bedUtilization: statistics.facility.bedUtilization,
        satisfactionScore: statistics.facility.satisfactionScore
      });
    }

    const filename = `statistics_${format(dateRange.start, 'yyyyMMdd')}_${format(dateRange.end, 'yyyyMMdd')}`;
    
    if (exportFormat === 'csv') {
      this.exportToCSV(exportData, filename);
    }
    // 他の形式のエクスポートは将来実装
  }
}