/**
 * 認証・認可フック
 */

import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';
import { authService } from '../services/auth.js';
import { checkRouteAccess } from '../utils/auth.js';
import type { RouteGuardConfig } from '../types/auth.js';

/**
 * ルート設定マップ
 */
const routeConfigs: Record<string, RouteGuardConfig> = {
  // 公開ページ
  '/': { requireAuth: false },
  '/login': { requireAuth: false },
  
  // 認証が必要なページ
  '/dashboard': { requireAuth: true, allowFamily: true },
  '/user': { requireAuth: true, requiredPermissions: ['user.read'] },
  '/staff': { requireAuth: true, requiredPermissions: ['staff.read'] },
  '/statistics': { requireAuth: true, requiredPermissions: ['statistics.read'] },
  '/management': { requireAuth: true, requiredRole: 'manager' },
  '/settings': { requireAuth: true, requiredRole: 'admin' },
  
  // 家族専用ページ
  '/family-portal': { requireAuth: true, allowFamily: true },
  
  // 職員専用ページ
  '/reports': { requireAuth: true, requiredPermissions: ['reports.write'] }
};

/**
 * SvelteKit ハンドラー（サーバーサイド認証）
 */
export const authHandle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  
  // 静的ファイルやAPIルートはスキップ
  if (pathname.startsWith('/api/') || pathname.startsWith('/_app/') || pathname.includes('.')) {
    return resolve(event);
  }

  // ルート設定を取得
  const config = getRouteConfig(pathname);
  
  if (config.requireAuth) {
    // サーバーサイドでの認証チェック（Cookieベース）
    const authToken = event.cookies.get('auth-token');
    
    if (!authToken) {
      // 認証が必要だがトークンがない場合
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      throw redirect(302, redirectUrl);
    }

    // トークンの検証（実際の実装では JWT 検証など）
    try {
      // const user = await verifyAuthToken(authToken);
      // event.locals.user = user;
    } catch (error) {
      // 無効なトークンの場合
      event.cookies.delete('auth-token', { path: '/' });
      const redirectUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      throw redirect(302, redirectUrl);
    }
  }

  return resolve(event);
};

/**
 * ルート設定を取得
 */
function getRouteConfig(pathname: string): RouteGuardConfig {
  // 完全一致を優先
  if (routeConfigs[pathname]) {
    return routeConfigs[pathname];
  }

  // パターンマッチング
  for (const [pattern, config] of Object.entries(routeConfigs)) {
    if (matchRoute(pathname, pattern)) {
      return config;
    }
  }

  // デフォルト設定（認証不要）
  return { requireAuth: false };
}

/**
 * ルートパターンマッチング
 */
function matchRoute(pathname: string, pattern: string): boolean {
  // 簡易的なパターンマッチング
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(pathname);
  }
  
  return pathname.startsWith(pattern);
}

/**
 * クライアントサイド認証チェック
 */
export function useAuthGuard(config: RouteGuardConfig) {
  return {
    /**
     * ページアクセス時のチェック
     */
    checkAccess: () => {
      const accessCheck = checkRouteAccess(config);
      
      if (!accessCheck.hasPermission) {
        const redirectTo = config.redirectTo || '/login';
        
        if (redirectTo === '/login') {
          const currentUrl = window.location.pathname + window.location.search;
          window.location.href = `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`;
        } else {
          window.location.href = redirectTo;
        }
        
        return false;
      }
      
      return true;
    },

    /**
     * 権限チェック結果を取得
     */
    getAccessResult: () => checkRouteAccess(config)
  };
}

/**
 * 権限デコレーター（アクション用）
 */
export function requirePermission(permission: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('認証が必要です');
      }

      if (!currentUser.staffInfo?.permissions.includes(permission as any)) {
        throw new Error(`権限 '${permission}' が必要です`);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * ロールデコレーター（アクション用）
 */
export function requireRole(role: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args: any[]) {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        throw new Error('認証が必要です');
      }

      if (currentUser.staffInfo?.role !== role) {
        throw new Error(`ロール '${role}' が必要です`);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}