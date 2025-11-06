/**
 * Firebase認証サービス
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User as FirebaseUser,
  type Unsubscribe
} from 'firebase/auth';
import { auth } from '../firebase.js';
import type {
  AuthUser,
  LoginCredentials,
  AuthError,
  SessionInfo,
  StaffInfo,
  FamilyInfo
} from '../types/auth.js';

/**
 * 認証サービスクラス
 */
export class AuthService {
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];
  private currentUser: AuthUser | null = null;

  /**
   * メールアドレスとパスワードでログイン
   */
  async signIn(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      const authUser = this.mapFirebaseUser(userCredential.user);
      
      // 職員情報または家族情報を取得
      await this.loadUserInfo(authUser);
      
      this.currentUser = authUser;
      this.notifyAuthStateChange(authUser);
      
      return authUser;
    } catch (error: any) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * ログアウト
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyAuthStateChange(null);
    } catch (error: any) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * 新規ユーザー作成（管理者用）
   */
  async createUser(
    credentials: LoginCredentials,
    displayName: string
  ): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      // プロフィール更新
      await updateProfile(userCredential.user, {
        displayName
      });

      const authUser = this.mapFirebaseUser(userCredential.user);
      return authUser;
    } catch (error: any) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * パスワードリセットメール送信
   */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * 認証状態の監視
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): Unsubscribe {
    this.authStateListeners.push(callback);

    // Firebase認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const authUser = this.mapFirebaseUser(firebaseUser);
        await this.loadUserInfo(authUser);
        this.currentUser = authUser;
        this.notifyAuthStateChange(authUser);
      } else {
        this.currentUser = null;
        this.notifyAuthStateChange(null);
      }
    });

    // クリーンアップ関数を返す
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        (listener) => listener !== callback
      );
      unsubscribe();
    };
  }

  /**
   * 現在のユーザーを取得
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * セッション情報を取得
   */
  getSessionInfo(): SessionInfo | null {
    if (!this.currentUser) return null;

    return {
      uid: this.currentUser.uid,
      email: this.currentUser.email,
      loginTime: new Date(), // 実際の実装では永続化されたデータから取得
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
      deviceInfo: this.getDeviceInfo()
    };
  }

  /**
   * Firebase認証ユーザーを内部ユーザー形式に変換
   */
  private mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified
    };
  }

  /**
   * ユーザー情報（職員または家族）を読み込み
   */
  private async loadUserInfo(authUser: AuthUser): Promise<void> {
    try {
      // 実際の実装では Firestore から職員情報を取得
      // ここでは仮のデータを設定
      if (authUser.email.includes('staff') || authUser.email.includes('admin')) {
        authUser.staffInfo = await this.loadStaffInfo(authUser.uid);
      } else if (authUser.email.includes('family')) {
        authUser.familyInfo = await this.loadFamilyInfo(authUser.uid);
      }
    } catch (error) {
      console.warn('Failed to load user info:', error);
    }
  }

  /**
   * 職員情報を読み込み（仮実装）
   */
  private async loadStaffInfo(uid: string): Promise<StaffInfo> {
    // 実際の実装では Firestore から取得
    return {
      id: uid,
      name: 'テスト職員',
      role: 'caregiver',
      department: '介護部',
      permissions: ['user.read', 'user.write', 'reports.write'],
      isActive: true
    };
  }

  /**
   * 家族情報を読み込み（仮実装）
   */
  private async loadFamilyInfo(uid: string): Promise<FamilyInfo> {
    // 実際の実装では Firestore から取得
    return {
      id: uid,
      name: 'テスト家族',
      userId: 'user-1',
      relationship: '息子',
      permissions: ['view_reports', 'view_chat', 'receive_notifications']
    };
  }

  /**
   * 認証エラーをマップ
   */
  private mapAuthError(error: any): AuthError {
    const errorCode = error.code || 'unknown';
    let message = error.message || '不明なエラーが発生しました';

    // Firebase認証エラーコードを日本語メッセージに変換
    switch (errorCode) {
      case 'auth/user-not-found':
        message = 'ユーザーが見つかりません';
        break;
      case 'auth/wrong-password':
        message = 'パスワードが正しくありません';
        break;
      case 'auth/invalid-email':
        message = 'メールアドレスの形式が正しくありません';
        break;
      case 'auth/user-disabled':
        message = 'このアカウントは無効化されています';
        break;
      case 'auth/too-many-requests':
        message = 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください';
        break;
      case 'auth/network-request-failed':
        message = 'ネットワークエラーが発生しました';
        break;
      case 'auth/email-already-in-use':
        message = 'このメールアドレスは既に使用されています';
        break;
      case 'auth/weak-password':
        message = 'パスワードが弱すぎます';
        break;
    }

    return {
      code: errorCode,
      message,
      type: errorCode.startsWith('auth/network') ? 'network' : 'auth'
    };
  }

  /**
   * デバイス情報を取得
   */
  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    };
  }

  /**
   * 認証状態変更を通知
   */
  private notifyAuthStateChange(user: AuthUser | null): void {
    this.authStateListeners.forEach((listener) => {
      try {
        listener(user);
      } catch (error) {
        console.error('Auth state listener error:', error);
      }
    });
  }
}

// シングルトンインスタンス
export const authService = new AuthService();