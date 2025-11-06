/**
 * オフライン対応サービス
 * ローカルストレージとの連携、オフライン時のデータキャッシュ、オンライン復帰時の同期
 */

import type { User } from '../types/user.js';
import type { Staff } from '../types/staff.js';
import { userDataService, staffDataService } from './database.js';

/**
 * オフラインストレージのキー
 */
const STORAGE_KEYS = {
  USERS: 'offline_users',
  STAFF: 'offline_staff',
  PENDING_CHANGES: 'offline_pending_changes',
  LAST_SYNC: 'offline_last_sync',
  CACHE_VERSION: 'offline_cache_version'
} as const;

/**
 * キャッシュバージョン（データ構造変更時にインクリメント）
 */
const CACHE_VERSION = '1.0.0';

/**
 * 保留中の変更操作
 */
export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: 'users' | 'staff';
  entityId?: string;
  data?: any;
  timestamp: Date;
  retryCount: number;
}

/**
 * オフラインキャッシュの状態
 */
export interface OfflineCacheState {
  isOffline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  cacheSize: number;
  cacheVersion: string;
}

/**
 * キャッシュ設定
 */
export interface CacheConfig {
  maxCacheSize: number; // MB
  maxRetryAttempts: number;
  syncInterval: number; // milliseconds
  enableAutoSync: boolean;
}

/**
 * オフラインストレージサービス
 */
export class OfflineStorageService {
  private config: CacheConfig = {
    maxCacheSize: 50, // 50MB
    maxRetryAttempts: 3,
    syncInterval: 30000, // 30秒
    enableAutoSync: true
  };
  private syncTimer: number | null = null;
  private listeners: ((state: OfflineCacheState) => void)[] = [];

  constructor() {
    this.initializeCache();
    this.setupAutoSync();
    this.setupNetworkListeners();
  }

  /**
   * キャッシュを初期化
   */
  private initializeCache(): void {
    const cachedVersion = localStorage.getItem(STORAGE_KEYS.CACHE_VERSION);
    
    if (cachedVersion !== CACHE_VERSION) {
      // バージョンが異なる場合はキャッシュをクリア
      this.clearCache();
      localStorage.setItem(STORAGE_KEYS.CACHE_VERSION, CACHE_VERSION);
    }
  }

  /**
   * 設定を更新
   */
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enableAutoSync !== undefined) {
      if (config.enableAutoSync) {
        this.setupAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * オフライン状態を取得
   */
  getCacheState(): OfflineCacheState {
    const pendingChanges = this.getPendingChanges();
    const lastSyncTime = this.getLastSyncTime();
    const cacheSize = this.calculateCacheSize();

    return {
      isOffline: !navigator.onLine,
      lastSyncTime,
      pendingChanges: pendingChanges.length,
      cacheSize,
      cacheVersion: CACHE_VERSION
    };
  }

  /**
   * キャッシュ状態の変更を監視
   */
  onCacheStateChange(callback: (state: OfflineCacheState) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 利用者データをキャッシュに保存
   */
  cacheUsers(users: User[]): void {
    try {
      const data = JSON.stringify(users);
      localStorage.setItem(STORAGE_KEYS.USERS, data);
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to cache users:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * キャッシュから利用者データを取得
   */
  getCachedUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached users:', error);
      return [];
    }
  }

  /**
   * 職員データをキャッシュに保存
   */
  cacheStaff(staff: Staff[]): void {
    try {
      const data = JSON.stringify(staff);
      localStorage.setItem(STORAGE_KEYS.STAFF, data);
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to cache staff:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * キャッシュから職員データを取得
   */
  getCachedStaff(): Staff[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get cached staff:', error);
      return [];
    }
  }

  /**
   * 保留中の変更を追加
   */
  addPendingChange(change: Omit<PendingChange, 'id' | 'timestamp' | 'retryCount'>): void {
    const pendingChange: PendingChange = {
      id: Math.random().toString(36),
      timestamp: new Date(),
      retryCount: 0,
      ...change
    };

    const pendingChanges = this.getPendingChanges();
    pendingChanges.push(pendingChange);
    this.savePendingChanges(pendingChanges);
    this.notifyStateChange();
  }

  /**
   * 保留中の変更を取得
   */
  getPendingChanges(): PendingChange[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get pending changes:', error);
      return [];
    }
  }

  /**
   * 保留中の変更を保存
   */
  private savePendingChanges(changes: PendingChange[]): void {
    try {
      const data = JSON.stringify(changes);
      localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, data);
    } catch (error) {
      console.error('Failed to save pending changes:', error);
      this.handleStorageError(error);
    }
  }

  /**
   * オンライン復帰時の同期処理
   */
  async syncPendingChanges(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Still offline, skipping sync');
      return;
    }

    const pendingChanges = this.getPendingChanges();
    if (pendingChanges.length === 0) {
      return;
    }

    console.log(`Syncing ${pendingChanges.length} pending changes`);
    const successfulChanges: string[] = [];

    for (const change of pendingChanges) {
      try {
        await this.processPendingChange(change);
        successfulChanges.push(change.id);
      } catch (error) {
        console.error(`Failed to sync change ${change.id}:`, error);
        
        // リトライ回数を増やす
        change.retryCount++;
        
        // 最大リトライ回数に達した場合は削除
        if (change.retryCount >= this.config.maxRetryAttempts) {
          console.warn(`Removing change ${change.id} after ${change.retryCount} failed attempts`);
          successfulChanges.push(change.id);
        }
      }
    }

    // 成功した変更を削除
    if (successfulChanges.length > 0) {
      const remainingChanges = pendingChanges.filter(
        change => !successfulChanges.includes(change.id)
      );
      this.savePendingChanges(remainingChanges);
      this.notifyStateChange();
    }

    // 最後の同期時刻を更新
    this.updateLastSyncTime();
  }

  /**
   * 個別の保留中変更を処理
   */
  private async processPendingChange(change: PendingChange): Promise<void> {
    switch (change.collection) {
      case 'users':
        await this.processUserChange(change);
        break;
      case 'staff':
        await this.processStaffChange(change);
        break;
      default:
        throw new Error(`Unknown collection: ${change.collection}`);
    }
  }

  /**
   * 利用者の変更を処理
   */
  private async processUserChange(change: PendingChange): Promise<void> {
    switch (change.type) {
      case 'create':
        await userDataService.createUser(change.data);
        break;
      case 'update':
        if (change.entityId) {
          await userDataService.updateUser(change.entityId, change.data);
        }
        break;
      case 'delete':
        if (change.entityId) {
          await userDataService.deleteUser(change.entityId);
        }
        break;
    }
  }

  /**
   * 職員の変更を処理
   */
  private async processStaffChange(change: PendingChange): Promise<void> {
    switch (change.type) {
      case 'create':
        await staffDataService.createStaff(change.data);
        break;
      case 'update':
        if (change.entityId) {
          await staffDataService.updateStaff(change.entityId, change.data);
        }
        break;
      case 'delete':
        if (change.entityId) {
          await staffDataService.deleteStaff(change.entityId);
        }
        break;
    }
  }

  /**
   * データを最新の状態に更新
   */
  async refreshCache(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Offline, using cached data');
      return;
    }

    try {
      // 利用者データを更新
      const users = await userDataService.listUsers();
      this.cacheUsers(users);

      // 職員データを更新
      const staff = await staffDataService.listStaff();
      this.cacheStaff(staff);

      this.updateLastSyncTime();
      console.log('Cache refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh cache:', error);
    }
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.notifyStateChange();
  }

  /**
   * 最後の同期時刻を取得
   */
  private getLastSyncTime(): Date | null {
    const timestamp = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  }

  /**
   * 最後の同期時刻を更新
   */
  private updateLastSyncTime(): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    this.notifyStateChange();
  }

  /**
   * キャッシュサイズを計算（MB）
   */
  private calculateCacheSize(): number {
    let totalSize = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        totalSize += new Blob([data]).size;
      }
    });

    return Math.round((totalSize / (1024 * 1024)) * 100) / 100; // MB with 2 decimal places
  }

  /**
   * ストレージエラーを処理
   */
  private handleStorageError(error: any): void {
    if (error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, clearing old cache');
      this.clearCache();
    }
  }

  /**
   * 自動同期を設定
   */
  private setupAutoSync(): void {
    if (this.config.enableAutoSync && !this.syncTimer) {
      this.syncTimer = window.setInterval(() => {
        if (navigator.onLine) {
          this.syncPendingChanges();
        }
      }, this.config.syncInterval);
    }
  }

  /**
   * 自動同期を停止
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * ネットワーク状態の監視を設定
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network online, syncing pending changes');
      this.syncPendingChanges();
      this.refreshCache();
      this.notifyStateChange();
    });

    window.addEventListener('offline', () => {
      console.log('Network offline, switching to cached data');
      this.notifyStateChange();
    });
  }

  /**
   * 状態変更を通知
   */
  private notifyStateChange(): void {
    const state = this.getCacheState();
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Cache state listener error:', error);
      }
    });
  }

  /**
   * リソースのクリーンアップ
   */
  destroy(): void {
    this.stopAutoSync();
    this.listeners = [];
    window.removeEventListener('online', () => {});
    window.removeEventListener('offline', () => {});
  }
}

/**
 * オフライン対応のデータアクセスレイヤー
 */
export class OfflineDataService {
  private offlineStorage: OfflineStorageService;

  constructor(offlineStorage: OfflineStorageService) {
    this.offlineStorage = offlineStorage;
  }

  /**
   * 利用者一覧を取得（オフライン対応）
   */
  async getUsers(): Promise<User[]> {
    if (navigator.onLine) {
      try {
        const users = await userDataService.listUsers();
        this.offlineStorage.cacheUsers(users);
        return users;
      } catch (error) {
        console.warn('Failed to fetch users online, using cache:', error);
        return this.offlineStorage.getCachedUsers();
      }
    } else {
      return this.offlineStorage.getCachedUsers();
    }
  }

  /**
   * 職員一覧を取得（オフライン対応）
   */
  async getStaff(): Promise<Staff[]> {
    if (navigator.onLine) {
      try {
        const staff = await staffDataService.listStaff();
        this.offlineStorage.cacheStaff(staff);
        return staff;
      } catch (error) {
        console.warn('Failed to fetch staff online, using cache:', error);
        return this.offlineStorage.getCachedStaff();
      }
    } else {
      return this.offlineStorage.getCachedStaff();
    }
  }

  /**
   * 利用者を作成（オフライン対応）
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (navigator.onLine) {
      try {
        return await userDataService.createUser(userData);
      } catch (error) {
        // オフライン時は保留中の変更として保存
        this.offlineStorage.addPendingChange({
          type: 'create',
          collection: 'users',
          data: userData
        });
        throw error;
      }
    } else {
      // オフライン時は保留中の変更として保存
      this.offlineStorage.addPendingChange({
        type: 'create',
        collection: 'users',
        data: userData
      });
      
      // 一時的なIDを返す
      return `temp_${Date.now()}`;
    }
  }

  /**
   * 利用者を更新（オフライン対応）
   */
  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    if (navigator.onLine) {
      try {
        await userDataService.updateUser(id, userData);
      } catch (error) {
        // オフライン時は保留中の変更として保存
        this.offlineStorage.addPendingChange({
          type: 'update',
          collection: 'users',
          entityId: id,
          data: userData
        });
        throw error;
      }
    } else {
      // オフライン時は保留中の変更として保存
      this.offlineStorage.addPendingChange({
        type: 'update',
        collection: 'users',
        entityId: id,
        data: userData
      });
    }
  }

  /**
   * 職員を作成（オフライン対応）
   */
  async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (navigator.onLine) {
      try {
        return await staffDataService.createStaff(staffData);
      } catch (error) {
        this.offlineStorage.addPendingChange({
          type: 'create',
          collection: 'staff',
          data: staffData
        });
        throw error;
      }
    } else {
      this.offlineStorage.addPendingChange({
        type: 'create',
        collection: 'staff',
        data: staffData
      });
      
      return `temp_${Date.now()}`;
    }
  }

  /**
   * 職員を更新（オフライン対応）
   */
  async updateStaff(id: string, staffData: Partial<Staff>): Promise<void> {
    if (navigator.onLine) {
      try {
        await staffDataService.updateStaff(id, staffData);
      } catch (error) {
        this.offlineStorage.addPendingChange({
          type: 'update',
          collection: 'staff',
          entityId: id,
          data: staffData
        });
        throw error;
      }
    } else {
      this.offlineStorage.addPendingChange({
        type: 'update',
        collection: 'staff',
        entityId: id,
        data: staffData
      });
    }
  }
}

// シングルトンインスタンス
export const offlineStorageService = new OfflineStorageService();
export const offlineDataService = new OfflineDataService(offlineStorageService);