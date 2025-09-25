<script lang="ts">
  import type { User, UserFilter, UserSortOption } from '$lib/types/user';
  import { userStore } from '$lib/stores/user.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { onMount } from 'svelte';
	import { formatDate } from '$lib/utils';

  interface Props {
    onUserSelect?: (user: User) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    onUserSelect,
    class: className = '',
    'data-testid': testId = 'user-list'
  }: Props = $props();

  // Local state for filters
  let searchInput = $state('');
  let selectedCareLevel = $state<number[]>([]);
  let selectedGender = $state<('male' | 'female' | 'other')[]>([]);
  let selectedStatus = $state<('active' | 'inactive')[]>(['active']);
  let ageRangeMin = $state<number | undefined>();
  let ageRangeMax = $state<number | undefined>();
  let showFilters = $state(false);

  // Sort options
  const sortOptions: { value: keyof User; label: string }[] = [
    { value: 'name', label: '名前' },
    { value: 'nameKana', label: 'フリガナ' },
    { value: 'careLevel', label: '要介護度' },
    { value: 'birthDate', label: '生年月日' },
    { value: 'admissionDate', label: '入所日' },
    { value: 'updatedAt', label: '更新日' }
  ];

  // Care level options
  const careLevelOptions = [
    { value: 1, label: '要介護1' },
    { value: 2, label: '要介護2' },
    { value: 3, label: '要介護3' },
    { value: 4, label: '要介護4' },
    { value: 5, label: '要介護5' }
  ];

  // Gender options
  const genderOptions = [
    { value: 'male' as const, label: '男性' },
    { value: 'female' as const, label: '女性' },
    { value: 'other' as const, label: 'その他' }
  ];

  // Status options
  const statusOptions = [
    { value: 'active' as const, label: 'アクティブ' },
    { value: 'inactive' as const, label: '非アクティブ' }
  ];

  // Items per page options
  const itemsPerPageOptions = [10, 20, 50, 100];

  // Load users on mount
  onMount(() => {
    userStore.loadUsers();
  });

  // Apply search filter
  $effect(() => {
    userStore.setSearchTerm(searchInput);
  });

  // Apply other filters
  $effect(() => {
    const filter: UserFilter = {};
    
    if (selectedCareLevel.length > 0) {
      filter.careLevel = selectedCareLevel;
    }
    
    if (selectedGender.length > 0) {
      filter.gender = selectedGender;
    }
    
    if (selectedStatus.length > 0) {
      filter.status = selectedStatus;
    }
    
    if (ageRangeMin !== undefined || ageRangeMax !== undefined) {
      filter.ageRange = {
        min: ageRangeMin ?? 0,
        max: ageRangeMax ?? 150
      };
    }
    
    userStore.setFilter(filter);
  });

  // Handle user selection
  function handleUserClick(user: User) {
    userStore.selectUser(user);
    onUserSelect?.(user);
  }

  // Handle sort change
  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, direction] = target.value.split('-') as [keyof User, 'asc' | 'desc'];
    userStore.setSortOption({ field, direction });
  }

  // Handle page change
  function handlePageChange(page: number) {
    userStore.setPage(page);
  }

  // Handle items per page change
  function handleItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    userStore.setItemsPerPage(parseInt(target.value));
  }

  // Clear all filters
  function clearFilters() {
    searchInput = '';
    selectedCareLevel = [];
    selectedGender = [];
    selectedStatus = ['active'];
    ageRangeMin = undefined;
    ageRangeMax = undefined;
    userStore.clearFilter();
  }

  // Toggle filter in array
  function toggleFilter<T>(array: T[], value: T): T[] {
    const index = array.indexOf(value);
    if (index === -1) {
      return [...array, value];
    } else {
      return array.filter(item => item !== value);
    }
  }

  // Calculate age from birth date
  function calculateAge(birthDate: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }

  // Generate pagination pages
  function getPaginationPages(currentPage: number, totalPages: number): (number | '...')[] {
    const pages: (number | '...')[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  }
</script>

<div class="flex flex-col h:full {className}" data-testid={testId}>
  <!-- Header with search and controls -->
  <div class="flex-shrink:0 p:4 border-b:1|solid|care-gray-200 bg:care-background-primary">
    <div class="flex items-center justify-between mb:4">
      <h2 class="text:xl font:semibold text:care-text-primary">
        利用者一覧
        <span class="text:sm font:normal text:care-text-secondary ml:2">
          ({userStore.sortedUsers.length}件)
        </span>
      </h2>
      
      <div class="flex items-center gap:2">
        <Button
          variant="outline"
          size="sm"
          onclick={() => showFilters = !showFilters}
          data-testid="toggle-filters"
        >
          {#snippet children()}
            <svg class="w:4 h:4 mr:1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            フィルタ
          {/snippet}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onclick={clearFilters}
          data-testid="clear-filters"
        >
          {#snippet children()}
            クリア
          {/snippet}
        </Button>
      </div>
    </div>

    <!-- Search -->
    <div class="mb:4">
      <FormField label="検索">
        {#snippet children()}
          <Input
            type="search"
            bind:value={searchInput}
            placeholder="名前、フリガナ、IDで検索..."
            data-testid="search-input"
          />
        {/snippet}
      </FormField>
    </div>

    <!-- Filters -->
    {#if showFilters}
      <div class="grid grid-cols:1 md:grid-cols:2 lg:grid-cols:4 gap:4 p:4 bg:care-gray-50 rounded:lg">
        <!-- Care Level Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">要介護度</legend>
          <div class="space-y:1">
            {#each careLevelOptions as option}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCareLevel.includes(option.value)}
                  onchange={() => selectedCareLevel = toggleFilter(selectedCareLevel, option.value)}
                  class="mr:2"
                  data-testid="care-level-{option.value}"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Gender Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">性別</legend>
          <div class="space-y:1">
            {#each genderOptions as option}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedGender.includes(option.value)}
                  onchange={() => selectedGender = toggleFilter(selectedGender, option.value)}
                  class="mr:2"
                  data-testid="gender-{option.value}"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Status Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">ステータス</legend>
          <div class="space-y:1">
            {#each statusOptions as option}
              <label class="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(option.value)}
                  onchange={() => selectedStatus = toggleFilter(selectedStatus, option.value)}
                  class="mr:2"
                  data-testid="status-{option.value}"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Age Range Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">年齢範囲</legend>
          <div class="flex items-center gap:2">
            <Input
              type="number"
              bind:value={ageRangeMin}
              placeholder="最小"
              size="sm"
              min={0}
              max={150}
              data-testid="age-min"
            />
            <span class="text:sm text:care-text-secondary">〜</span>
            <Input
              type="number"
              bind:value={ageRangeMax}
              placeholder="最大"
              size="sm"
              min={0}
              max={150}
              data-testid="age-max"
            />
          </div>
        </fieldset>
      </div>
    {/if}

    <!-- Sort and Items per page -->
    <div class="flex items-center justify-between mt:4">
      <div class="flex items-center gap:4">
        <div class="flex items-center gap:2">
          <label for="sort-select" class="text:sm font:medium text:care-text-primary">並び順:</label>
          <select
            id="sort-select"
            onchange={handleSortChange}
            class="px:3 py:1 border:1|solid|care-gray-300 rounded:md text:sm"
            data-testid="sort-select"
          >
            {#each sortOptions as option}
              <option value="{option.value}-asc">{option.label} (昇順)</option>
              <option value="{option.value}-desc">{option.label} (降順)</option>
            {/each}
          </select>
        </div>

        <div class="flex items-center gap:2">
          <label for="items-per-page-select" class="text:sm font:medium text:care-text-primary">表示件数:</label>
          <select
            id="items-per-page-select"
            value={userStore.itemsPerPage}
            onchange={handleItemsPerPageChange}
            class="px:3 py:1 border:1|solid|care-gray-300 rounded:md text:sm"
            data-testid="items-per-page-select"
          >
            {#each itemsPerPageOptions as option}
              <option value={option}>{option}件</option>
            {/each}
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Loading state -->
  {#if userStore.isLoading}
    <div class="flex-1 flex items-center justify-center">
      <div class="text:center">
        <svg class="animate:spin h:8 w:8 text:care-primary-600 mx:auto mb:2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text:care-text-secondary">読み込み中...</p>
      </div>
    </div>
  {:else if userStore.error}
    <!-- Error state -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text:center">
        <svg class="h:8 w:8 text:care-accent-error-500 mx:auto mb:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text:care-accent-error-600 mb:2">{userStore.error}</p>
        <Button
          variant="outline"
          size="sm"
          onclick={() => userStore.loadUsers()}
        >
          {#snippet children()}
            再試行
          {/snippet}
        </Button>
      </div>
    </div>
  {:else if userStore.paginatedUsers.length === 0}
    <!-- Empty state -->
    <div class="flex-1 flex items-center justify-center">
      <div class="text:center">
        <svg class="h:12 w:12 text:care-gray-400 mx:auto mb:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text:lg font:medium text:care-text-primary mb:2">利用者が見つかりません</h3>
        <p class="text:care-text-secondary">
          {userStore.searchTerm || Object.keys(userStore.filter).length > 0
            ? '検索条件を変更してください'
            : '利用者データがありません'}
        </p>
      </div>
    </div>
  {:else}
    <!-- User list -->
    <div class="flex-1 overflow-auto">
      <div class="divide-y:1|solid|care-gray-200">
        {#each userStore.paginatedUsers as user (user.id)}
          <div
            class="p:4 hover:bg:care-gray-50 cursor-pointer transition-colors {userStore.selectedUser?.id === user.id ? 'bg:care-primary-50 border-l:4|solid|care-primary-500' : ''}"
            onclick={() => handleUserClick(user)}
            data-testid="user-item-{user.id}"
            role="button"
            tabindex="0"
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleUserClick(user);
              }
            }}
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="flex items-center gap:3 mb:2">
                  <h3 class="text:lg font:medium text:care-text-primary">
                    {user.name}
                  </h3>
                  <span class="text:sm text:care-text-secondary">
                    ({user.nameKana})
                  </span>
                  <span class="px:2 py:1 bg:care-secondary-100 text:care-secondary-700 text:xs rounded:full">
                    要介護{user.careLevel}
                  </span>
                  {#if !user.isActive}
                    <span class="px:2 py:1 bg:care-gray-100 text:care-gray-700 text:xs rounded:full">
                      非アクティブ
                    </span>
                  {/if}
                </div>
                
                <div class="grid grid-cols:2 md:grid-cols:4 gap:4 text:sm text:care-text-secondary">
                  <div>
                    <span class="font:medium">年齢:</span>
                    {calculateAge(user.birthDate)}歳
                  </div>
                  <div>
                    <span class="font:medium">性別:</span>
                    {user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : 'その他'}
                  </div>
                  <div>
                    <span class="font:medium">入所日:</span>
                    {formatDate(user.admissionDate)}
                  </div>
                  <div>
                    <span class="font:medium">更新日:</span>
                    {formatDate(user.updatedAt)}
                  </div>
                </div>
                
                {#if user.medicalInfo.conditions.length > 0}
                  <div class="mt:2">
                    <span class="text:xs font:medium text:care-text-secondary">医療情報:</span>
                    <div class="flex flex-wrap gap:1 mt:1">
                      {#each user.medicalInfo.conditions.slice(0, 3) as condition}
                        <span class="px:2 py:0.5 bg:care-accent-warning-100 text:care-accent-warning-700 text:xs rounded">
                          {condition}
                        </span>
                      {/each}
                      {#if user.medicalInfo.conditions.length > 3}
                        <span class="text:xs text:care-text-secondary">
                          +{user.medicalInfo.conditions.length - 3}件
                        </span>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
              
              <div class="flex-shrink:0 ml:4">
                <svg class="w:5 h:5 text:care-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Pagination -->
    {#if userStore.totalPages > 1}
      <div class="flex-shrink:0 p:4 border-t:1|solid|care-gray-200 bg:care-background-primary">
        <div class="flex items-center justify-between">
          <div class="text:sm text:care-text-secondary">
            {((userStore.currentPage - 1) * userStore.itemsPerPage) + 1} - 
            {Math.min(userStore.currentPage * userStore.itemsPerPage, userStore.sortedUsers.length)} 件 / 
            {userStore.sortedUsers.length} 件中
          </div>
          
          <div class="flex items-center gap:1">
            <Button
              variant="outline"
              size="sm"
              disabled={userStore.currentPage === 1}
              onclick={() => handlePageChange(userStore.currentPage - 1)}
              data-testid="prev-page"
            >
              {#snippet children()}
                <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              {/snippet}
            </Button>
            
            {#each getPaginationPages(userStore.currentPage, userStore.totalPages) as page}
              {#if page === '...'}
                <span class="px:3 py:1 text:care-text-secondary">...</span>
              {:else}
                <Button
                  variant={userStore.currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  onclick={() => handlePageChange(page)}
                  data-testid="page-{page}"
                >
                  {#snippet children()}
                    {page}
                  {/snippet}
                </Button>
              {/if}
            {/each}
            
            <Button
              variant="outline"
              size="sm"
              disabled={userStore.currentPage === userStore.totalPages}
              onclick={() => handlePageChange(userStore.currentPage + 1)}
              data-testid="next-page"
            >
              {#snippet children()}
                <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              {/snippet}
            </Button>
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>