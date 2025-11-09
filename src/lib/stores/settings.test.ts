/**
 * 設定ストアのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsStore } from './settings.svelte.ts';

// LocalStorageのモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Documentのモック
Object.defineProperty(window, 'document', {
  value: {
    documentElement: {
      style: {
        setProperty: vi.fn()
      },
      classList: {
        add: vi.fn(),
        remove: vi.fn()
      }
    }
  }
});

describe('SettingsStore', () => {
  let store: SettingsStore;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    store = new SettingsStore();
  });

  it('デフォルト設定で初期化される', () => {
    expect(store.settings.language).toBe('ja');
    expect(store.settings.timezone).toBe('Asia/Tokyo');
    expect(store.settings.dateFormat).toBe('YYYY/MM/DD');
    expect(store.settings.timeFormat).toBe('24h');
    expect(store.settings.notifications.email).toBe(true);
    expect(store.settings.accessibility.highContrast).toBe(false);
  });

  it('設定値を正しく取得できる', () => {
    expect(store.getValue('language')).toBe('ja');
    expect(store.getValue('notifications.email')).toBe(true);
    expect(store.getValue('accessibility.highContrast')).toBe(false);
  });

  it('設定値を正しく更新できる', () => {
    store.setValue('language', 'en');
    expect(store.getValue('language')).toBe('en');
    expect(store.isDirty).toBe(true);
  });

  it('ネストした設定値を正しく更新できる', () => {
    store.setValue('notifications.email', false);
    expect(store.getValue('notifications.email')).toBe(false);
    expect(store.isDirty).toBe(true);
  });

  it('無効な設定値でバリデーションエラーが発生する', () => {
    store.setValue('theme.colors.primary', 'invalid-color');
    expect(store.error).toBeTruthy();
  });

  it('有効な設定値でバリデーションが通る', () => {
    store.setValue('theme.colors.primary', '#FF0000');
    expect(store.error).toBeNull();
  });

  it('設定項目をカテゴリ別に取得できる', () => {
    const generalItems = store.getItemsByCategory('general');
    expect(generalItems.length).toBeGreaterThan(0);
    expect(generalItems.every(item => item.category === 'general')).toBe(true);
  });

  it('設定をリセットできる', () => {
    store.setValue('language', 'en');
    store.resetSettings();
    expect(store.getValue('language')).toBe('ja');
    expect(store.isDirty).toBe(true);
  });

  it('カテゴリ別に設定をリセットできる', () => {
    store.setValue('notifications.email', false);
    store.setValue('language', 'en');
    
    store.resetCategory('notifications');
    
    expect(store.getValue('notifications.email')).toBe(true);
    expect(store.getValue('language')).toBe('en'); // 他のカテゴリは影響を受けない
  });

  it('設定をエクスポートできる', () => {
    const exported = store.exportSettings();
    const parsed = JSON.parse(exported);
    
    expect(parsed.settings).toBeDefined();
    expect(parsed.exportedAt).toBeDefined();
    expect(parsed.version).toBe('1.0');
  });

  it('設定をインポートできる', () => {
    const importData = JSON.stringify({
      settings: {
        language: 'en',
        timezone: 'UTC'
      }
    });
    
    const success = store.importSettings(importData);
    
    expect(success).toBe(true);
    expect(store.getValue('language')).toBe('en');
    expect(store.getValue('timezone')).toBe('UTC');
  });

  it('無効なインポートデータでエラーが発生する', () => {
    const success = store.importSettings('invalid json');
    
    expect(success).toBe(false);
    expect(store.error).toBeTruthy();
  });

  it('設定保存時にlocalStorageが呼ばれる', async () => {
    store.setValue('language', 'en');
    
    await store.saveSettings();
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'app-settings',
      expect.stringContaining('"language":"en"')
    );
    expect(store.isDirty).toBe(false);
  });
});