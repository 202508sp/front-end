/**
 * 認証状態管理ストア（Svelte 5 Rune）
 */

import { authService } from '../services/auth.js';
import type { AuthState, AuthUser, LoginCredentials, SessionInfo } from '../types/auth.js';

/**
 * 認証ストアクラス
 */
class AuthStore {
  // 基本状態
  private _user = $state<AuthUser | null>(null);
  private _isLoading = $state(true);
  private _error = $state<string | null>(null);

  // 派生状態
  isAuthenticated = $derived(this._user !== null);
  isStaff = $derived(this._user?.staffInfo !== undefined);
  isFamily = $derived(this._user?.familyInfo !== undefined);
  userRole = $derived(this._user?.staffInfo?.role || null);
  userPermissions = $derived(this._user?.staffInfo?.permissions || []);

  constructor() {
    this.initializeAuth();
  }

  // ゲッター
  get user() { return this._user; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }

  /**
   * 認証初期化
   */
  private initializeAuth() {
    authService.onAuthStateChange((user) => {
      this._user = user;
      this._isLoading = false;
      this._error = null;
    });
  }

  /**
   * ログイン
   */
  async signIn(credentials: LoginCredentials): Promise<void> {
    this._isLoading = true;
    this._error = null;

    try {
      const user = await authService.signIn(credentials);
      this._user = user;
    } catch (error: any) {
      this._error = error.message;
      throw error;
    } finally {
      this._isLoading = false;
    }
  }

  /**
   * ログアウト
   */
  async signOut(): Promise<void> {
    this._isLoading = true;
    this._error = null;

    try {
      await authService.signOut();
      this._user = null;
    } catch (error: any) {
      this._error = error.message;
      throw error;
    } finally {
      this._isLoading = false;
    }
  }

  /**
   * パスワードリセット
   */
  async sendPasswordReset(email: string): Promise<void> {
    this._error = null;

    try {
      await authService.sendPasswordReset(email);
    } catch (error: any) {
      this._error = error.message;
      throw error;
    }
  }

  /**
   * セッション情報取得
   */
  getSessionInfo(): SessionInfo | null {
    return authService.getSessionInfo();
  }

  /**
   * エラークリア
   */
  clearError(): void {
    this._error = null;
  }

  /**
   * 権限チェック
   */
  hasPermission(permission: string): boolean {
    if (!this._user?.staffInfo) return false;
    return this._user.staffInfo.permissions.includes(permission as any);
  }

  /**
   * ロールチェック
   */
  hasRole(role: string): boolean {
    if (!this._user?.staffInfo) return false;
    return this._user.staffInfo.role === role;
  }

  /**
   * 管理者権限チェック
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * 家族アクセス権限チェック
   */
  hasFamilyPermission(permission: string): boolean {
    if (!this._user?.familyInfo) return false;
    return this._user.familyInfo.permissions.includes(permission as any);
  }
}

// シングルトンインスタンス
export const authStore = new AuthStore();