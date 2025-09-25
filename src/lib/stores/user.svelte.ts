/**
 * 利用者状態管理ストア
 * Svelte 5 Rune を使用した利用者データの管理
 */

import type { User, UserFilter, UserSortOption } from '$lib/types/user';

export class UserStore {
  // 基本状態
  users = $state<User[]>([]);
  selectedUser = $state<User | null>(null);
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  // フィルタリング・検索状態
  filter = $state<UserFilter>({});
  sortOption = $state<UserSortOption>({ field: 'name', direction: 'asc' });
  searchTerm = $state('');
  
  // ページネーション状態
  currentPage = $state(1);
  itemsPerPage = $state(20);
  
  // 派生状態 - フィルタリングされた利用者リスト
  filteredUsers = $derived.by(() => {
    let result = this.users.slice();
    
    // 検索フィルタ
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(term) ||
        user.nameKana.toLowerCase().includes(term) ||
        user.id.toLowerCase().includes(term)
      );
    }
    
    // 要介護度フィルタ
    if (this.filter.careLevel && this.filter.careLevel.length > 0) {
      result = result.filter(user => this.filter.careLevel!.includes(user.careLevel));
    }
    
    // 性別フィルタ
    if (this.filter.gender && this.filter.gender.length > 0) {
      result = result.filter(user => this.filter.gender!.includes(user.gender));
    }
    
    // 年齢範囲フィルタ
    if (this.filter.ageRange) {
      const now = new Date();
      result = result.filter(user => {
        const age = now.getFullYear() - user.birthDate.getFullYear();
        const { min, max } = this.filter.ageRange!;
        return age >= min && age <= max;
      });
    }
    
    // アクティブ状態フィルタ
    if (this.filter.status && this.filter.status.length > 0) {
      result = result.filter(user => {
        const status = user.isActive ? 'active' : 'inactive';
        return this.filter.status!.includes(status);
      });
    }
    
    return result;
  });
  
  // 派生状態 - ソートされた利用者リスト
  sortedUsers = $derived.by(() => {
    const users = this.filteredUsers.slice();
    const { field, direction } = this.sortOption;
    
    return users.sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // 日付の場合は数値に変換
      if (aValue instanceof Date) {
        aValue = aValue.getTime();
        bValue = (bValue as Date).getTime();
      }
      
      // 文字列の場合は小文字で比較
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (!aValue || !bValue) return 0;
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });
  
  // 派生状態 - ページネーションされた利用者リスト
  paginatedUsers = $derived.by(() => {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.sortedUsers.slice(startIndex, endIndex);
  });
  
  // 派生状態 - 総ページ数
  totalPages = $derived(Math.ceil(this.sortedUsers.length / this.itemsPerPage));
  
  // 派生状態 - 統計情報
  statistics = $derived.by(() => {
    const total = this.users.length;
    const active = this.users.filter(u => u.isActive).length;
    const byGender = this.users.reduce((acc, user) => {
      acc[user.gender] = (acc[user.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const byCareLevel = this.users.reduce((acc, user) => {
      acc[user.careLevel] = (acc[user.careLevel] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return {
      total,
      active,
      inactive: total - active,
      byGender,
      byCareLevel
    };
  });
  
  // CRUD操作
  
  /**
   * 全利用者データを読み込み
   */
  async loadUsers(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      // const response = await fetch('/api/users');
      // const users = await response.json();
      
      // 仮のデータ（開発用）
      const mockUsers: User[] = [
        {
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
        }
      ];
      
      this.users = mockUsers;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '利用者データの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 利用者を作成
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    this.isLoading = true;
    this.error = null;
    
    try {
      // TODO: 実際のAPI呼び出しに置き換え
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      this.users.push(newUser);
      return newUser;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '利用者の作成に失敗しました';
      throw err;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 利用者を更新
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    this.isLoading = true;
    this.error = null;
    
    try {
      const userIndex = this.users.findIndex(u => u.id === id);
      if (userIndex === -1) {
        throw new Error('利用者が見つかりません');
      }
      
      const updatedUser: User = {
        ...this.users[userIndex],
        ...updates,
        updatedAt: new Date()
      };
      
      this.users[userIndex] = updatedUser;
      
      // 選択中の利用者も更新
      if (this.selectedUser?.id === id) {
        this.selectedUser = updatedUser;
      }
      
      return updatedUser;
    } catch (err) {
      this.error = err instanceof Error ? err.message : '利用者の更新に失敗しました';
      throw err;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 利用者を削除（論理削除）
   */
  async deleteUser(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    
    try {
      await this.updateUser(id, { isActive: false });
    } catch (err) {
      this.error = err instanceof Error ? err.message : '利用者の削除に失敗しました';
      throw err;
    } finally {
      this.isLoading = false;
    }
  }
  
  /**
   * 利用者を選択
   */
  selectUser(user: User | null): void {
    this.selectedUser = user;
  }
  
  /**
   * 検索条件を設定
   */
  setSearchTerm(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1; // 検索時はページをリセット
  }
  
  /**
   * フィルタを設定
   */
  setFilter(filter: Partial<UserFilter>): void {
    this.filter = { ...this.filter, ...filter };
    this.currentPage = 1; // フィルタ変更時はページをリセット
  }
  
  /**
   * フィルタをクリア
   */
  clearFilter(): void {
    this.filter = {};
    this.searchTerm = '';
    this.currentPage = 1;
  }
  
  /**
   * ソート条件を設定
   */
  setSortOption(sortOption: UserSortOption): void {
    this.sortOption = sortOption;
  }
  
  /**
   * ページを変更
   */
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  /**
   * ページサイズを変更
   */
  setItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1; // ページサイズ変更時はページをリセット
  }
  
  /**
   * エラーをクリア
   */
  clearError(): void {
    this.error = null;
  }
}

// シングルトンインスタンス
export const userStore = new UserStore();