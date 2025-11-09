/**
 * Firestore データベースサービス
 * CRUD操作とデータ同期機能を提供
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
  type DocumentSnapshot,
  type QuerySnapshot,
  type WhereFilterOp
} from 'firebase/firestore';
import { firestore } from '../firebase.js';
import type { User } from '../types/user.js';
import type { Staff } from '../types/staff.js';

/**
 * データベース操作の基本インターフェース
 */
export interface DatabaseService {
  // CRUD操作
  create<T>(collection: string, data: Partial<T>): Promise<string>;
  read<T>(collection: string, id: string): Promise<T | null>;
  update<T>(collection: string, id: string, data: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  
  // クエリ操作
  list<T>(collection: string, options?: QueryOptions): Promise<T[]>;
  search<T>(collection: string, filters: SearchFilter[]): Promise<T[]>;
  
  // リアルタイム同期
  subscribe<T>(collection: string, callback: (data: T[]) => void, options?: QueryOptions): Unsubscribe;
  subscribeToDocument<T>(collection: string, id: string, callback: (data: T | null) => void): Unsubscribe;
  
  // バッチ操作
  batchWrite(operations: BatchOperation[]): Promise<void>;
}

/**
 * クエリオプション
 */
export interface QueryOptions {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  startAfter?: any;
  where?: SearchFilter[];
}

/**
 * 検索フィルター
 */
export interface SearchFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

/**
 * バッチ操作
 */
export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}

/**
 * データベースエラー
 */
export interface DatabaseError {
  code: string;
  message: string;
  type: 'network' | 'permission' | 'validation' | 'not-found';
}

/**
 * Firestore データベースサービス実装
 */
export class FirestoreService implements DatabaseService {
  /**
   * ドキュメントを作成
   */
  async create<T>(collectionName: string, data: Partial<T>): Promise<string> {
    try {
      const collectionRef = collection(firestore, collectionName);
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collectionRef, docData);
      return docRef.id;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * ドキュメントを読み取り
   */
  async read<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(firestore, collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      }
      
      return null;
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * ドキュメントを更新
   */
  async update<T>(collectionName: string, id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(firestore, collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * ドキュメントを削除
   */
  async delete(collectionName: string, id: string): Promise<void> {
    try {
      const docRef = doc(firestore, collectionName, id);
      await deleteDoc(docRef);
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * コレクションの一覧を取得
   */
  async list<T>(collectionName: string, options: QueryOptions = {}): Promise<T[]> {
    try {
      const collectionRef = collection(firestore, collectionName);
      const constraints: QueryConstraint[] = [];
      
      // フィルター条件を追加
      if (options.where) {
        options.where.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }
      
      // ソート条件を追加
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }
      
      // 件数制限を追加
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      // ページネーション
      if (options.startAfter) {
        constraints.push(startAfter(options.startAfter));
      }
      
      const q = query(collectionRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * 検索クエリを実行
   */
  async search<T>(collectionName: string, filters: SearchFilter[]): Promise<T[]> {
    return this.list<T>(collectionName, { where: filters });
  }

  /**
   * コレクションの変更を監視
   */
  subscribe<T>(
    collectionName: string, 
    callback: (data: T[]) => void, 
    options: QueryOptions = {}
  ): Unsubscribe {
    try {
      const collectionRef = collection(firestore, collectionName);
      const constraints: QueryConstraint[] = [];
      
      // クエリ条件を構築
      if (options.where) {
        options.where.forEach(filter => {
          constraints.push(where(filter.field, filter.operator, filter.value));
        });
      }
      
      if (options.orderBy) {
        constraints.push(orderBy(options.orderBy.field, options.orderBy.direction));
      }
      
      if (options.limit) {
        constraints.push(limit(options.limit));
      }
      
      const q = query(collectionRef, ...constraints);
      
      return onSnapshot(q, (querySnapshot: QuerySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        
        callback(data);
      }, (error) => {
        console.error('Subscription error:', error);
        callback([]);
      });
    } catch (error: any) {
      console.error('Subscribe error:', error);
      return () => {}; // 空の unsubscribe 関数を返す
    }
  }

  /**
   * 単一ドキュメントの変更を監視
   */
  subscribeToDocument<T>(
    collectionName: string, 
    id: string, 
    callback: (data: T | null) => void
  ): Unsubscribe {
    try {
      const docRef = doc(firestore, collectionName, id);
      
      return onSnapshot(docRef, (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = {
            id: docSnap.id,
            ...docSnap.data()
          } as T;
          callback(data);
        } else {
          callback(null);
        }
      }, (error) => {
        console.error('Document subscription error:', error);
        callback(null);
      });
    } catch (error: any) {
      console.error('Subscribe to document error:', error);
      return () => {}; // 空の unsubscribe 関数を返す
    }
  }

  /**
   * バッチ書き込み操作
   */
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      const batch = writeBatch(firestore);
      
      for (const operation of operations) {
        const docRef = operation.id 
          ? doc(firestore, operation.collection, operation.id)
          : doc(collection(firestore, operation.collection));
        
        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...operation.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...operation.data,
              updatedAt: serverTimestamp()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }
      
      await batch.commit();
    } catch (error: any) {
      throw this.mapError(error);
    }
  }

  /**
   * エラーをマップ
   */
  private mapError(error: any): DatabaseError {
    const code = error.code || 'unknown';
    let message = error.message || '不明なエラーが発生しました';
    let type: DatabaseError['type'] = 'network';

    switch (code) {
      case 'permission-denied':
        message = 'アクセス権限がありません';
        type = 'permission';
        break;
      case 'not-found':
        message = 'データが見つかりません';
        type = 'not-found';
        break;
      case 'invalid-argument':
        message = '無効な引数です';
        type = 'validation';
        break;
      case 'unavailable':
        message = 'サービスが利用できません';
        type = 'network';
        break;
      case 'deadline-exceeded':
        message = 'リクエストがタイムアウトしました';
        type = 'network';
        break;
    }

    return {
      code,
      message,
      type
    };
  }
}

/**
 * 利用者データ専用サービス
 */
export class UserDataService {
  private db: FirestoreService;
  private readonly COLLECTION_NAME = 'users';

  constructor(databaseService: FirestoreService) {
    this.db = databaseService;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.db.create<User>(this.COLLECTION_NAME, userData);
  }

  async getUser(id: string): Promise<User | null> {
    return this.db.read<User>(this.COLLECTION_NAME, id);
  }

  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    return this.db.update<User>(this.COLLECTION_NAME, id, userData);
  }

  async deleteUser(id: string): Promise<void> {
    return this.db.delete(this.COLLECTION_NAME, id);
  }

  async listUsers(options?: QueryOptions): Promise<User[]> {
    return this.db.list<User>(this.COLLECTION_NAME, options);
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    const filters: SearchFilter[] = [
      { field: 'name', operator: '>=', value: searchTerm },
      { field: 'name', operator: '<=', value: searchTerm + '\uf8ff' }
    ];
    return this.db.search<User>(this.COLLECTION_NAME, filters);
  }

  subscribeToUsers(callback: (users: User[]) => void, options?: QueryOptions): Unsubscribe {
    return this.db.subscribe<User>(this.COLLECTION_NAME, callback, options);
  }

  subscribeToUser(id: string, callback: (user: User | null) => void): Unsubscribe {
    return this.db.subscribeToDocument<User>(this.COLLECTION_NAME, id, callback);
  }
}

/**
 * 職員データ専用サービス
 */
export class StaffDataService {
  private db: FirestoreService;
  private readonly COLLECTION_NAME = 'staff';

  constructor(databaseService: FirestoreService) {
    this.db = databaseService;
  }

  async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.db.create<Staff>(this.COLLECTION_NAME, staffData);
  }

  async getStaff(id: string): Promise<Staff | null> {
    return this.db.read<Staff>(this.COLLECTION_NAME, id);
  }

  async updateStaff(id: string, staffData: Partial<Staff>): Promise<void> {
    return this.db.update<Staff>(this.COLLECTION_NAME, id, staffData);
  }

  async deleteStaff(id: string): Promise<void> {
    return this.db.delete(this.COLLECTION_NAME, id);
  }

  async listStaff(options?: QueryOptions): Promise<Staff[]> {
    return this.db.list<Staff>(this.COLLECTION_NAME, options);
  }

  async getActiveStaff(): Promise<Staff[]> {
    const filters: SearchFilter[] = [
      { field: 'isActive', operator: '==', value: true }
    ];
    return this.db.search<Staff>(this.COLLECTION_NAME, filters);
  }

  subscribeToStaff(callback: (staff: Staff[]) => void, options?: QueryOptions): Unsubscribe {
    return this.db.subscribe<Staff>(this.COLLECTION_NAME, callback, options);
  }

  subscribeToStaffMember(id: string, callback: (staff: Staff | null) => void): Unsubscribe {
    return this.db.subscribeToDocument<Staff>(this.COLLECTION_NAME, id, callback);
  }
}

// シングルトンインスタンス
export const firestoreService = new FirestoreService();
export const userDataService = new UserDataService(firestoreService);
export const staffDataService = new StaffDataService(firestoreService);