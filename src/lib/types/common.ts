/**
 * 共通の型定義
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
  lastUpdated?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export interface NotificationConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number; // milliseconds, 0 for persistent
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface ModalConfig {
  id: string;
  title: string;
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  closable: boolean;
  backdrop: boolean;
  component?: any;
  props?: Record<string, any>;
}

export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    text: string;
    background: string;
    surface: string;
    accent: Record<string, string>;
  };
  fonts: {
    primary: string;
    secondary?: string;
  };
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
}

export interface AppSettings {
  theme: Theme;
  language: 'ja' | 'en';
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
  };
}

export type EventHandler<T = any> = (event: T) => void;

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}