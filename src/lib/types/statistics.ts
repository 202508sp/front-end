/**
 * 統計・分析関連の型定義
 */

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter';

export type StatPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins?: Record<string, any>;
  scales?: Record<string, any>;
  animation?: Record<string, any>;
}

export interface StatFilter {
  period: StatPeriod;
  dateRange?: DateRange;
  userIds?: string[];
  staffIds?: string[];
  departments?: string[];
  careLevel?: number[];
  categories?: string[];
}

export interface StatCard {
  id: string;
  title: string;
  value: number | string;
  unit?: string;
  change?: number; // percentage change from previous period
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
  description?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByCareLevel: Record<number, number>;
  usersByGender: Record<string, number>;
  averageAge: number;
  admissionsThisMonth: number;
  dischargesThisMonth: number;
}

export interface StaffStatistics {
  totalStaff: number;
  activeStaff: number;
  staffByRole: Record<string, number>;
  staffByDepartment: Record<string, number>;
  averageWorkHours: number;
  overtimeHours: number;
  absenteeismRate: number;
}

export interface Statistics {
  totalReports: number;
  reportsThisMonth: number;
  reportsByType: Record<string, number>;
  averageReportsPerUser: number;
  familyEngagementRate: number;
  reportCompletionRate: number;
}

export interface FacilityStatistics {
  occupancyRate: number;
  bedUtilization: number;
  staffToUserRatio: number;
  averageStayDuration: number; // days
  satisfactionScore: number;
  incidentCount: number;
}

export interface StatisticsData {
  users: UserStatistics;
  staff: StaffStatistics;
  reports: Statistics;
  facility: FacilityStatistics;
  generatedAt: Date;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts: boolean;
  dateRange: DateRange;
  sections: string[];
}