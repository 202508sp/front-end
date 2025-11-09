/**
 * 認証・認可関連の型定義
 */

import type { User as FirebaseUser } from 'firebase/auth';
import type { StaffRole, Permission } from './staff.js';

/**
 * 認証状態
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * 認証済みユーザー情報
 */
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  staffInfo?: StaffInfo;
  familyInfo?: FamilyInfo;
}

/**
 * 職員情報（認証ユーザーに紐づく）
 */
export interface StaffInfo {
  id: string;
  name: string;
  role: StaffRole;
  department: string;
  permissions: Permission[];
  isActive: boolean;
}

/**
 * 家族情報（認証ユーザーに紐づく）
 */
export interface FamilyInfo {
  id: string;
  name: string;
  userId: string; // 関連する利用者ID
  relationship: string;
  permissions: AuthFamilyPermission[];
}

/**
 * 家族の権限（認証用）
 */
export type AuthFamilyPermission = 'view_reports' | 'view_chat' | 'receive_notifications';

/**
 * ログイン資格情報
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * 認証エラー
 */
export interface AuthError {
  code: string;
  message: string;
  type: 'auth' | 'network' | 'validation';
}

/**
 * セッション情報
 */
export interface SessionInfo {
  uid: string;
  email: string;
  loginTime: Date;
  lastActivity: Date;
  expiresAt: Date;
  deviceInfo?: DeviceInfo;
}

/**
 * デバイス情報
 */
export interface DeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  ipAddress?: string;
}

/**
 * 権限チェック結果
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
}

/**
 * ルートガード設定
 */
export interface RouteGuardConfig {
  requireAuth: boolean;
  requiredRole?: StaffRole;
  requiredPermissions?: Permission[];
  allowFamily?: boolean;
  redirectTo?: string;
}

/**
 * Firebase認証ユーザーから内部ユーザーへの変換
 */
export function mapFirebaseUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified
  };
}