/**
 * データ同期サービス
 * リアルタイム同期と競合解決を管理
 */

import type { Unsubscribe } from 'firebase/firestore';
import { firestoreService, userDataService, staffDataService } from './database.js';
import type { User } from '../types/user.js';
import type { Staff } from '../types/staff.js';

/**
 * 同期状態
 */
export interface SyncState {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncErrors: SyncError[];
}

/**
 * 同期エラー
 */
export interface SyncError {
  id: string;
  type: 'conflict' | 'network' | 'permission';
  message: string;
  timestamp: Date;
  data?: any;
}

/**
 * 同期設定
 */
export interface SyncConfig {
  enableRealtime: boolean;
  conflictResolution: 'server-wins' | 'client-wins' | 'manual';
  retryAttempts: number;
  retryDelay: number;
}

/**
 * 変更イベント
 */
export interface ChangeEvent<T> {
  type: 'added' | 'modified' | 'removed';
  id: string;
  data: T | null;
  timestamp: Date;
}

/**
 * データ同期サービス
 */
export class DataSyncService {
  private subscriptions: Map<string, Unsubscribe> = new Map();
  private syncState: SyncState = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingChanges: 0,
    syncErrors: []
  };
  private config: SyncConfig = {
    enableRealtime: true,
    conflictResolution: 'server-wins',
    retryAttempts: 3,
    retryDelay: 1000
  };
  private listeners: Map<string, ((state: SyncState) => void)[]> = new Map();

  constructor() {
    this.setupNetworkListeners();
  }

  /**
   * 同期設定を更新
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 同期状態を取得
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * 同期状態の変更を監視
   */
  onSyncStateChange(callback: (state: SyncState) => void): () => void {
    const id = Math.random().toString(36);
    if (!this.listeners.has('syncState')) {
      this.listeners.set('syncState', []);
    }
    this.listeners.get('syncState')!.push(callback);

    return () => {
      const callbacks = this.listeners.get('syncState') || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 利用者データの同期を開始
   */
  syncUsers(callback: (changes: ChangeEvent<User>[]) => void): () => void {
    if (!this.config.enableRealtime) {
      return () => {};
    }

    const subscriptionId = 'users';
    let previousData: Map<string, User> = new Map();

    const unsubscribe = userDataService.subscribeToUsers((users) => {
      const changes: ChangeEvent<User>[] = [];
      const currentData = new Map(users.map(user => [user.id, user]));

      // 追加・更新されたアイテムを検出
      for (const [id, user] of currentData) {
        const previous = previousData.get(id);
        if (!previous) {
          changes.push({
            type: 'added',
            id,
            data: user,
            timestamp: new Date()
          });
        } else if (JSON.stringify(previous) !== JSON.stringify(user)) {
          changes.push({
            type: 'modified',
            id,
            data: user,
            timestamp: new Date()
          });
        }
      }

      // 削除されたアイテムを検出
      for (const [id, user] of previousData) {
        if (!currentData.has(id)) {
          changes.push({
            type: 'removed',
            id,
            data: null,
            timestamp: new Date()
          });
        }
      }

      previousData = currentData;
      
      if (changes.length > 0) {
        callback(changes);
        this.updateSyncState({ lastSyncTime: new Date() });
      }
    });

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * 職員データの同期を開始
   */
  syncStaff(callback: (changes: ChangeEvent<Staff>[]) => void): () => void {
    if (!this.config.enableRealtime) {
      return () => {};
    }

    const subscriptionId = 'staff';
    let previousData: Map<string, Staff> = new Map();

    const unsubscribe = staffDataService.subscribeToStaff((staff) => {
      const changes: ChangeEvent<Staff>[] = [];
      const currentData = new Map(staff.map(s => [s.id, s]));

      // 追加・更新されたアイテムを検出
      for (const [id, staffMember] of currentData) {
        const previous = previousData.get(id);
        if (!previous) {
          changes.push({
            type: 'added',
            id,
            data: staffMember,
            timestamp: new Date()
          });
        } else if (JSON.stringify(previous) !== JSON.stringify(staffMember)) {
          changes.push({
            type: 'modified',
            id,
            data: staffMember,
            timestamp: new Date()
          });
        }
      }

      // 削除されたアイテムを検出
      for (const [id, staffMember] of previousData) {
        if (!currentData.has(id)) {
          changes.push({
            type: 'removed',
            id,
            data: null,
            timestamp: new Date()
          });
        }
      }

      previousData = currentData;
      
      if (changes.length > 0) {
        callback(changes);
        this.updateSyncState({ lastSyncTime: new Date() });
      }
    });

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * 単一利用者の同期を開始
   */
  syncUser(userId: string, callback: (user: User | null) => void): () => void {
    if (!this.config.enableRealtime) {
      return () => {};
    }

    const subscriptionId = `user-${userId}`;
    
    const unsubscribe = userDataService.subscribeToUser(userId, (user) => {
      callback(user);
      this.updateSyncState({ lastSyncTime: new Date() });
    });

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * 単一職員の同期を開始
   */
  syncStaffMember(staffId: string, callback: (staff: Staff | null) => void): () => void {
    if (!this.config.enableRealtime) {
      return () => {};
    }

    const subscriptionId = `staff-${staffId}`;
    
    const unsubscribe = staffDataService.subscribeToStaffMember(staffId, (staff) => {
      callback(staff);
      this.updateSyncState({ lastSyncTime: new Date() });
    });

    this.subscriptions.set(subscriptionId, unsubscribe);

    return () => {
      this.unsubscribe(subscriptionId);
    };
  }

  /**
   * 競合解決
   */
  async resolveConflict<T>(
    localData: T,
    serverData: T,
    conflictType: 'update' | 'delete'
  ): Promise<T | null> {
    switch (this.config.conflictResolution) {
      case 'server-wins':
        return serverData;
      
      case 'client-wins':
        return localData;
      
      case 'manual':
        // 手動解決のためにエラーを記録
        this.addSyncError({
          type: 'conflict',
          message: `データの競合が発生しました: ${conflictType}`,
          data: { local: localData, server: serverData }
        });
        return null;
      
      default:
        return serverData;
    }
  }

  /**
   * 手動同期を実行
   */
  async forcSync(): Promise<void> {
    try {
      this.updateSyncState({ pendingChanges: this.syncState.pendingChanges + 1 });
      
      // 実際の同期処理はここで実装
      // 例: ローカルの変更をサーバーに送信
      
      this.updateSyncState({ 
        lastSyncTime: new Date(),
        pendingChanges: Math.max(0, this.syncState.pendingChanges - 1)
      });
    } catch (error: any) {
      this.addSyncError({
        type: 'network',
        message: `同期エラー: ${error.message}`
      });
    }
  }

  /**
   * 全ての同期を停止
   */
  stopAllSync(): void {
    for (const [id, unsubscribe] of this.subscriptions) {
      unsubscribe();
    }
    this.subscriptions.clear();
  }

  /**
   * 特定の同期を停止
   */
  private unsubscribe(subscriptionId: string): void {
    const unsubscribe = this.subscriptions.get(subscriptionId);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * ネットワーク状態の監視を設定
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.updateSyncState({ isOnline: true });
      this.forcSync(); // オンライン復帰時に同期を実行
    });

    window.addEventListener('offline', () => {
      this.updateSyncState({ isOnline: false });
    });
  }

  /**
   * 同期状態を更新
   */
  private updateSyncState(updates: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...updates };
    this.notifySyncStateChange();
  }

  /**
   * 同期エラーを追加
   */
  private addSyncError(error: Omit<SyncError, 'id' | 'timestamp'>): void {
    const syncError: SyncError = {
      id: Math.random().toString(36),
      timestamp: new Date(),
      ...error
    };

    this.syncState.syncErrors.push(syncError);
    
    // エラー数を制限（最新の10件のみ保持）
    if (this.syncState.syncErrors.length > 10) {
      this.syncState.syncErrors = this.syncState.syncErrors.slice(-10);
    }

    this.notifySyncStateChange();
  }

  /**
   * 同期状態変更を通知
   */
  private notifySyncStateChange(): void {
    const callbacks = this.listeners.get('syncState') || [];
    callbacks.forEach(callback => {
      try {
        callback(this.getSyncState());
      } catch (error) {
        console.error('Sync state listener error:', error);
      }
    });
  }

  /**
   * 同期エラーをクリア
   */
  clearSyncErrors(): void {
    this.updateSyncState({ syncErrors: [] });
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    this.stopAllSync();
    this.listeners.clear();
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

// シングルトンインスタンス
export const dataSyncService = new DataSyncService();