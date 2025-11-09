/**
 * 設定管理ストア
 * システム全体の設定を管理し、リアルタイムで変更を反映
 */

import type { AppSettings, Theme } from '$lib/types/common';
import { validateSettingValue } from '$lib/utils/validation';

// デフォルトテーマ
const DEFAULT_THEME: Theme = {
  name: 'default',
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    tertiary: '#f1f5f9',
    text: '#1e293b',
    background: '#ffffff',
    surface: '#f8fafc',
    accent: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  fonts: {
    primary: 'Noto Sans JP Variable, sans-serif',
    secondary: 'Inter, sans-serif'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem'
  }
};

// デフォルト設定
const DEFAULT_SETTINGS: AppSettings = {
  theme: DEFAULT_THEME,
  language: 'ja',
  timezone: 'Asia/Tokyo',
  dateFormat: 'YYYY/MM/DD',
  timeFormat: '24h',
  notifications: {
    email: true,
    push: true,
    inApp: true
  },
  accessibility: {
    highContrast: false,
    largeText: false,
    reducedMotion: false
  }
};

// 設定項目の定義
export interface SettingItem {
  key: string;
  label: string;
  description?: string;
  type: 'text' | 'select' | 'toggle' | 'number' | 'color';
  category: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
  defaultValue: any;
  requiresRestart?: boolean;
}

// 設定カテゴリ
export interface SettingCategory {
  key: string;
  label: string;
  description?: string;
  icon: string;
}

// 設定項目の定義
const SETTING_ITEMS: SettingItem[] = [
  // 一般設定
  {
    key: 'language',
    label: '言語',
    description: 'システムの表示言語を選択してください',
    type: 'select',
    category: 'general',
    options: [
      { value: 'ja', label: '日本語' },
      { value: 'en', label: 'English' }
    ],
    defaultValue: 'ja'
  },
  {
    key: 'timezone',
    label: 'タイムゾーン',
    description: '日時表示に使用するタイムゾーンを選択してください',
    type: 'select',
    category: 'general',
    options: [
      { value: 'Asia/Tokyo', label: '日本標準時 (JST)' },
      { value: 'UTC', label: '協定世界時 (UTC)' },
      { value: 'America/New_York', label: '東部標準時 (EST)' }
    ],
    defaultValue: 'Asia/Tokyo'
  },
  {
    key: 'dateFormat',
    label: '日付形式',
    description: '日付の表示形式を選択してください',
    type: 'select',
    category: 'general',
    options: [
      { value: 'YYYY/MM/DD', label: '2024/01/15' },
      { value: 'MM/DD/YYYY', label: '01/15/2024' },
      { value: 'DD/MM/YYYY', label: '15/01/2024' },
      { value: 'YYYY-MM-DD', label: '2024-01-15' }
    ],
    defaultValue: 'YYYY/MM/DD'
  },
  {
    key: 'timeFormat',
    label: '時刻形式',
    description: '時刻の表示形式を選択してください',
    type: 'select',
    category: 'general',
    options: [
      { value: '24h', label: '24時間形式 (13:30)' },
      { value: '12h', label: '12時間形式 (1:30 PM)' }
    ],
    defaultValue: '24h'
  },

  // 通知設定
  {
    key: 'notifications.email',
    label: 'メール通知',
    description: '重要な更新をメールで受信します',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true
  },
  {
    key: 'notifications.push',
    label: 'プッシュ通知',
    description: 'ブラウザのプッシュ通知を受信します',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true
  },
  {
    key: 'notifications.inApp',
    label: 'アプリ内通知',
    description: 'アプリケーション内で通知を表示します',
    type: 'toggle',
    category: 'notifications',
    defaultValue: true
  },

  // アクセシビリティ設定
  {
    key: 'accessibility.highContrast',
    label: 'ハイコントラスト',
    description: '視認性を向上させるため、コントラストを高くします',
    type: 'toggle',
    category: 'accessibility',
    defaultValue: false
  },
  {
    key: 'accessibility.largeText',
    label: '大きな文字',
    description: 'テキストサイズを大きくして読みやすくします',
    type: 'toggle',
    category: 'accessibility',
    defaultValue: false
  },
  {
    key: 'accessibility.reducedMotion',
    label: 'アニメーション軽減',
    description: 'アニメーションや動きを最小限に抑えます',
    type: 'toggle',
    category: 'accessibility',
    defaultValue: false
  },

  // テーマ設定
  {
    key: 'theme.colors.primary',
    label: 'プライマリカラー',
    description: 'メインの色を設定します',
    type: 'color',
    category: 'theme',
    defaultValue: '#2563eb'
  },
  {
    key: 'theme.colors.secondary',
    label: 'セカンダリカラー',
    description: 'サブの色を設定します',
    type: 'color',
    category: 'theme',
    defaultValue: '#64748b'
  }
];

// 設定カテゴリの定義
const SETTING_CATEGORIES: SettingCategory[] = [
  {
    key: 'general',
    label: '一般',
    description: '基本的なシステム設定',
    icon: 'material-symbols:settings'
  },
  {
    key: 'notifications',
    label: '通知',
    description: '通知の受信設定',
    icon: 'material-symbols:notifications'
  },
  {
    key: 'accessibility',
    label: 'アクセシビリティ',
    description: 'アクセシビリティ関連の設定',
    icon: 'material-symbols:accessibility'
  },
  {
    key: 'theme',
    label: 'テーマ',
    description: '外観とテーマの設定',
    icon: 'material-symbols:palette'
  }
];

/**
 * 設定管理ストア
 */
export class SettingsStore {
  // 現在の設定
  settings = $state<AppSettings>(structuredClone(DEFAULT_SETTINGS));
  
  // 変更追跡
  isDirty = $state(false);
  
  // 保存状態
  isSaving = $state(false);
  
  // エラー状態
  error = $state<string | null>(null);
  
  // 最後の保存時刻
  lastSaved = $state<Date | null>(null);

  constructor() {
    this.loadSettings();
  }

  /**
   * 設定項目の定義を取得
   */
  get settingItems(): SettingItem[] {
    return SETTING_ITEMS;
  }

  /**
   * 設定カテゴリの定義を取得
   */
  get settingCategories(): SettingCategory[] {
    return SETTING_CATEGORIES;
  }

  /**
   * カテゴリ別の設定項目を取得
   */
  getItemsByCategory(categoryKey: string): SettingItem[] {
    return SETTING_ITEMS.filter(item => item.category === categoryKey);
  }

  /**
   * 設定値を取得（ネストしたキーに対応）
   */
  getValue(key: string): any {
    const keys = key.split('.');
    let value: any = this.settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 設定値を更新（ネストしたキーに対応）
   */
  setValue(key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    let target: any = this.settings;
    
    // ネストしたオブジェクトを辿る
    for (const k of keys) {
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    // 値を設定
    target[lastKey] = value;
    this.isDirty = true;
    this.error = null;
    
    // バリデーション
    const item = SETTING_ITEMS.find(item => item.key === key);
    if (item?.validation) {
      const validationError = item.validation(value);
      if (validationError) {
        this.error = validationError;
        return;
      }
    }
    
    // 汎用バリデーション
    const genericValidationError = validateSettingValue(key, value);
    if (genericValidationError) {
      this.error = genericValidationError;
      return;
    }
    
    // 即座に反映が必要な設定は自動保存
    if (this.shouldAutoSave(key)) {
      this.saveSettings();
    }
  }

  /**
   * 設定をリセット
   */
  resetSettings(): void {
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.isDirty = true;
    this.error = null;
  }

  /**
   * 特定のカテゴリをリセット
   */
  resetCategory(categoryKey: string): void {
    const items = this.getItemsByCategory(categoryKey);
    
    for (const item of items) {
      this.setValue(item.key, item.defaultValue);
    }
  }

  /**
   * 設定を保存
   */
  async saveSettings(): Promise<void> {
    if (this.isSaving) return;
    
    this.isSaving = true;
    this.error = null;
    
    try {
      // ローカルストレージに保存
      localStorage.setItem('app-settings', JSON.stringify(this.settings));
      
      // TODO: サーバーに保存する場合はここで API 呼び出し
      // await this.saveToServer(this.settings);
      
      this.isDirty = false;
      this.lastSaved = new Date();
      
      // CSS カスタムプロパティを更新
      this.applyCSSVariables();
      
    } catch (err) {
      this.error = err instanceof Error ? err.message : '設定の保存に失敗しました';
      throw err;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * 設定を読み込み
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('app-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        this.settings = { ...DEFAULT_SETTINGS, ...parsedSettings };
      }
      
      // CSS カスタムプロパティを適用
      this.applyCSSVariables();
      
    } catch (err) {
      console.error('設定の読み込みに失敗しました:', err);
      this.settings = structuredClone(DEFAULT_SETTINGS);
    }
  }

  /**
   * 自動保存が必要な設定かチェック
   */
  private shouldAutoSave(key: string): boolean {
    // テーマやアクセシビリティ設定は即座に反映
    return key.startsWith('theme.') || key.startsWith('accessibility.');
  }

  /**
   * CSS カスタムプロパティを適用
   */
  private applyCSSVariables(): void {
    const root = document.documentElement;
    const theme = this.settings.theme;
    
    // カラー変数を設定
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--color-${key}`, value);
      } else if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, subValue);
        });
      }
    });
    
    // スペーシング変数を設定
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // ボーダーラディウス変数を設定
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });
    
    // フォント変数を設定
    root.style.setProperty('--font-primary', theme.fonts.primary);
    if (theme.fonts.secondary) {
      root.style.setProperty('--font-secondary', theme.fonts.secondary);
    }
    
    // アクセシビリティ設定を適用
    if (this.settings.accessibility.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    if (this.settings.accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    if (this.settings.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
  }

  /**
   * 設定をエクスポート
   */
  exportSettings(): string {
    return JSON.stringify({
      settings: this.settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  }

  /**
   * 設定をインポート
   */
  importSettings(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.settings) {
        this.settings = { ...DEFAULT_SETTINGS, ...importData.settings };
        this.isDirty = true;
        this.applyCSSVariables();
        return true;
      }
      
      return false;
    } catch (err) {
      this.error = '設定のインポートに失敗しました';
      return false;
    }
  }
}

// グローバルインスタンス
export const settingsStore = new SettingsStore();