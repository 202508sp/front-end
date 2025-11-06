/**
 * 認証ストアのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authStore } from './auth.svelte.js';
import { authService } from '../services/auth.js';

// AuthServiceをモック
vi.mock('../services/auth.js', () => ({
  authService: {
    signIn: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    onAuthStateChange: vi.fn(),
    getSessionInfo: vi.fn(),
    getCurrentUser: vi.fn()
  }
}));

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    expect(authStore.user).toBeNull();
    expect(authStore.isLoading).toBe(true);
    expect(authStore.error).toBeNull();
    expect(authStore.isAuthenticated).toBe(false);
    expect(authStore.isStaff).toBe(false);
    expect(authStore.isFamily).toBe(false);
  });

  it('権限チェックが正しく動作する', () => {
    // 権限なしの場合
    expect(authStore.hasPermission('user.read')).toBe(false);
    expect(authStore.hasRole('admin')).toBe(false);
    expect(authStore.isAdmin()).toBe(false);
  });

  it('エラークリアが正しく動作する', () => {
    // エラーをクリア
    authStore.clearError();
    expect(authStore.error).toBeNull();
  });
});