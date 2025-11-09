/**
 * 認証・認可ユーティリティ
 */

import { authStore } from '../stores/auth.svelte.js';
import type { 
  RouteGuardConfig, 
  PermissionCheckResult
} from '../types/auth.js';
import type { StaffRole, Permission } from '../types/staff.js';

/**
 * 権限チェック関数
 */
export function checkPermission(
  requiredPermission: Permission,
  userPermissions: Permission[] = []
): PermissionCheckResult {
  const hasPermission = userPermissions.includes(requiredPermission);
  
  return {
    hasPermission,
    reason: hasPermission ? undefined : `権限 '${requiredPermission}' が必要です`
  };
}

/**
 * ロールチェック関数
 */
export function checkRole(
  requiredRole: StaffRole,
  userRole?: StaffRole
): PermissionCheckResult {
  const hasPermission = userRole === requiredRole;
  
  return {
    hasPermission,
    reason: hasPermission ? undefined : `ロール '${requiredRole}' が必要です`
  };
}

/**
 * 複数権限チェック（AND条件）
 */
export function checkMultiplePermissions(
  requiredPermissions: Permission[],
  userPermissions: Permission[] = []
): PermissionCheckResult {
  const missingPermissions = requiredPermissions.filter(
    permission => !userPermissions.includes(permission)
  );
  
  const hasPermission = missingPermissions.length === 0;
  
  return {
    hasPermission,
    reason: hasPermission 
      ? undefined 
      : `以下の権限が必要です: ${missingPermissions.join(', ')}`
  };
}

/**
 * 管理者権限チェック
 */
export function checkAdminAccess(userRole?: StaffRole): PermissionCheckResult {
  const isAdmin = userRole === 'admin';
  
  return {
    hasPermission: isAdmin,
    reason: isAdmin ? undefined : '管理者権限が必要です'
  };
}

/**
 * 家族アクセス権限チェック
 */
export function checkFamilyAccess(
  requiredPermission: string,
  familyPermissions: string[] = []
): PermissionCheckResult {
  const hasPermission = familyPermissions.includes(requiredPermission);
  
  return {
    hasPermission,
    reason: hasPermission ? undefined : `家族権限 '${requiredPermission}' が必要です`
  };
}

/**
 * ルートアクセス権限チェック
 */
export function checkRouteAccess(config: RouteGuardConfig): PermissionCheckResult {
  const user = authStore.user;
  
  // 認証が必要な場合
  if (config.requireAuth && !authStore.isAuthenticated) {
    return {
      hasPermission: false,
      reason: 'ログインが必要です'
    };
  }

  // 認証不要な場合は通す
  if (!config.requireAuth) {
    return { hasPermission: true };
  }

  // 職員のみアクセス可能で家族アクセスが許可されていない場合
  if (!config.allowFamily && !authStore.isStaff) {
    return {
      hasPermission: false,
      reason: '職員アカウントが必要です'
    };
  }

  // 特定ロールが必要な場合
  if (config.requiredRole && authStore.isStaff) {
    const roleCheck = checkRole(config.requiredRole, user?.staffInfo?.role);
    if (!roleCheck.hasPermission) {
      return roleCheck;
    }
  }

  // 特定権限が必要な場合
  if (config.requiredPermissions && authStore.isStaff) {
    const permissionCheck = checkMultiplePermissions(
      config.requiredPermissions,
      user?.staffInfo?.permissions || []
    );
    if (!permissionCheck.hasPermission) {
      return permissionCheck;
    }
  }

  return { hasPermission: true };
}

/**
 * ルートガードデコレーター（関数用）
 */
export function requireAuth(config: RouteGuardConfig = { requireAuth: true }) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const accessCheck = checkRouteAccess(config);
      
      if (!accessCheck.hasPermission) {
        throw new Error(accessCheck.reason || 'アクセスが拒否されました');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * 権限ベースの条件分岐ヘルパー
 */
export function withPermission<T>(
  permission: Permission,
  callback: () => T,
  fallback?: () => T
): T | undefined {
  if (authStore.hasPermission(permission)) {
    return callback();
  } else if (fallback) {
    return fallback();
  }
  return undefined;
}

/**
 * ロールベースの条件分岐ヘルパー
 */
export function withRole<T>(
  role: StaffRole,
  callback: () => T,
  fallback?: () => T
): T | undefined {
  if (authStore.hasRole(role)) {
    return callback();
  } else if (fallback) {
    return fallback();
  }
  return undefined;
}

/**
 * 権限レベルの比較（数値ベース）
 */
export function getPermissionLevel(role: StaffRole): number {
  const levels: Record<StaffRole, number> = {
    'admin': 100,
    'manager': 80,
    'nurse': 60,
    'caregiver': 40,
    'therapist': 40,
    'support': 20
  };
  
  return levels[role] || 0;
}

/**
 * より高い権限レベルを持つかチェック
 */
export function hasHigherPermissionLevel(
  userRole: StaffRole,
  requiredRole: StaffRole
): boolean {
  return getPermissionLevel(userRole) >= getPermissionLevel(requiredRole);
}

/**
 * 権限エラーメッセージの生成
 */
export function generatePermissionErrorMessage(
  config: RouteGuardConfig,
  currentUser?: any
): string {
  if (!config.requireAuth) {
    return 'アクセスが拒否されました';
  }

  if (!currentUser) {
    return 'ログインが必要です';
  }

  if (config.requiredRole) {
    return `${config.requiredRole} 権限が必要です`;
  }

  if (config.requiredPermissions) {
    return `以下の権限が必要です: ${config.requiredPermissions.join(', ')}`;
  }

  return 'アクセス権限がありません';
}