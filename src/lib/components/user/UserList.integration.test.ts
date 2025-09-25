import { describe, it, expect, beforeEach } from 'vitest';
import { userStore } from '$lib/stores/user.svelte';

describe('UserList Integration', () => {
  beforeEach(async () => {
    // Reset store state
    userStore.users = [];
    userStore.selectedUser = null;
    userStore.isLoading = false;
    userStore.error = null;
    userStore.searchTerm = '';
    userStore.filter = {};
    userStore.sortOption = { field: 'name', direction: 'asc' };
    userStore.currentPage = 1;
    userStore.itemsPerPage = 20;
    
    // Load mock data
    await userStore.loadUsers();
  });

  it('loads user data correctly', () => {
    expect(userStore.users.length).toBeGreaterThan(0);
    expect(userStore.users[0].name).toBe('田中太郎');
    expect(userStore.users[1].name).toBe('佐藤花子');
  });

  it('filters users by search term', () => {
    userStore.setSearchTerm('田中');
    expect(userStore.filteredUsers.length).toBe(1);
    expect(userStore.filteredUsers[0].name).toBe('田中太郎');
  });

  it('filters users by care level', () => {
    userStore.setFilter({ careLevel: [3] });
    const filtered = userStore.filteredUsers;
    expect(filtered.length).toBe(1);
    expect(filtered[0].careLevel).toBe(3);
  });

  it('filters users by gender', () => {
    userStore.setFilter({ gender: ['female'] });
    const filtered = userStore.filteredUsers;
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach(user => {
      expect(user.gender).toBe('female');
    });
  });

  it('filters users by status', () => {
    userStore.setFilter({ status: ['inactive'] });
    const filtered = userStore.filteredUsers;
    expect(filtered.length).toBe(1);
    expect(filtered[0].isActive).toBe(false);
  });

  it('filters users by age range', () => {
    userStore.setFilter({ ageRange: { min: 80, max: 90 } });
    const filtered = userStore.filteredUsers;
    filtered.forEach(user => {
      const age = new Date().getFullYear() - user.birthDate.getFullYear();
      expect(age).toBeGreaterThanOrEqual(80);
      expect(age).toBeLessThanOrEqual(90);
    });
  });

  it('sorts users correctly', () => {
    userStore.setSortOption({ field: 'careLevel', direction: 'desc' });
    const sorted = userStore.sortedUsers;
    
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].careLevel).toBeGreaterThanOrEqual(sorted[i + 1].careLevel);
    }
  });

  it('paginates users correctly', () => {
    userStore.setItemsPerPage(2);
    expect(userStore.paginatedUsers.length).toBe(2);
    expect(userStore.totalPages).toBe(Math.ceil(userStore.sortedUsers.length / 2));
    
    userStore.setPage(2);
    expect(userStore.paginatedUsers.length).toBeGreaterThan(0);
    expect(userStore.paginatedUsers[0]).not.toBe(userStore.sortedUsers[0]);
  });

  it('combines multiple filters correctly', () => {
    userStore.setSearchTerm('田中');
    userStore.setFilter({ careLevel: [3], gender: ['male'] });
    
    const filtered = userStore.filteredUsers;
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('田中太郎');
    expect(filtered[0].careLevel).toBe(3);
    expect(filtered[0].gender).toBe('male');
  });

  it('clears filters correctly', () => {
    userStore.setSearchTerm('田中');
    userStore.setFilter({ careLevel: [3] });
    
    expect(userStore.filteredUsers.length).toBe(1);
    
    userStore.clearFilter();
    
    expect(userStore.searchTerm).toBe('');
    expect(userStore.filter).toEqual({});
    expect(userStore.filteredUsers.length).toBe(userStore.users.length);
  });

  it('calculates statistics correctly', () => {
    const stats = userStore.statistics;
    
    expect(stats.total).toBe(userStore.users.length);
    expect(stats.active).toBe(userStore.users.filter(u => u.isActive).length);
    expect(stats.inactive).toBe(userStore.users.filter(u => !u.isActive).length);
    
    // Check gender statistics
    const maleCount = userStore.users.filter(u => u.gender === 'male').length;
    const femaleCount = userStore.users.filter(u => u.gender === 'female').length;
    expect(stats.byGender.male).toBe(maleCount);
    expect(stats.byGender.female).toBe(femaleCount);
    
    // Check care level statistics
    const careLevel3Count = userStore.users.filter(u => u.careLevel === 3).length;
    expect(stats.byCareLevel[3]).toBe(careLevel3Count);
  });

  it('selects user correctly', () => {
    const user = userStore.users[0];
    userStore.selectUser(user);
    
    expect(userStore.selectedUser).toBe(user);
    expect(userStore.selectedUser?.id).toBe(user.id);
  });

  it('handles user CRUD operations', async () => {
    const initialCount = userStore.users.length;
    
    // Create user
    const newUserData = {
      name: 'テスト太郎',
      nameKana: 'テストタロウ',
      birthDate: new Date('1950-01-01'),
      gender: 'male' as const,
      address: {
        postalCode: '000-0000',
        prefecture: 'テスト県',
        city: 'テスト市',
        street: 'テスト1-1-1'
      },
      emergencyContact: {
        name: 'テスト花子',
        relationship: '妻',
        phone: '000-0000-0000'
      },
      medicalInfo: {
        allergies: [],
        medications: [],
        conditions: [],
        restrictions: []
      },
      careLevel: 1,
      familyMembers: [],
      notes: [],
      admissionDate: new Date(),
      isActive: true
    };
    
    const createdUser = await userStore.createUser(newUserData);
    expect(userStore.users.length).toBe(initialCount + 1);
    expect(createdUser.name).toBe('テスト太郎');
    
    // Update user
    const updatedUser = await userStore.updateUser(createdUser.id, { careLevel: 2 });
    expect(updatedUser.careLevel).toBe(2);
    
    // Delete user (logical delete)
    await userStore.deleteUser(createdUser.id);
    const deletedUser = userStore.users.find(u => u.id === createdUser.id);
    expect(deletedUser?.isActive).toBe(false);
  });
});