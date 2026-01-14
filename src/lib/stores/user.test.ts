/**
 * UserStore のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserStore } from './user.svelte';
import type { User } from '$lib/types/user';

// localStorage のモック（お気に入り永続化の影響を排除）
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('UserStore', () => {
  let userStore: UserStore;
  
  const mockUser: User = {
    id: '1',
    name: '田中太郎',
    nameKana: 'タナカタロウ',
    birthDate: new Date('1940-05-15'),
    gender: 'male',
    address: {
      postalCode: '123-4567',
      prefecture: '東京都',
      city: '新宿区',
      street: '西新宿1-1-1'
    },
    emergencyContact: {
      name: '田中花子',
      relationship: '娘',
      phone: '090-1234-5678',
      email: 'hanako@example.com'
    },
    medicalInfo: {
      allergies: ['ペニシリン'],
      medications: [],
      conditions: ['高血圧', '糖尿病'],
      restrictions: ['塩分制限']
    },
    careLevel: 3,
    familyMembers: [],
    notes: [],
    admissionDate: new Date('2023-01-15'),
    isActive: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  };
  
  beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
    userStore = new UserStore();
  });
  
  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      expect(userStore.users).toEqual([]);
      expect(userStore.selectedUser).toBeNull();
      expect(userStore.isLoading).toBe(false);
      expect(userStore.error).toBeNull();
      expect(userStore.searchTerm).toBe('');
      expect(userStore.currentPage).toBe(1);
      expect(userStore.itemsPerPage).toBe(20);
      expect(userStore.favoriteUserIds).toEqual([]);
    });
  });
  
  describe('CRUD操作', () => {
    it('利用者を作成できる', async () => {
      const userData = { ...mockUser };
      delete (userData as any).id;
      delete (userData as any).createdAt;
      delete (userData as any).updatedAt;
      
      const createdUser = await userStore.createUser(userData);
      
      expect(createdUser.id).toBeDefined();
      expect(createdUser.name).toBe(mockUser.name);
      expect(userStore.users).toHaveLength(1);
      expect(userStore.users[0]).toEqual(createdUser);
    });
    
    it('利用者を更新できる', async () => {
      userStore.users = [mockUser];
      
      const updates = { name: '田中次郎', careLevel: 4 };
      const updatedUser = await userStore.updateUser('1', updates);
      
      expect(updatedUser.name).toBe('田中次郎');
      expect(updatedUser.careLevel).toBe(4);
      expect(userStore.users[0]).toEqual(updatedUser);
    });
    
    it('存在しない利用者の更新でエラーが発生する', async () => {
      await expect(userStore.updateUser('999', { name: 'テスト' }))
        .rejects.toThrow('利用者が見つかりません');
    });
    
    it('利用者を削除（論理削除）できる', async () => {
      userStore.users = [mockUser];
      
      await userStore.deleteUser('1');
      
      expect(userStore.users[0].isActive).toBe(false);
    });
  });
  
  describe('検索・フィルタリング', () => {
    beforeEach(() => {
      const users: User[] = [
        { ...mockUser, id: '1', name: '田中太郎', careLevel: 3, gender: 'male' },
        { ...mockUser, id: '2', name: '佐藤花子', careLevel: 2, gender: 'female' },
        { ...mockUser, id: '3', name: '鈴木一郎', careLevel: 4, gender: 'male', isActive: false }
      ];
      userStore.users = users;
    });
    
    it('名前で検索できる', () => {
      userStore.setSearchTerm('田中');
      expect(userStore.filteredUsers).toHaveLength(1);
      expect(userStore.filteredUsers[0].name).toBe('田中太郎');
    });
    
    it('要介護度でフィルタできる', () => {
      userStore.setFilter({ careLevel: [2, 3] });
      expect(userStore.filteredUsers).toHaveLength(2);
    });
    
    it('性別でフィルタできる', () => {
      userStore.setFilter({ gender: ['female'] });
      expect(userStore.filteredUsers).toHaveLength(1);
      expect(userStore.filteredUsers[0].name).toBe('佐藤花子');
    });
    
    it('アクティブ状態でフィルタできる', () => {
      userStore.setFilter({ status: ['active'] });
      expect(userStore.filteredUsers).toHaveLength(2);
    });
    
    it('フィルタをクリアできる', () => {
      userStore.setFilter({ gender: ['female'] });
      userStore.setSearchTerm('田中');
      
      userStore.clearFilter();
      
      expect(userStore.filter).toEqual({});
      expect(userStore.searchTerm).toBe('');
      expect(userStore.filteredUsers).toHaveLength(3);
    });
  });
  
  describe('ソート', () => {
    beforeEach(() => {
      const users: User[] = [
        { ...mockUser, id: '1', name: '田中太郎' },
        { ...mockUser, id: '2', name: '佐藤花子' },
        { ...mockUser, id: '3', name: '鈴木一郎' }
      ];
      userStore.users = users;
    });
    
    it('名前で昇順ソートできる', () => {
      userStore.setSortOption({ field: 'name', direction: 'asc' });
      const sorted = userStore.sortedUsers;
      // 日本語の文字コード順でソート: さ < す < た
      expect(sorted[0].name).toBe('佐藤花子');
      expect(sorted[1].name).toBe('田中太郎');
      expect(sorted[2].name).toBe('鈴木一郎');
    });
    
    it('名前で降順ソートできる', () => {
      userStore.setSortOption({ field: 'name', direction: 'desc' });
      const sorted = userStore.sortedUsers;
      // 日本語の文字コード順でソート（降順）: た > す > さ
      expect(sorted[0].name).toBe('鈴木一郎');
      expect(sorted[1].name).toBe('田中太郎');
      expect(sorted[2].name).toBe('佐藤花子');
    });
  });
  
  describe('ページネーション', () => {
    beforeEach(() => {
      const users: User[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockUser,
        id: (i + 1).toString(),
        name: `利用者${i + 1}`
      }));
      userStore.users = users;
      userStore.setItemsPerPage(10);
    });
    
    it('ページネーションが正しく動作する', () => {
      expect(userStore.totalPages).toBe(3);
      expect(userStore.paginatedUsers).toHaveLength(10);
      
      userStore.setPage(2);
      expect(userStore.currentPage).toBe(2);
      expect(userStore.paginatedUsers).toHaveLength(10);
      
      userStore.setPage(3);
      expect(userStore.currentPage).toBe(3);
      expect(userStore.paginatedUsers).toHaveLength(5);
    });
    
    it('無効なページ番号は設定されない', () => {
      userStore.setPage(0);
      expect(userStore.currentPage).toBe(1);
      
      userStore.setPage(10);
      expect(userStore.currentPage).toBe(1);
    });
  });
  
  describe('統計情報', () => {
    beforeEach(() => {
      const users: User[] = [
        { ...mockUser, id: '1', gender: 'male', careLevel: 3, isActive: true },
        { ...mockUser, id: '2', gender: 'female', careLevel: 2, isActive: true },
        { ...mockUser, id: '3', gender: 'male', careLevel: 4, isActive: false }
      ];
      userStore.users = users;
    });
    
    it('統計情報が正しく計算される', () => {
      const stats = userStore.statistics;
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byGender.male).toBe(2);
      expect(stats.byGender.female).toBe(1);
      expect(stats.byCareLevel[2]).toBe(1);
      expect(stats.byCareLevel[3]).toBe(1);
      expect(stats.byCareLevel[4]).toBe(1);
    });
  });
  
  describe('利用者選択', () => {
    it('利用者を選択できる', () => {
      userStore.selectUser(mockUser);
      expect(userStore.selectedUser).toEqual(mockUser);
    });
    
    it('利用者選択をクリアできる', () => {
      userStore.selectUser(mockUser);
      userStore.selectUser(null);
      expect(userStore.selectedUser).toBeNull();
    });
  });
  
  describe('エラーハンドリング', () => {
    it('エラーをクリアできる', () => {
      userStore.error = 'テストエラー';
      userStore.clearError();
      expect(userStore.error).toBeNull();
    });
  });
});