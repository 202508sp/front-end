/**
 * ダッシュボード関連の型定義
 */

export type CardType = 
  | 'user-list' 
  | 'statistics' 
  | 'schedule' 
  | 'notifications' 
  | 'quick-actions'
  | 'recent-reports'
  | 'chat-summary'
  | 'weather'
  | 'calendar';

export type CardSize = 'small' | 'medium' | 'large';

export interface Position {
  x: number;
  y: number;
}

export interface CardConfig {
  [key: string]: any;
  // 統計カード用設定
  statType?: 'user-count' | 'staff-count' | 'daily-reports' | 'monthly-summary';
  dateRange?: 'today' | 'week' | 'month' | 'custom';
  // リストカード用設定
  maxItems?: number;
  sortBy?: string;
  filterBy?: Record<string, any>;
  // 通知カード用設定
  notificationTypes?: string[];
  // クイックアクション用設定
  actions?: string[];
}

export interface DashboardCard {
  id: string;
  userId: string; // 職員ID
  type: CardType;
  title: string;
  icon: string;
  size: CardSize;
  position: Position;
  config: CardConfig;
  isVisible: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  cards: DashboardCard[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardTemplate {
  type: CardType;
  title: string;
  icon: string;
  defaultSize: CardSize;
  defaultConfig: CardConfig;
  description: string;
  category: 'management' | 'statistics' | 'communication' | 'utilities';
}

export interface DragState {
  isDragging: boolean;
  draggedCard?: DashboardCard;
  dragOffset: Position;
  dropZones: Position[];
}

export interface GridSettings {
  columns: number;
  rows: number;
  gap: number;
  cellWidth: number;
  cellHeight: number;
}