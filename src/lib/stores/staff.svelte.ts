/**
 * 職員状態管理ストア
 * Svelte 5 Rune を使用した職員データの管理
 */

import type { Staff, StaffFilter, StaffSortOption, StaffRole, WorkSchedule } from '$lib/types/staff';

const FAVORITE_STAFF_STORAGE_KEY = 'favorite-staff';

function loadStringArrayFromStorage(key: string, defaultValue: string[] = []): string[] {
    if (typeof window === 'undefined') return defaultValue;

    try {
        const stored = localStorage.getItem(key);
        if (!stored) return defaultValue;
        const parsed = JSON.parse(stored);
        if (!Array.isArray(parsed)) return defaultValue;
        return parsed.filter((v): v is string => typeof v === 'string');
    } catch (error) {
        console.warn(`Failed to load ${key} from localStorage:`, error);
        return defaultValue;
    }
}

function saveStringArrayToStorage(key: string, value: string[]): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Failed to save ${key} to localStorage:`, error);
    }
}

export class StaffStore {
    // 基本状態
    staff = $state<Staff[]>([]);
    selectedStaff = $state<Staff | null>(null);
    isLoading = $state(false);
    error = $state<string | null>(null);

    // お気に入り（ピン留め）
    favoriteStaffIds = $state<string[]>(loadStringArrayFromStorage(FAVORITE_STAFF_STORAGE_KEY, []));

    // フィルタリング・検索状態
    filter = $state<StaffFilter>({});
    sortOption = $state<StaffSortOption>({ field: 'name', direction: 'asc' });
    searchTerm = $state('');

    // ページネーション状態
    currentPage = $state(1);
    itemsPerPage = $state(20);

    // スケジュール関連状態
    selectedDate = $state(new Date());
    scheduleView = $state<'day' | 'week' | 'month'>('week');

    // 派生状態 - フィルタリングされた職員リスト
    filteredStaff = $derived.by(() => {
        let result = this.staff.slice();

        // 検索フィルタ
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            result = result.filter(staff =>
                staff.name.toLowerCase().includes(term) ||
                staff.nameKana.toLowerCase().includes(term) ||
                staff.email.toLowerCase().includes(term) ||
                staff.department.toLowerCase().includes(term)
            );
        }

        // 役職フィルタ
        if (this.filter.role && this.filter.role.length > 0) {
            result = result.filter(staff => this.filter.role!.includes(staff.role));
        }

        // 部署フィルタ
        if (this.filter.department && this.filter.department.length > 0) {
            result = result.filter(staff => this.filter.department!.includes(staff.department));
        }

        // アクティブ状態フィルタ
        if (this.filter.isActive !== undefined) {
            result = result.filter(staff => staff.isActive === this.filter.isActive);
        }

        return result;
    });

    // 派生状態 - ソートされた職員リスト
    sortedStaff = $derived.by(() => {
        const staff = this.filteredStaff.slice();
        const { field, direction } = this.sortOption;

        return staff.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            if (aValue instanceof Date) {
                aValue = new Date(aValue.getTime());
                bValue = new Date((bValue as Date).getTime());
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

    // 派生状態 - お気に入り職員（現在の検索/フィルタ/ソート結果に対して適用）
    favoriteStaff = $derived.by(() => {
        if (this.favoriteStaffIds.length === 0) return [];
        const byId = new Map(this.sortedStaff.map((s) => [s.id, s] as const));
        return this.favoriteStaffIds.map((id) => byId.get(id)).filter((s): s is Staff => !!s);
    });

    // 派生状態 - お気に入り以外の職員
    nonFavoriteStaff = $derived.by(() => {
        if (this.favoriteStaffIds.length === 0) return this.sortedStaff;
        const favoriteSet = new Set(this.favoriteStaffIds);
        return this.sortedStaff.filter((s) => !favoriteSet.has(s.id));
    });

    // 派生状態 - お気に入り以外をページネーション
    paginatedNonFavoriteStaff = $derived.by(() => {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.nonFavoriteStaff.slice(startIndex, endIndex);
    });

    // 派生状態 - お気に入り以外の総ページ数
    nonFavoriteTotalPages = $derived(Math.max(1, Math.ceil(this.nonFavoriteStaff.length / this.itemsPerPage)));

    // 派生状態 - ページネーションされた職員リスト
    paginatedStaff = $derived.by(() => {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.sortedStaff.slice(startIndex, endIndex);
    });

    // 派生状態 - 総ページ数
    totalPages = $derived(Math.ceil(this.sortedStaff.length / this.itemsPerPage));

    // 派生状態 - 統計情報
    statistics = $derived.by(() => {
        const total = this.staff.length;
        const active = this.staff.filter(s => s.isActive).length;
        const byRole = this.staff.reduce((acc, staff) => {
            acc[staff.role] = (acc[staff.role] || 0) + 1;
            return acc;
        }, {} as Record<StaffRole, number>);
        const byDepartment = this.staff.reduce((acc, staff) => {
            acc[staff.department] = (acc[staff.department] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            active,
            inactive: total - active,
            byRole,
            byDepartment
        };
    });

    // 派生状態 - 選択日のスケジュール
    dailySchedule = $derived.by(() => {
        if (!this.selectedDate) return [];

        const targetDate = new Date(this.selectedDate);
        targetDate.setHours(0, 0, 0, 0);

        return this.staff.flatMap(staff =>
            staff.schedule
                .filter(schedule => {
                    const scheduleDate = new Date(schedule.date);
                    scheduleDate.setHours(0, 0, 0, 0);
                    return scheduleDate.getTime() === targetDate.getTime();
                })
                .map(schedule => ({
                    ...schedule,
                    staffId: staff.id,
                    staffName: staff.name,
                    staffRole: staff.role
                }))
        );
    });

    // 派生状態 - 週間スケジュール
    weeklySchedule = $derived.by(() => {
        if (!this.selectedDate) return [];

        const startOfWeek = new Date(this.selectedDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return this.staff.flatMap(staff =>
            staff.schedule
                .filter(schedule => {
                    const scheduleDate = new Date(schedule.date);
                    return scheduleDate >= startOfWeek && scheduleDate <= endOfWeek;
                })
                .map(schedule => ({
                    ...schedule,
                    staffId: staff.id,
                    staffName: staff.name,
                    staffRole: staff.role
                }))
        );
    });

    // CRUD操作

    /**
     * 全職員データを読み込み
     */
    async loadStaff(): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            // TODO: 実際のAPI呼び出しに置き換え
            // const response = await fetch('/api/staff');
            // const staff = await response.json();

            // 仮のデータ（開発用）
            const mockStaff: Staff[] = [
                {
                    id: '1',
                    name: '佐藤花子',
                    nameKana: 'サトウハナコ',
                    email: 'hanako.sato@example.com',
                    phone: '090-1111-2222',
                    role: 'manager',
                    department: '介護部',
                    hireDate: new Date('2020-04-01'),
                    qualifications: [
                        {
                            id: '1',
                            name: '介護福祉士',
                            issuer: '厚生労働省',
                            issueDate: new Date('2019-03-15'),
                            certificateNumber: 'KF123456'
                        }
                    ],
                    schedule: [
                        {
                            id: '1',
                            date: new Date(),
                            startTime: '09:00',
                            endTime: '18:00',
                            shiftType: 'day',
                            isConfirmed: true
                        }
                    ],
                    permissions: ['user.read', 'user.write', 'staff.read', 'reports.write'],
                    isActive: true,
                    createdAt: new Date('2020-04-01'),
                    updatedAt: new Date('2020-04-01')
                },
                {
                    id: '2',
                    name: '田中一郎',
                    nameKana: 'タナカイチロウ',
                    email: 'ichiro.tanaka@example.com',
                    phone: '090-3333-4444',
                    role: 'caregiver',
                    department: '介護部',
                    hireDate: new Date('2021-06-15'),
                    qualifications: [],
                    schedule: [
                        {
                            id: '2',
                            date: new Date(),
                            startTime: '22:00',
                            endTime: '07:00',
                            shiftType: 'night',
                            isConfirmed: true
                        }
                    ],
                    permissions: ['user.read', 'reports.write'],
                    isActive: true,
                    createdAt: new Date('2021-06-15'),
                    updatedAt: new Date('2021-06-15')
                }
            ];

            this.staff = mockStaff;
            this.cleanupFavorites();
        } catch (err) {
            this.error = err instanceof Error ? err.message : '職員データの読み込みに失敗しました';
        } finally {
            this.isLoading = false;
        }
    }

    private cleanupFavorites(): void {
        if (this.favoriteStaffIds.length === 0) return;
        const existing = new Set(this.staff.map((s) => s.id));
        const cleaned = this.favoriteStaffIds.filter((id) => existing.has(id));
        if (cleaned.length !== this.favoriteStaffIds.length) {
            this.favoriteStaffIds = cleaned;
            saveStringArrayToStorage(FAVORITE_STAFF_STORAGE_KEY, cleaned);
            this.ensurePageInRange();
        }
    }

    private ensurePageInRange(): void {
        const maxPage = this.nonFavoriteTotalPages;
        if (this.currentPage > maxPage) this.currentPage = maxPage;
        if (this.currentPage < 1) this.currentPage = 1;
    }

    /**
     * お気に入り（ピン留め）を切り替え
     */
    toggleFavoriteStaff(staffId: string): void {
        const index = this.favoriteStaffIds.indexOf(staffId);
        if (index === -1) {
            this.favoriteStaffIds = [staffId, ...this.favoriteStaffIds];
        } else {
            this.favoriteStaffIds = this.favoriteStaffIds.filter((id) => id !== staffId);
        }

        saveStringArrayToStorage(FAVORITE_STAFF_STORAGE_KEY, this.favoriteStaffIds);
        this.ensurePageInRange();
    }

    /**
     * お気に入り内の順序を移動
     */
    moveFavoriteStaff(draggedStaffId: string, targetStaffId: string, insertAfter: boolean): void {
        if (draggedStaffId === targetStaffId) return;

        const ids = this.favoriteStaffIds.slice();
        const fromIndex = ids.indexOf(draggedStaffId);
        const targetIndex = ids.indexOf(targetStaffId);
        if (fromIndex === -1 || targetIndex === -1) return;

        ids.splice(fromIndex, 1);
        let insertIndex = targetIndex;
        if (fromIndex < targetIndex) insertIndex -= 1;
        if (insertAfter) insertIndex += 1;
        ids.splice(insertIndex, 0, draggedStaffId);

        this.favoriteStaffIds = ids;
        saveStringArrayToStorage(FAVORITE_STAFF_STORAGE_KEY, ids);
    }

    /**
     * 職員を作成
     */
    async createStaff(staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<Staff> {
        this.isLoading = true;
        this.error = null;

        try {
            // TODO: 実際のAPI呼び出しに置き換え
            const newStaff: Staff = {
                ...staffData,
                id: Date.now().toString(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.staff.push(newStaff);
            return newStaff;
        } catch (err) {
            this.error = err instanceof Error ? err.message : '職員の作成に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 職員を更新
     */
    async updateStaff(id: string, updates: Partial<Staff>): Promise<Staff> {
        this.isLoading = true;
        this.error = null;

        try {
            const staffIndex = this.staff.findIndex(s => s.id === id);
            if (staffIndex === -1) {
                throw new Error('職員が見つかりません');
            }

            const updatedStaff: Staff = {
                ...this.staff[staffIndex],
                ...updates,
                updatedAt: new Date()
            };

            this.staff[staffIndex] = updatedStaff;

            // 選択中の職員も更新
            if (this.selectedStaff?.id === id) {
                this.selectedStaff = updatedStaff;
            }

            return updatedStaff;
        } catch (err) {
            this.error = err instanceof Error ? err.message : '職員の更新に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 職員を削除（論理削除）
     */
    async deleteStaff(id: string): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            await this.updateStaff(id, { isActive: false });
        } catch (err) {
            this.error = err instanceof Error ? err.message : '職員の削除に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * スケジュールを追加
     */
    async addSchedule(staffId: string, schedule: Omit<WorkSchedule, 'id'>): Promise<WorkSchedule> {
        this.isLoading = true;
        this.error = null;

        try {
            const staff = this.staff.find(s => s.id === staffId);
            if (!staff) {
                throw new Error('職員が見つかりません');
            }

            const newSchedule: WorkSchedule = {
                ...schedule,
                id: Date.now().toString()
            };

            const updatedSchedule = [...staff.schedule, newSchedule];
            await this.updateStaff(staffId, { schedule: updatedSchedule });

            return newSchedule;
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'スケジュールの追加に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * スケジュールを更新
     */
    async updateSchedule(staffId: string, scheduleId: string, updates: Partial<WorkSchedule>): Promise<WorkSchedule> {
        this.isLoading = true;
        this.error = null;

        try {
            const staff = this.staff.find(s => s.id === staffId);
            if (!staff) {
                throw new Error('職員が見つかりません');
            }

            const scheduleIndex = staff.schedule.findIndex(s => s.id === scheduleId);
            if (scheduleIndex === -1) {
                throw new Error('スケジュールが見つかりません');
            }

            const updatedSchedule = [...staff.schedule];
            updatedSchedule[scheduleIndex] = { ...updatedSchedule[scheduleIndex], ...updates };

            await this.updateStaff(staffId, { schedule: updatedSchedule });

            return updatedSchedule[scheduleIndex];
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'スケジュールの更新に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * スケジュールを削除
     */
    async deleteSchedule(staffId: string, scheduleId: string): Promise<void> {
        this.isLoading = true;
        this.error = null;

        try {
            const staff = this.staff.find(s => s.id === staffId);
            if (!staff) {
                throw new Error('職員が見つかりません');
            }

            const updatedSchedule = staff.schedule.filter(s => s.id !== scheduleId);
            await this.updateStaff(staffId, { schedule: updatedSchedule });
        } catch (err) {
            this.error = err instanceof Error ? err.message : 'スケジュールの削除に失敗しました';
            throw err;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 職員を選択
     */
    selectStaff(staff: Staff | null): void {
        this.selectedStaff = staff;
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
    setFilter(filter: Partial<StaffFilter>): void {
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
    setSortOption(sortOption: StaffSortOption): void {
        this.sortOption = sortOption;
    }

    /**
     * ページを変更
     */
    setPage(page: number): void {
        if (page >= 1 && page <= this.nonFavoriteTotalPages) {
            this.currentPage = page;
        }
    }

    /**
     * ページサイズを変更
     */
    setItemsPerPage(itemsPerPage: number): void {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1; // ページサイズ変更時はページをリセット
        this.ensurePageInRange();
    }

    /**
     * スケジュール表示日を設定
     */
    setSelectedDate(date: Date): void {
        this.selectedDate = date;
    }

    /**
     * スケジュール表示モードを設定
     */
    setScheduleView(view: 'day' | 'week' | 'month'): void {
        this.scheduleView = view;
    }

    /**
     * エラーをクリア
     */
    clearError(): void {
        this.error = null;
    }

    /**
     * 特定の役職の職員を取得
     */
    getStaffByRole(role: StaffRole): Staff[] {
        return this.staff.filter(staff => staff.role === role && staff.isActive);
    }

    /**
     * 特定の部署の職員を取得
     */
    getStaffByDepartment(department: string): Staff[] {
        return this.staff.filter(staff => staff.department === department && staff.isActive);
    }

    /**
     * 特定の権限を持つ職員を取得
     */
    getStaffByPermission(permission: string): Staff[] {
        return this.staff.filter(staff =>
            staff.permissions.includes(permission as any) && staff.isActive
        );
    }
}

// シングルトンインスタンス
export const staffStore = new StaffStore();