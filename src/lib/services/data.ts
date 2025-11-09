/**
 * 統合データサービス
 * オンライン・オフライン両対応の統一インターフェース
 */

import { firestoreService, userDataService, staffDataService } from './database.js';
import { dataSyncService } from './sync.js';
import { offlineStorageService, offlineDataService } from './offline.js';
import type { User } from '../types/user.js';
import type { Staff } from '../types/staff.js';
import type { QueryOptions } from './database.js';

/**
 * データサービスの状態
 */
export interface DataServiceState {
  isOnline: boolean;
  isInitialized: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  syncErrors: number;
}

/**
 * データサービス設定
 */
export interface DataServiceConfig {
  enableOfflineMode: boolean;
  enableRealTimeSync: boolean;
  autoSyncInterval: number;
  maxRetryAttempts: number;
}

/**
 * 統合データサービス
 * オンライン・オフライン両対応の統一インターフェースを提供
 */
export class IntegratedDataService {
  private config: DataServiceConfig = {
    enableOfflineMode: true,
    enableRealTimeSync: true,
    autoSyncInterval: 30000,
    maxRetryAttempts: 3
  };
  private isInitialized = false;
  private listeners: ((state: DataServiceState) => void)[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * サービスを初期化
   */
  private async initialize(): Promise<void> {
    try {
      // オフラインストレージの設定
      if (this.config.enableOfflineMode) {
        offlineStorageService.updateConfig({
          enableAutoSync: this.config.enableRealTimeSync,
          syncInterval: this.config.autoSyncInterval,
          maxRetryAttempts: this.config.maxRetryAttempts
        });
      }

      // 同期サービスの設定
      if (this.config.enableRealTimeSync) {
        dataSyncService.updateConfig({
          enableRealtime: true,
          conflictResolution: 'server-wins',
          retryAttempts: this.config.maxRetryAttempts,
          retryDelay: 1000
        });
      }

      // 初期データの読み込み
      await this.loadInitialData();

      this.isInitialized = true;
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to initialize data service:', error);
    }
  }

  /**
   * 初期データを読み込み
   */
  private async loadInitialData(): Promise<void> {
    if (navigator.onLine) {
      try {
        // オンライン時はサーバーからデータを取得してキャッシュ
        await offlineStorageService.refreshCache();
      } catch (error) {
        console.warn('Failed to load initial data from server:', error);
      }
    }
    // オフライン時はキャッシュされたデータを使用（何もしない）
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<DataServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 関連サービスの設定も更新
    if (config.enableOfflineMode !== undefined || config.autoSyncInterval !== undefined) {
      offlineStorageService.updateConfig({
        enableAutoSync: this.config.enableRealTimeSync,
        syncInterval: this.config.autoSyncInterval
      });
    }

    if (config.enableRealTimeSync !== undefined || config.maxRetryAttempts !== undefined) {
      dataSyncService.updateConfig({
        enableRealtime: this.config.enableRealTimeSync,
        retryAttempts: this.config.maxRetryAttempts
      });
    }
  }

  /**
   * サービス状態を取得
   */
  getState(): DataServiceState {
    const syncState = dataSyncService.getSyncState();
    const cacheState = offlineStorageService.getCacheState();

    return {
      isOnline: navigator.onLine,
      isInitialized: this.isInitialized,
      lastSyncTime: syncState.lastSyncTime || cacheState.lastSyncTime,
      pendingChanges: syncState.pendingChanges + cacheState.pendingChanges,
      syncErrors: syncState.syncErrors.length
    };
  }

  /**
   * 状態変更を監視
   */
  onStateChange(callback: (state: DataServiceState) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // === 利用者データ操作 ===

  /**
   * 利用者一覧を取得
   */
  async getUsers(options?: QueryOptions): Promise<User[]> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.getUsers();
    } else {
      return userDataService.listUsers(options);
    }
  }

  /**
   * 利用者を取得
   */
  async getUser(id: string): Promise<User | null> {
    if (navigator.onLine) {
      try {
        return await userDataService.getUser(id);
      } catch (error) {
        if (this.config.enableOfflineMode) {
          // オフライン時はキャッシュから検索
          const cachedUsers = offlineStorageService.getCachedUsers();
          return cachedUsers.find(user => user.id === id) || null;
        }
        throw error;
      }
    } else if (this.config.enableOfflineMode) {
      const cachedUsers = offlineStorageService.getCachedUsers();
      return cachedUsers.find(user => user.id === id) || null;
    } else {
      throw new Error('オフラインモードが無効です');
    }
  }

  /**
   * 利用者を作成
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.createUser(userData);
    } else {
      return userDataService.createUser(userData);
    }
  }

  /**
   * 利用者を更新
   */
  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.updateUser(id, userData);
    } else {
      return userDataService.updateUser(id, userData);
    }
  }

  /**
   * 利用者を削除
   */
  async deleteUser(id: string): Promise<void> {
    if (navigator.onLine) {
      try {
        await userDataService.deleteUser(id);
      } catch (error) {
        if (this.config.enableOfflineMode) {
          offlineStorageService.addPendingChange({
            type: 'delete',
            collection: 'users',
            entityId: id
          });
        }
        throw error;
      }
    } else if (this.config.enableOfflineMode) {
      offlineStorageService.addPendingChange({
        type: 'delete',
        collection: 'users',
        entityId: id
      });
    } else {
      throw new Error('オフラインモードが無効です');
    }
  }

  /**
   * 利用者検索
   */
  async searchUsers(searchTerm: string): Promise<User[]> {
    const users = await this.getUsers();
    return users.filter(user => 
      user.name.includes(searchTerm) || 
      user.nameKana.includes(searchTerm)
    );
  }

  // === 職員データ操作 ===

  /**
   * 職員一覧を取得
   */
  async getStaff(options?: QueryOptions): Promise<Staff[]> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.getStaff();
    } else {
      return staffDataService.listStaff(options);
    }
  }

  /**
   * 職員を取得
   */
  async getStaffMember(id: string): Promise<Staff | null> {
    if (navigator.onLine) {
      try {
        return await staffDataService.getStaff(id);
      } catch (error) {
        if (this.config.enableOfflineMode) {
          const cachedStaff = offlineStorageService.getCachedStaff();
          return cachedStaff.find(staff => staff.id === id) || null;
        }
        throw error;
      }
    } else if (this.config.enableOfflineMode) {
      const cachedStaff = offlineStorageService.getCachedStaff();
      return cachedStaff.find(staff => staff.id === id) || null;
    } else {
      throw new Error('オフラインモードが無効です');
    }
  }

  /**
   * 職員を作成
   */
  async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.createStaff(staffData);
    } else {
      return staffDataService.createStaff(staffData);
    }
  }

  /**
   * 職員を更新
   */
  async updateStaff(id: string, staffData: Partial<Staff>): Promise<void> {
    if (this.config.enableOfflineMode) {
      return offlineDataService.updateStaff(id, staffData);
    } else {
      return staffDataService.updateStaff(id, staffData);
    }
  }

  /**
   * 職員を削除
   */
  async deleteStaff(id: string): Promise<void> {
    if (navigator.onLine) {
      try {
        await staffDataService.deleteStaff(id);
      } catch (error) {
        if (this.config.enableOfflineMode) {
          offlineStorageService.addPendingChange({
            type: 'delete',
            collection: 'staff',
            entityId: id
          });
        }
        throw error;
      }
    } else if (this.config.enableOfflineMode) {
      offlineStorageService.addPendingChange({
        type: 'delete',
        collection: 'staff',
        entityId: id
      });
    } else {
      throw new Error('オフラインモードが無効です');
    }
  }

  /**
   * アクティブな職員を取得
   */
  async getActiveStaff(): Promise<Staff[]> {
    const staff = await this.getStaff();
    return staff.filter(s => s.isActive);
  }

  // === リアルタイム同期 ===

  /**
   * 利用者データのリアルタイム同期を開始
   */
  subscribeToUsers(callback: (users: User[]) => void): () => void {
    if (!this.config.enableRealTimeSync) {
      return () => {};
    }

    return dataSyncService.syncUsers((changes) => {
      // 変更をキャッシュに反映
      if (this.config.enableOfflineMode) {
        this.getUsers().then(users => {
          offlineStorageService.cacheUsers(users);
          callback(users);
        });
      }
    });
  }

  /**
   * 職員データのリアルタイム同期を開始
   */
  subscribeToStaff(callback: (staff: Staff[]) => void): () => void {
    if (!this.config.enableRealTimeSync) {
      return () => {};
    }

    return dataSyncService.syncStaff((changes) => {
      // 変更をキャッシュに反映
      if (this.config.enableOfflineMode) {
        this.getStaff().then(staff => {
          offlineStorageService.cacheStaff(staff);
          callback(staff);
        });
      }
    });
  }

  // === 同期・キャッシュ管理 ===

  /**
   * 手動同期を実行
   */
  async forceSync(): Promise<void> {
    if (navigator.onLine) {
      await Promise.all([
        dataSyncService.forcSync(),
        offlineStorageService.syncPendingChanges(),
        offlineStorageService.refreshCache()
      ]);
      this.notifyStateChange();
    }
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    if (this.config.enableOfflineMode) {
      offlineStorageService.clearCache();
      this.notifyStateChange();
    }
  }

  /**
   * 状態変更を通知
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Data service state listener error:', error);
      }
    });
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    dataSyncService.stopAllSync();
    offlineStorageService.destroy();
    this.listeners = [];
  }
}

// シングルトンインスタンス
export const dataService = new IntegratedDataService();