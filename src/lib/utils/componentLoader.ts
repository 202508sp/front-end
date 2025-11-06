/**
 * コンポーネント遅延読み込みシステム
 * 重いコンポーネントの動的読み込みを管理
 */

import type { Component } from 'svelte';
import { lazyLoader } from './lazy';

/**
 * 遅延読み込み可能なコンポーネント定義
 */
export interface LazyComponentDefinition {
  name: string;
  loader: () => Promise<any>;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  preload?: boolean;
}

/**
 * コンポーネントカテゴリ別の定義
 */
export const componentDefinitions: Record<string, LazyComponentDefinition> = {
  // ダッシュボード関連
  'dashboard/CardGrid': {
    name: 'CardGrid',
    loader: () => import('../components/dashboard/CardGrid.svelte'),
    priority: 'high',
    preload: true
  },
  
  'dashboard/CardSelector': {
    name: 'CardSelector',
    loader: () => import('../components/dashboard/CardSelector.svelte'),
    priority: 'medium'
  },
  
  'dashboard/CardEditModal': {
    name: 'CardEditModal',
    loader: () => import('../components/dashboard/CardEditModal.svelte'),
    priority: 'low'
  },

  // 利用者管理関連
  'user/UserList': {
    name: 'UserList',
    loader: () => import('../components/user/UserList.svelte'),
    priority: 'high'
  },
  
  'user/VirtualizedUserList': {
    name: 'VirtualizedUserList',
    loader: () => import('../components/user/VirtualizedUserList.svelte'),
    priority: 'high',
    dependencies: ['ui/VirtualList', 'ui/InfiniteScroll', 'ui/Pagination']
  },
  
  'user/UserListItem': {
    name: 'UserListItem',
    loader: () => import('../components/user/UserListItem.svelte'),
    priority: 'high'
  },
  
  'user/UserDetail': {
    name: 'UserDetail',
    loader: () => import('../components/user/UserDetail.svelte'),
    priority: 'medium'
  },
  
  'user/UserSidebar': {
    name: 'UserSidebar',
    loader: () => import('../components/user/UserSidebar.svelte'),
    priority: 'medium',
    dependencies: ['user/UserDetail']
  },

  // UI コンポーネント（仮想化関連）
  'ui/VirtualList': {
    name: 'VirtualList',
    loader: () => import('../components/ui/VirtualList.svelte'),
    priority: 'medium'
  },
  
  'ui/InfiniteScroll': {
    name: 'InfiniteScroll',
    loader: () => import('../components/ui/InfiniteScroll.svelte'),
    priority: 'medium'
  },
  
  'ui/Pagination': {
    name: 'Pagination',
    loader: () => import('../components/ui/Pagination.svelte'),
    priority: 'medium'
  },
  
  'ui/LazyComponent': {
    name: 'LazyComponent',
    loader: () => import('../components/ui/LazyComponent.svelte'),
    priority: 'high',
    preload: true
  },

  // 職員管理関連
  'staff/StaffList': {
    name: 'StaffList',
    loader: () => import('../components/staff/StaffList.svelte'),
    priority: 'medium'
  },
  
  'staff/StaffDetail': {
    name: 'StaffDetail',
    loader: () => import('../components/staff/StaffDetail.svelte'),
    priority: 'medium'
  },
  
  'staff/StaffSchedule': {
    name: 'StaffSchedule',
    loader: () => import('../components/staff/StaffSchedule.svelte'),
    priority: 'low'
  },

  // 統計・分析関連
  'statistics/StatChart': {
    name: 'StatChart',
    loader: () => import('../components/statistics/StatChart.svelte'),
    priority: 'low'
  },
  
  'statistics/DateRangePicker': {
    name: 'DateRangePicker',
    loader: () => import('../components/statistics/DateRangePicker.svelte'),
    priority: 'medium'
  },
  
  'statistics/StatCard': {
    name: 'StatCard',
    loader: () => import('../components/statistics/StatCard.svelte'),
    priority: 'medium'
  },

  // チャット関連
  'chat/ChatWindow': {
    name: 'ChatWindow',
    loader: () => import('../components/chat/ChatWindow.svelte'),
    priority: 'medium'
  },
  
  'chat/MessageList': {
    name: 'MessageList',
    loader: () => import('../components/chat/MessageList.svelte'),
    priority: 'high'
  },
  
  'chat/MessageInput': {
    name: 'MessageInput',
    loader: () => import('../components/chat/MessageInput.svelte'),
    priority: 'high'
  },

  // 家族ポータル関連
  'family/FamilyDashboard': {
    name: 'FamilyDashboard',
    loader: () => import('../components/family/FamilyDashboard.svelte'),
    priority: 'high'
  },
  
  'family/FamilyReportViewer': {
    name: 'FamilyReportViewer',
    loader: () => import('../components/family/FamilyReportViewer.svelte'),
    priority: 'medium'
  },
  
  'family/SimplifiedInterface': {
    name: 'SimplifiedInterface',
    loader: () => import('../components/family/SimplifiedInterface.svelte'),
    priority: 'medium'
  },

  // 設定関連
  'settings/SettingsForm': {
    name: 'SettingsForm',
    loader: () => import('../components/settings/SettingsForm.svelte'),
    priority: 'low'
  },
  
  'settings/SettingsNavigation': {
    name: 'SettingsNavigation',
    loader: () => import('../components/settings/SettingsNavigation.svelte'),
    priority: 'medium'
  }
};

/**
 * コンポーネントローダークラス
 */
export class ComponentLoader {
  private loadQueue: string[] = [];
  private isProcessing = false;

  /**
   * コンポーネントを遅延読み込み
   */
  async loadComponent(componentPath: string): Promise<Component> {
    const definition = componentDefinitions[componentPath];
    if (!definition) {
      throw new Error(`Component definition not found: ${componentPath}`);
    }

    // 依存関係を先に読み込み
    if (definition.dependencies) {
      await Promise.all(
        definition.dependencies.map(dep => this.loadComponent(dep))
      );
    }

    const key = `component:${componentPath}`;
    const module = await definition.loader();
    return module.default;
  }

  /**
   * 優先度に基づいてコンポーネントをプリロード
   */
  async preloadByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const components = Object.entries(componentDefinitions)
      .filter(([_, def]) => def.priority === priority)
      .map(([path]) => path);

    await this.preloadComponents(components);
  }

  /**
   * 複数のコンポーネントをプリロード
   */
  async preloadComponents(componentPaths: string[]): Promise<void> {
    // キューに追加
    this.loadQueue.push(...componentPaths.filter(path => !this.loadQueue.includes(path)));
    
    if (!this.isProcessing) {
      await this.processLoadQueue();
    }
  }

  /**
   * 自動プリロード対象のコンポーネントを読み込み
   */
  async preloadAutoComponents(): Promise<void> {
    const autoComponents = Object.entries(componentDefinitions)
      .filter(([_, def]) => def.preload)
      .map(([path]) => path);

    await this.preloadComponents(autoComponents);
  }

  /**
   * ページに必要なコンポーネントをプリロード
   */
  async preloadForPage(pageName: string): Promise<void> {
    const pageComponents: Record<string, string[]> = {
      home: [
        'dashboard/CardGrid',
        'dashboard/CardSelector'
      ],
      user: [
        'user/UserList',
        'user/UserDetail',
        'user/UserSidebar'
      ],
      staff: [
        'staff/StaffList',
        'staff/StaffDetail'
      ],
      statistics: [
        'statistics/StatChart',
        'statistics/DateRangePicker',
        'statistics/StatCard'
      ],
      chat: [
        'chat/ChatWindow',
        'chat/MessageList',
        'chat/MessageInput'
      ],
      familyPortal: [
        'family/FamilyDashboard',
        'family/FamilyReportViewer'
      ],
      settings: [
        'settings/SettingsForm',
        'settings/SettingsNavigation'
      ]
    };

    const components = pageComponents[pageName] || [];
    await this.preloadComponents(components);
  }

  /**
   * 読み込みキューを処理
   */
  private async processLoadQueue(): Promise<void> {
    if (this.isProcessing || this.loadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // 優先度順にソート
      const sortedQueue = this.loadQueue.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = componentDefinitions[a]?.priority || 'low';
        const bPriority = componentDefinitions[b]?.priority || 'low';
        return priorityOrder[aPriority] - priorityOrder[bPriority];
      });

      // バッチ処理（同時に3つまで）
      const batchSize = 3;
      for (let i = 0; i < sortedQueue.length; i += batchSize) {
        const batch = sortedQueue.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (componentPath) => {
            try {
              const definition = componentDefinitions[componentPath];
              if (definition) {
                const key = `component:${componentPath}`;
                await lazyLoader.preload(definition.loader, key);
              }
            } catch (error) {
              console.warn(`Failed to preload component ${componentPath}:`, error);
            }
          })
        );

        // 次のバッチまで少し待機（ブラウザをブロックしないため）
        if (i + batchSize < sortedQueue.length) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      this.loadQueue = [];
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * コンポーネントの読み込み状態を取得
   */
  isComponentLoading(componentPath: string): boolean {
    const key = `component:${componentPath}`;
    return lazyLoader.isLoading(key);
  }

  /**
   * コンポーネントのエラー状態を取得
   */
  getComponentError(componentPath: string): Error | null {
    const key = `component:${componentPath}`;
    return lazyLoader.getError(key);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    lazyLoader.clearCache();
    this.loadQueue = [];
    this.isProcessing = false;
  }
}

// グローバルインスタンス
export const componentLoader = new ComponentLoader();

/**
 * コンポーネント遅延読み込み用のヘルパー関数
 */
export function lazyComponent(componentPath: string) {
  return () => componentLoader.loadComponent(componentPath);
}