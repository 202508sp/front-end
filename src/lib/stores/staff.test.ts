/**
 * StaffStore のテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { StaffStore } from './staff.svelte';
import type { Staff, WorkSchedule } from '$lib/types/staff';

describe('StaffStore', () => {
  let staffStore: StaffStore;
  
  const mockStaff: Staff = {
    id: '1',
    name: '佐藤花子',
    nameKana: 'サトウハナコ',
    email: 'hanako.sato@example.com',
    phone: '090-1111-2222',
    role: 'manager',
    department: '介護部',
    hireDate: new Date('2020-04-01'),
    qualifications: [],
    schedule: [],
    permissions: ['user.read', 'user.write'],
    isActive: true,
    createdAt: new Date('2020-04-01'),
    updatedAt: new Date('2020-04-01')
  };
  
  beforeEach(() => {
    staffStore = new StaffStore();
  });
  
  describe('初期状態', () => {
    it('初期状態が正しく設定されている', () => {
      expect(staffStore.staff).toEqual([]);
      expect(staffStore.selectedStaff).toBeNull();
      expect(staffStore.isLoading).toBe(false);
      expect(staffStore.error).toBeNull();
      expect(staffStore.searchTerm).toBe('');
      expect(staffStore.currentPage).toBe(1);
      expect(staffStore.itemsPerPage).toBe(20);
      expect(staffStore.scheduleView).toBe('week');
    });
  });
  
  describe('CRUD操作', () => {
    it('職員を作成できる', async () => {
      const staffData = { ...mockStaff };
      delete (staffData as any).id;
      delete (staffData as any).createdAt;
      delete (staffData as any).updatedAt;
      
      const createdStaff = await staffStore.createStaff(staffData);
      
      expect(createdStaff.id).toBeDefined();
      expect(createdStaff.name).toBe(mockStaff.name);
      expect(staffStore.staff).toHaveLength(1);
      expect(staffStore.staff[0]).toEqual(createdStaff);
    });
    
    it('職員を更新できる', async () => {
      staffStore.staff = [mockStaff];
      
      const updates = { name: '佐藤太郎', role: 'caregiver' as const };
      const updatedStaff = await staffStore.updateStaff('1', updates);
      
      expect(updatedStaff.name).toBe('佐藤太郎');
      expect(updatedStaff.role).toBe('caregiver');
      expect(staffStore.staff[0]).toEqual(updatedStaff);
    });
    
    it('存在しない職員の更新でエラーが発生する', async () => {
      await expect(staffStore.updateStaff('999', { name: 'テスト' }))
        .rejects.toThrow('職員が見つかりません');
    });
    
    it('職員を削除（論理削除）できる', async () => {
      staffStore.staff = [mockStaff];
      
      await staffStore.deleteStaff('1');
      
      expect(staffStore.staff[0].isActive).toBe(false);
    });
  });
  
  describe('検索・フィルタリング', () => {
    beforeEach(() => {
      const staff: Staff[] = [
        { ...mockStaff, id: '1', name: '佐藤花子', role: 'manager', department: '介護部' },
        { ...mockStaff, id: '2', name: '田中一郎', role: 'caregiver', department: '介護部' },
        { ...mockStaff, id: '3', name: '鈴木美子', role: 'nurse', department: '医療部', isActive: false }
      ];
      staffStore.staff = staff;
    });
    
    it('名前で検索できる', () => {
      staffStore.setSearchTerm('佐藤');
      expect(staffStore.filteredStaff).toHaveLength(1);
      expect(staffStore.filteredStaff[0].name).toBe('佐藤花子');
    });
    
    it('メールアドレスで検索できる', () => {
      // 実際のメールアドレスを設定
      staffStore.staff[0].email = 'hanako.sato@example.com';
      staffStore.staff[1].email = 'ichiro.tanaka@example.com';
      staffStore.staff[2].email = 'michiko.suzuki@example.com';
      
      staffStore.setSearchTerm('hanako.sato');
      expect(staffStore.filteredStaff).toHaveLength(1);
      expect(staffStore.filteredStaff[0].name).toBe('佐藤花子');
    });
    
    it('役職でフィルタできる', () => {
      staffStore.setFilter({ role: ['manager', 'nurse'] });
      expect(staffStore.filteredStaff).toHaveLength(2);
    });
    
    it('部署でフィルタできる', () => {
      staffStore.setFilter({ department: ['介護部'] });
      expect(staffStore.filteredStaff).toHaveLength(2);
    });
    
    it('アクティブ状態でフィルタできる', () => {
      staffStore.setFilter({ isActive: true });
      expect(staffStore.filteredStaff).toHaveLength(2);
    });
    
    it('フィルタをクリアできる', () => {
      staffStore.setFilter({ role: ['manager'] });
      staffStore.setSearchTerm('佐藤');
      
      staffStore.clearFilter();
      
      expect(staffStore.filter).toEqual({});
      expect(staffStore.searchTerm).toBe('');
      expect(staffStore.filteredStaff).toHaveLength(3);
    });
  });
  
  describe('ソート', () => {
    beforeEach(() => {
      const staff: Staff[] = [
        { ...mockStaff, id: '1', name: '田中一郎' },
        { ...mockStaff, id: '2', name: '佐藤花子' },
        { ...mockStaff, id: '3', name: '鈴木美子' }
      ];
      staffStore.staff = staff;
    });
    
    it('名前で昇順ソートできる', () => {
      staffStore.setSortOption({ field: 'name', direction: 'asc' });
      const sorted = staffStore.sortedStaff;
      // 日本語の文字コード順でソート: さ < す < た
      expect(sorted[0].name).toBe('佐藤花子');
      expect(sorted[1].name).toBe('田中一郎');
      expect(sorted[2].name).toBe('鈴木美子');
    });
    
    it('名前で降順ソートできる', () => {
      staffStore.setSortOption({ field: 'name', direction: 'desc' });
      const sorted = staffStore.sortedStaff;
      // 日本語の文字コード順でソート（降順）: た > す > さ
      expect(sorted[0].name).toBe('鈴木美子');
      expect(sorted[1].name).toBe('田中一郎');
      expect(sorted[2].name).toBe('佐藤花子');
    });
  });
  
  describe('スケジュール管理', () => {
    const mockSchedule: WorkSchedule = {
      id: '1',
      date: new Date('2024-01-15'),
      startTime: '09:00',
      endTime: '18:00',
      shiftType: 'day',
      isConfirmed: true
    };
    
    beforeEach(() => {
      staffStore.staff = [mockStaff];
    });
    
    it('スケジュールを追加できる', async () => {
      const scheduleData = { ...mockSchedule };
      delete (scheduleData as any).id;
      
      const addedSchedule = await staffStore.addSchedule('1', scheduleData);
      
      expect(addedSchedule.id).toBeDefined();
      expect(staffStore.staff[0].schedule).toHaveLength(1);
      expect(staffStore.staff[0].schedule[0]).toEqual(addedSchedule);
    });
    
    it('スケジュールを更新できる', async () => {
      staffStore.staff[0].schedule = [mockSchedule];
      
      const updates = { startTime: '10:00', endTime: '19:00' };
      const updatedSchedule = await staffStore.updateSchedule('1', '1', updates);
      
      expect(updatedSchedule.startTime).toBe('10:00');
      expect(updatedSchedule.endTime).toBe('19:00');
    });
    
    it('スケジュールを削除できる', async () => {
      staffStore.staff[0].schedule = [mockSchedule];
      
      await staffStore.deleteSchedule('1', '1');
      
      expect(staffStore.staff[0].schedule).toHaveLength(0);
    });
    
    it('存在しない職員のスケジュール操作でエラーが発生する', async () => {
      await expect(staffStore.addSchedule('999', mockSchedule))
        .rejects.toThrow('職員が見つかりません');
    });
  });
  
  describe('スケジュール表示', () => {
    beforeEach(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const staff: Staff[] = [
        {
          ...mockStaff,
          id: '1',
          name: '佐藤花子',
          schedule: [
            {
              id: '1',
              date: today,
              startTime: '09:00',
              endTime: '18:00',
              shiftType: 'day',
              isConfirmed: true
            }
          ]
        },
        {
          ...mockStaff,
          id: '2',
          name: '田中一郎',
          schedule: [
            {
              id: '2',
              date: tomorrow,
              startTime: '22:00',
              endTime: '07:00',
              shiftType: 'night',
              isConfirmed: true
            }
          ]
        }
      ];
      staffStore.staff = staff;
      staffStore.setSelectedDate(today);
    });
    
    it('日次スケジュールを取得できる', () => {
      const dailySchedule = staffStore.dailySchedule;
      expect(dailySchedule).toHaveLength(1);
      expect(dailySchedule[0].staffName).toBe('佐藤花子');
    });
    
    it('週間スケジュールを取得できる', () => {
      const weeklySchedule = staffStore.weeklySchedule;
      expect(weeklySchedule).toHaveLength(2);
    });
  });
  
  describe('統計情報', () => {
    beforeEach(() => {
      const staff: Staff[] = [
        { ...mockStaff, id: '1', role: 'manager', department: '介護部', isActive: true },
        { ...mockStaff, id: '2', role: 'caregiver', department: '介護部', isActive: true },
        { ...mockStaff, id: '3', role: 'nurse', department: '医療部', isActive: false }
      ];
      staffStore.staff = staff;
    });
    
    it('統計情報が正しく計算される', () => {
      const stats = staffStore.statistics;
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.inactive).toBe(1);
      expect(stats.byRole.manager).toBe(1);
      expect(stats.byRole.caregiver).toBe(1);
      expect(stats.byRole.nurse).toBe(1);
      expect(stats.byDepartment['介護部']).toBe(2);
      expect(stats.byDepartment['医療部']).toBe(1);
    });
  });
  
  describe('職員検索メソッド', () => {
    beforeEach(() => {
      const staff: Staff[] = [
        { ...mockStaff, id: '1', role: 'manager', department: '介護部', permissions: ['user.read'], isActive: true },
        { ...mockStaff, id: '2', role: 'caregiver', department: '介護部', permissions: ['user.write'], isActive: true },
        { ...mockStaff, id: '3', role: 'nurse', department: '医療部', permissions: ['user.read'], isActive: false }
      ];
      staffStore.staff = staff;
    });
    
    it('役職で職員を検索できる', () => {
      const managers = staffStore.getStaffByRole('manager');
      expect(managers).toHaveLength(1);
      expect(managers[0].role).toBe('manager');
    });
    
    it('部署で職員を検索できる', () => {
      const caregivers = staffStore.getStaffByDepartment('介護部');
      expect(caregivers).toHaveLength(2);
    });
    
    it('権限で職員を検索できる', () => {
      const readPermissionStaff = staffStore.getStaffByPermission('user.read');
      expect(readPermissionStaff).toHaveLength(1); // アクティブな職員のみ
    });
  });
  
  describe('職員選択', () => {
    it('職員を選択できる', () => {
      staffStore.selectStaff(mockStaff);
      expect(staffStore.selectedStaff).toEqual(mockStaff);
    });
    
    it('職員選択をクリアできる', () => {
      staffStore.selectStaff(mockStaff);
      staffStore.selectStaff(null);
      expect(staffStore.selectedStaff).toBeNull();
    });
  });
  
  describe('エラーハンドリング', () => {
    it('エラーをクリアできる', () => {
      staffStore.error = 'テストエラー';
      staffStore.clearError();
      expect(staffStore.error).toBeNull();
    });
  });
});