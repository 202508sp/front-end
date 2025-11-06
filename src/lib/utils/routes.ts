/**
 * ルート管理とコード分割
 * 動的インポートによるルートレベルのコード分割を実装
 */

import type { ComponentType } from 'svelte';
import { lazyLoader } from './lazy';

/**
 * ルート定義の型
 */
export interface RouteDefinition {
  path: string;
  component: () => Promise<{ default: ComponentType }>;
  preload?: boolean;
  permissions?: string[];
  roles?: string[];
  requireAuth?: boolean;
  allowFamily?: boolean;
}

/**
 * ルート設定
 */
export const routes: Record<string, RouteDefinition> = {
  home: {
    path: '/',
    component: () => import('../../routes/+page.svelte'),
    preload: true
  },
  
  users: {
    path: '/user',
    component: () => import('../../routes/user/+page.svelte'),
    permissions: ['user.read'],
    requireAuth: true
  },
  
  staff: {
    path: '/staff',
    component: () => import('../../routes/staff/+page.svelte'),
    permissions: ['staff.read'],
    requireAuth: true
  },
  
  statistics: {
    path: '/statistics',
    component: () => import('../../routes/statistics/+page.svelte'),
    requireAuth: true
  },
  
  management: {
    path: '/management',
    component: () => import('../../routes/management/+page.svelte'),
    requireAuth: true
  },
  
  settings: {
    path: '/settings',
    component: () => import('../../routes/settings/+page.svelte'),
    roles: ['admin'],
    requireAuth: true
  },
  
  familyPortal: {
    path: '/family-portal',
    component: () => import('../../routes/family-portal/+page.svelte'),
    allowFamily: true,
    requireAuth: true
  },
  
  chat: {
    path: '/chat',
    component: () => import('../../routes/chat/+page.svelte'),
    requireAuth: true
  },
  
  login: {
    path: '/login',
    component: () => import('../../routes/login/+page.svelte'),
    preload: true
  }
};

/**
 * ルートマネージャークラス
 */
export class RouteManager {
  private preloadedRoutes = new Set<string>();

  /**
   * ルートコンポーネントを遅延読み込み
   */
  async loadRoute(routeName: string): Promise<ComponentType> {
    const route = routes[routeName];
    if (!route) {
      throw new Error(`Route not found: ${routeName}`);
    }

    const key = `route:${routeName}`;
    return lazyLoader.loadComponent(route.component, key);
  }

  /**
   * ルートをプリロード
   */
  async preloadRoute(routeName: string): Promise<void> {
    if (this.preloadedRoutes.has(routeName)) {
      return;
    }

    const route = routes[routeName];
    if (!route) {
      return;
    }

    try {
      const key = `route:${routeName}`;
      await lazyLoader.preload(route.component, key);
      this.preloadedRoutes.add(routeName);
    } catch (error) {
      console.warn(`Failed to preload route ${routeName}:`, error);
    }
  }

  /**
   * 重要なルートを事前読み込み
   */
  async preloadCriticalRoutes(): Promise<void> {
    const criticalRoutes = Object.entries(routes)
      .filter(([_, route]) => route.preload)
      .map(([name]) => name);

    await Promise.all(
      criticalRoutes.map(routeName => this.preloadRoute(routeName))
    );
  }

  /**
   * ユーザーの権限に基づいてルートをプリロード
   */
  async preloadUserRoutes(userPermissions: string[], userRoles: string[]): Promise<void> {
    const accessibleRoutes = Object.entries(routes)
      .filter(([_, route]) => {
        // 権限チェック
        if (route.permissions && !route.permissions.some(p => userPermissions.includes(p))) {
          return false;
        }
        
        // ロールチェック
        if (route.roles && !route.roles.some(r => userRoles.includes(r))) {
          return false;
        }
        
        return true;
      })
      .map(([name]) => name);

    // 並列でプリロード（最大3つまで同時実行）
    const chunks = this.chunkArray(accessibleRoutes, 3);
    for (const chunk of chunks) {
      await Promise.all(chunk.map(routeName => this.preloadRoute(routeName)));
    }
  }

  /**
   * ルートの読み込み状態を取得
   */
  isRouteLoading(routeName: string): boolean {
    const key = `route:${routeName}`;
    return lazyLoader.isLoading(key);
  }

  /**
   * ルートのエラー状態を取得
   */
  getRouteError(routeName: string): Error | null {
    const key = `route:${routeName}`;
    return lazyLoader.getError(key);
  }

  /**
   * 配列をチャンクに分割
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    lazyLoader.clearCache();
    this.preloadedRoutes.clear();
  }
}

// グローバルインスタンス
export const routeManager = new RouteManager();

/**
 * ルート名からパスを取得
 */
export function getRoutePath(routeName: string): string {
  const route = routes[routeName];
  return route?.path || '/';
}

/**
 * パスからルート名を取得
 */
export function getRouteNameFromPath(path: string): string | null {
  const entry = Object.entries(routes).find(([_, route]) => route.path === path);
  return entry ? entry[0] : null;
}

/**
 * ルートの権限チェック
 */
export function checkRouteAccess(
  routeName: string,
  userPermissions: string[] = [],
  userRoles: string[] = [],
  isAuthenticated = false,
  isFamily = false
): boolean {
  const route = routes[routeName];
  if (!route) {
    return false;
  }

  // 認証が必要な場合
  if (route.requireAuth && !isAuthenticated) {
    return false;
  }

  // 家族ユーザーの場合
  if (isFamily && !route.allowFamily) {
    return false;
  }

  // 権限チェック
  if (route.permissions && !route.permissions.some(p => userPermissions.includes(p))) {
    return false;
  }

  // ロールチェック
  if (route.roles && !route.roles.some(r => userRoles.includes(r))) {
    return false;
  }

  return true;
}