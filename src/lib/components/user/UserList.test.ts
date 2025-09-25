import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import UserList from './UserList.svelte';
import { userStore } from '$lib/stores/user.svelte';
import type { User } from '$lib/types/user';

// Mock the user store
vi.mock('$lib/stores/user.svelte', () => ({
  userStore: {
    users: [],
    selectedUser: null,
    isLoading: false,
    error: null,
    searchTerm: '',
    filter: {},
    sortOption: { field: 'name', direction: 'asc' },
    currentPage: 1,
    itemsPerPage: 20,
    filteredUsers: [],
    sortedUsers: [],
    paginatedUsers: [],
    totalPages: 1,
    statistics: {
      total: 0,
      active: 0,
      inactive: 0,
      byGender: {},
      byCareLevel: {}
    },
    loadUsers: vi.fn(),
    selectUser: vi.fn(),
    setSearchTerm: vi.fn(),
    setFilter: vi.fn(),
    clearFilter: vi.fn(),
    setSortOption: vi.fn(),
    setPage: vi.fn(),
    setItemsPerPage: vi.fn(),
    clearError: vi.fn()
  }
}));

// Mock formatters
vi.mock('$lib/utils/formatters', () => ({
  formatters: {
    formatDate: vi.fn((date: Date) => date.toLocaleDateString('ja-JP'))
  }
}));

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
  },
  {
    id: '2',
    name: '佐藤花子',
    nameKana: 'サトウハナコ',
    birthDate: new Date('1935-08-20'),
    gender: 'female',
    address: {
      postalCode: '456-7890',
      prefecture: '大阪府',
      city: '大阪市',
      street: '梅田1-1-1'
    },
    emergencyContact: {
      name: '佐藤次郎',
      relationship: '息子',
      phone: '090-9876-5432'
    },
    medicalInfo: {
      allergies: [],
      medications: [],
      conditions: ['認知症'],
      restrictions: []
    },
    careLevel: 4,
    familyMembers: [],
    notes: [],
    admissionDate: new Date('2022-06-10'),
    isActive: true,
    createdAt: new Date('2022-06-10'),
    updatedAt: new Date('2022-06-10')
  }
];

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    userStore.users = mockUsers;
    userStore.selectedUser = null;
    userStore.isLoading = false;
    userStore.error = null;
    userStore.searchTerm = '';
    userStore.filter = {};
    userStore.sortOption = { field: 'name', direction: 'asc' };
    userStore.currentPage = 1;
    userStore.itemsPerPage = 20;
    userStore.filteredUsers = mockUsers;
    userStore.sortedUsers = mockUsers;
    userStore.paginatedUsers = mockUsers;
    userStore.totalPages = 1;
  });

  it('renders user list correctly', () => {
    render(UserList);
    
    expect(screen.getByText('利用者一覧')).toBeInTheDocument();
    expect(screen.getByText('(2件)')).toBeInTheDocument();
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('佐藤花子')).toBeInTheDocument();
  });

  it('calls loadUsers on mount', () => {
    render(UserList);
    expect(userStore.loadUsers).toHaveBeenCalled();
  });

  it('handles search input', async () => {
    render(UserList);
    
    const searchInput = screen.getByTestId('search-input');
    await fireEvent.input(searchInput, { target: { value: '田中' } });
    
    expect(userStore.setSearchTerm).toHaveBeenCalledWith('田中');
  });

  it('toggles filter panel', async () => {
    render(UserList);
    
    const toggleButton = screen.getByTestId('toggle-filters');
    await fireEvent.click(toggleButton);
    
    expect(screen.getByText('要介護度')).toBeInTheDocument();
    expect(screen.getByText('性別')).toBeInTheDocument();
    expect(screen.getByText('ステータス')).toBeInTheDocument();
    expect(screen.getByText('年齢範囲')).toBeInTheDocument();
  });

  it('handles care level filter', async () => {
    render(UserList);
    
    // Open filters
    const toggleButton = screen.getByTestId('toggle-filters');
    await fireEvent.click(toggleButton);
    
    // Select care level 3
    const careLevel3 = screen.getByTestId('care-level-3');
    await fireEvent.click(careLevel3);
    
    expect(userStore.setFilter).toHaveBeenCalledWith({
      careLevel: [3]
    });
  });

  it('handles gender filter', async () => {
    render(UserList);
    
    // Open filters
    const toggleButton = screen.getByTestId('toggle-filters');
    await fireEvent.click(toggleButton);
    
    // Select male gender
    const genderMale = screen.getByTestId('gender-male');
    await fireEvent.click(genderMale);
    
    expect(userStore.setFilter).toHaveBeenCalledWith({
      gender: ['male']
    });
  });

  it('handles sort change', async () => {
    render(UserList);
    
    const sortSelect = screen.getByTestId('sort-select');
    await fireEvent.change(sortSelect, { target: { value: 'careLevel-desc' } });
    
    expect(userStore.setSortOption).toHaveBeenCalledWith({
      field: 'careLevel',
      direction: 'desc'
    });
  });

  it('handles items per page change', async () => {
    render(UserList);
    
    const itemsPerPageSelect = screen.getByTestId('items-per-page-select');
    await fireEvent.change(itemsPerPageSelect, { target: { value: '50' } });
    
    expect(userStore.setItemsPerPage).toHaveBeenCalledWith(50);
  });

  it('handles user selection', async () => {
    const onUserSelect = vi.fn();
    render(UserList, { onUserSelect });
    
    const userItem = screen.getByTestId('user-item-1');
    await fireEvent.click(userItem);
    
    expect(userStore.selectUser).toHaveBeenCalledWith(mockUsers[0]);
    expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('handles keyboard navigation for user selection', async () => {
    const onUserSelect = vi.fn();
    render(UserList, { onUserSelect });
    
    const userItem = screen.getByTestId('user-item-1');
    await fireEvent.keyDown(userItem, { key: 'Enter' });
    
    expect(userStore.selectUser).toHaveBeenCalledWith(mockUsers[0]);
    expect(onUserSelect).toHaveBeenCalledWith(mockUsers[0]);
  });

  it('clears filters', async () => {
    render(UserList);
    
    const clearButton = screen.getByTestId('clear-filters');
    await fireEvent.click(clearButton);
    
    expect(userStore.clearFilter).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    userStore.isLoading = true;
    userStore.paginatedUsers = [];
    
    render(UserList);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    userStore.isLoading = false;
    userStore.error = 'エラーが発生しました';
    userStore.paginatedUsers = [];
    
    render(UserList);
    
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText('再試行')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    userStore.isLoading = false;
    userStore.error = null;
    userStore.paginatedUsers = [];
    userStore.sortedUsers = [];
    
    render(UserList);
    
    expect(screen.getByText('利用者が見つかりません')).toBeInTheDocument();
  });

  it('shows pagination when multiple pages exist', () => {
    userStore.totalPages = 3;
    userStore.currentPage = 2;
    
    render(UserList);
    
    expect(screen.getByTestId('prev-page')).toBeInTheDocument();
    expect(screen.getByTestId('next-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-1')).toBeInTheDocument();
    expect(screen.getByTestId('page-2')).toBeInTheDocument();
    expect(screen.getByTestId('page-3')).toBeInTheDocument();
  });

  it('handles pagination navigation', async () => {
    userStore.totalPages = 3;
    userStore.currentPage = 1;
    
    render(UserList);
    
    const nextButton = screen.getByTestId('next-page');
    await fireEvent.click(nextButton);
    
    expect(userStore.setPage).toHaveBeenCalledWith(2);
  });

  it('displays user information correctly', () => {
    render(UserList);
    
    // Check user 1 information
    expect(screen.getByText('田中太郎')).toBeInTheDocument();
    expect(screen.getByText('(タナカタロウ)')).toBeInTheDocument();
    expect(screen.getByText('要介護3')).toBeInTheDocument();
    expect(screen.getByText('男性')).toBeInTheDocument();
    expect(screen.getByText('高血圧')).toBeInTheDocument();
    expect(screen.getByText('糖尿病')).toBeInTheDocument();
  });

  it('highlights selected user', () => {
    userStore.selectedUser = mockUsers[0];
    
    render(UserList);
    
    const userItem = screen.getByTestId('user-item-1');
    expect(userItem).toHaveClass('bg:care-primary-50');
    expect(userItem).toHaveClass('border-l:4|solid|care-primary-500');
  });

  it('shows inactive status for inactive users', () => {
    const inactiveUser = { ...mockUsers[0], isActive: false };
    userStore.paginatedUsers = [inactiveUser];
    userStore.sortedUsers = [inactiveUser];
    
    render(UserList);
    
    expect(screen.getByText('非アクティブ')).toBeInTheDocument();
  });

  it('limits displayed medical conditions', () => {
    const userWithManyConditions = {
      ...mockUsers[0],
      medicalInfo: {
        ...mockUsers[0].medicalInfo,
        conditions: ['高血圧', '糖尿病', '心疾患', '腎疾患', '肝疾患']
      }
    };
    userStore.paginatedUsers = [userWithManyConditions];
    userStore.sortedUsers = [userWithManyConditions];
    
    render(UserList);
    
    expect(screen.getByText('高血圧')).toBeInTheDocument();
    expect(screen.getByText('糖尿病')).toBeInTheDocument();
    expect(screen.getByText('心疾患')).toBeInTheDocument();
    expect(screen.getByText('+2件')).toBeInTheDocument();
  });
});