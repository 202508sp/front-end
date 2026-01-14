<script lang="ts">
  import type { Staff, StaffFilter, StaffSortOption, StaffRole } from '$lib/types/staff';
  import { staffStore } from '$lib/stores/staff.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { onMount } from 'svelte';
  import { formatDate } from '$lib/utils';
  import { makeUniversalDraggable, makeUniversalDropZone } from '$lib/utils/dragdrop.js';
  import type { DragData, DropZone } from '$lib/utils/dragdrop.js';

  interface Props {
    onStaffSelect?: (staff: Staff) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    onStaffSelect,
    class: className = '',
    'data-testid': testId = 'staff-list'
  }: Props = $props();

  // Local state for filters
  let searchInput = $state('');
  let selectedRoles = $state<StaffRole[]>([]);
  let selectedDepartments = $state<string[]>([]);
  let selectedStatus = $state<('active' | 'inactive')[]>(['active']);
  let showFilters = $state(false);

  // Sort options
  const sortOptions: { value: keyof Staff; label: string }[] = [
    { value: 'name', label: '名前' },
    { value: 'nameKana', label: 'フリガナ' },
    { value: 'role', label: '役職' },
    { value: 'department', label: '部署' },
    { value: 'hireDate', label: '入社日' },
    { value: 'updatedAt', label: '更新日' }
  ];

  // Role options
  const roleOptions: { value: StaffRole; label: string }[] = [
    { value: 'admin', label: '管理者' },
    { value: 'manager', label: 'マネージャー' },
    { value: 'caregiver', label: '介護士' },
    { value: 'nurse', label: '看護師' },
    { value: 'therapist', label: 'セラピスト' },
    { value: 'support', label: 'サポート' }
  ];

  // Department options (derived from current staff data)
  const departmentOptions = $derived.by(() => {
    const departments = new Set(staffStore.staff.map(s => s.department));
    return Array.from(departments).map(dept => ({ value: dept, label: dept }));
  });

  // Status options
  const statusOptions = [
    { value: 'active' as const, label: 'アクティブ' },
    { value: 'inactive' as const, label: '非アクティブ' }
  ];

  // Items per page options
  const itemsPerPageOptions = [10, 20, 50, 100];

  // Load staff on mount
  onMount(() => {
    staffStore.loadStaff();
  });

  // Apply search filter
  $effect(() => {
    staffStore.setSearchTerm(searchInput);
  });

  // Apply other filters
  $effect(() => {
    const filter: StaffFilter = {};
    
    if (selectedRoles.length > 0) {
      filter.role = selectedRoles;
    }
    
    if (selectedDepartments.length > 0) {
      filter.department = selectedDepartments;
    }
    
    if (selectedStatus.length > 0) {
      filter.isActive = selectedStatus.includes('active');
    }
    
    staffStore.setFilter(filter);
  });

  // Handle staff selection
  function handleStaffClick(staff: Staff) {
    staffStore.selectStaff(staff);
    onStaffSelect?.(staff);
  }

  function isFavoriteStaff(staffId: string): boolean {
    return staffStore.favoriteStaffIds.includes(staffId);
  }

  function favoriteStaffDraggable(element: HTMLElement, params: { staffId: string }) {
    let cleanup: (() => void) | null = null;

    function setup(p: { staffId: string }) {
      cleanup?.();

      const dragData: DragData = {
        id: p.staffId,
        type: 'favorite-staff',
        data: { staffId: p.staffId }
      };

      cleanup = makeUniversalDraggable(element, dragData, {
        dragOptions: {
          ghostOpacity: 0.5
        },
        touchOptions: {
          threshold: 10,
          ghostElement: true
        }
      });
    }

    setup(params);

    return {
      update: setup,
      destroy: () => cleanup?.()
    };
  }

  function favoriteStaffDropZone(element: HTMLElement, params: { targetStaffId: string }) {
    let cleanup: (() => void) | null = null;

    function setup(p: { targetStaffId: string }) {
      cleanup?.();

      const zone: DropZone = {
        id: `favorite-staff-${p.targetStaffId}`,
        element,
        accepts: ['favorite-staff'],
        onDrop: (data, position) => {
          const insertAfter = position.y > element.getBoundingClientRect().height / 2;
          staffStore.moveFavoriteStaff(data.id, p.targetStaffId, insertAfter);
        }
      };

      cleanup = makeUniversalDropZone(element, zone, {
        dragOverClass: 'drag-over',
        dragActiveClass: 'drag-active',
        dropValidClass: 'drop-valid',
        dropInvalidClass: 'drop-invalid'
      });
    }

    setup(params);

    return {
      update: setup,
      destroy: () => cleanup?.()
    };
  }

  // Handle sort change
  function handleSortChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const [field, direction] = target.value.split('-') as [keyof Staff, 'asc' | 'desc'];
    staffStore.setSortOption({ field, direction });
  }

  // Handle page change
  function handlePageChange(page: number) {
    staffStore.setPage(page);
  }

  // Handle items per page change
  function handleItemsPerPageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    staffStore.setItemsPerPage(parseInt(target.value));
  }

  // Clear all filters
  function clearFilters() {
    searchInput = '';
    selectedRoles = [];
    selectedDepartments = [];
    selectedStatus = ['active'];
    staffStore.clearFilter();
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

  // Get role label
  function getRoleLabel(role: StaffRole): string {
    const option = roleOptions.find(opt => opt.value === role);
    return option?.label || role;
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

<div class="flex flex:column h:full {className}" data-testid={testId}>
  <!-- Header with search and controls -->
  <div class="flex-shrink:0 p:4 border-b:1|solid|care-gray-200 bg:care-background-primary">
    <div class="flex ai:center jc:space-betwrrn mb:4">
      <h2 class="text:xl font:semibold text:care-text-primary">
        職員一覧
        <span class="text:sm font:normal text:care-text-secondary ml:2">
          ({staffStore.sortedStaff.length}件)
        </span>
      </h2>
      
      <div class="flex ai:center gap:2">
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
            placeholder="名前、フリガナ、メールアドレスで検索..."
            data-testid="search-input"
          />
        {/snippet}
      </FormField>
    </div>

    <!-- Filters -->
    {#if showFilters}
      <div class="grid grid-cols:1 md:grid-cols:2 lg:grid-cols:4 gap:4 p:4 bg:care-gray-50 r:24px">
        <!-- Role Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">役職</legend>
          <div class="space-y:1">
            {#each roleOptions as option}
              <label class="flex ai:center">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(option.value)}
                  onchange={() => selectedRoles = toggleFilter(selectedRoles, option.value)}
                  class="mr:2"
                  data-testid="role-{option.value}"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- Department Filter -->
        <fieldset>
          <legend class="block text:sm font:medium text:care-text-primary mb:2">部署</legend>
          <div class="space-y:1">
            {#each departmentOptions as option}
              <label class="flex ai:center">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(option.value)}
                  onchange={() => selectedDepartments = toggleFilter(selectedDepartments, option.value)}
                  class="mr:2"
                  data-testid="department-{option.value}"
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
              <label class="flex ai:center">
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
      </div>
    {/if}

    <!-- Sort and Items per page -->
    <div class="flex ai:center jc:space-betwrrn mt:4">
      <div class="flex ai:center gap:4">
        <div class="flex ai:center gap:2">
          <label for="sort-select" class="text:sm font:medium text:care-text-primary">並び順:</label>
          <select
            id="sort-select"
            onchange={handleSortChange}
            class="px:3 py:1 border:1|solid|care-gray-300 r:16px text:sm"
            data-testid="sort-select"
          >
            {#each sortOptions as option}
              <option value="{option.value}-asc">{option.label} (昇順)</option>
              <option value="{option.value}-desc">{option.label} (降順)</option>
            {/each}
          </select>
        </div>

        <div class="flex ai:center gap:2">
          <label for="items-per-page-select" class="text:sm font:medium text:care-text-primary">表示件数:</label>
          <select
            id="items-per-page-select"
            value={staffStore.itemsPerPage}
            onchange={handleItemsPerPageChange}
            class="px:3 py:1 border:1|solid|care-gray-300 r:16px text:sm"
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
  {#if staffStore.isLoading}
    <div class="flex-1 flex ai:center jc:center">
      <div class="text:center">
        <svg class="animate:spin h:8 w:8 text:care-primary-600 mx:auto mb:2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text:care-text-secondary">読み込み中...</p>
      </div>
    </div>
  {:else if staffStore.error}
    <!-- Error state -->
    <div class="flex-1 flex ai:center jc:center">
      <div class="text:center">
        <svg class="h:8 w:8 text:care-accent-error-500 mx:auto mb:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p class="text:care-accent-error-600 mb:2">{staffStore.error}</p>
        <Button
          variant="outline"
          size="sm"
          onclick={() => staffStore.loadStaff()}
        >
          {#snippet children()}
            再試行
          {/snippet}
        </Button>
      </div>
    </div>
  {:else if staffStore.favoriteStaff.length === 0 && staffStore.paginatedNonFavoriteStaff.length === 0}
    <!-- Empty state -->
    <div class="flex-1 flex ai:center jc:center">
      <div class="text:center">
        <svg class="h:12 w:12 text:care-gray-400 mx:auto mb:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 class="text:lg font:medium text:care-text-primary mb:2">職員が見つかりません</h3>
        <p class="text:care-text-secondary">
          {staffStore.searchTerm || Object.keys(staffStore.filter).length > 0
            ? '検索条件を変更してください'
            : '職員データがありません'}
        </p>
      </div>
    </div>
  {:else}
    <!-- Staff list -->
    <div class="flex-1 overflow-auto">
      <div class="p:4">
        {#if staffStore.favoriteStaff.length > 0}
          <div class="p:4 mb:4 bg:care-gray-50 r:24px border:1|solid|care-gray-200">
            <div class="flex ai:center jc:space-between mb:3">
              <div class="flex ai:center gap:2">
                <svg class="w:4 h:4 text:care-text-secondary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <h3 class="text:sm font:medium text:care-text-primary">お気に入り</h3>
                <span class="text:xs text:care-text-secondary">({staffStore.favoriteStaff.length})</span>
              </div>
              <span class="text:xs text:care-text-secondary">ドラッグで並び替え</span>
            </div>

            <div class="divide-y:1|solid|care-gray-200">
              {#each staffStore.favoriteStaff as staff (staff.id)}
                <div
                  use:favoriteStaffDropZone={{ targetStaffId: staff.id }}
                  class="p:4 hover:bg:care-gray-50 cursor-pointer transition-colors"
                  onclick={() => handleStaffClick(staff)}
                  data-testid="staff-favorite-item-{staff.id}"
                  role="button"
                  tabindex="0"
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStaffClick(staff);
                    }
                  }}
                >
                  <div class="flex ai:center jc:space-betwrrn">
                    <div class="flex-1">
                      <div class="flex ai:center gap:2 mb:2">
                        <span
                          use:favoriteStaffDraggable={{ staffId: staff.id }}
                          class="w:5 h:5 ai:center jc:center flex cursor:grab"
                          aria-label="drag"
                          title="ドラッグで並び替え"
                        >
                          <svg class="w:4 h:4 text:care-text-secondary" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M10 4H8v2h2V4zm6 0h-2v2h2V4zM10 9H8v2h2V9zm6 0h-2v2h2V9zM10 14H8v2h2v-2zm6 0h-2v2h2v-2zM10 19H8v2h2v-2zm6 0h-2v2h2v-2z" />
                          </svg>
                        </span>
                        <h3 class="text:lg font:medium text:care-text-primary">{staff.name}</h3>
                        <span class="text:sm text:care-text-secondary">({staff.nameKana})</span>
                        <span class="px:2 py:1 bg:care-secondary-100 text:care-secondary-700 text:xs r:9999px">{getRoleLabel(staff.role)}</span>
                        {#if !staff.isActive}
                          <span class="px:2 py:1 bg:care-gray-100 text:care-gray-700 text:xs r:9999px">非アクティブ</span>
                        {/if}
                      </div>

                      <div class="grid grid-cols:2 md:grid-cols:4 gap:4 text:sm text:care-text-secondary">
                        <div><span class="font:medium">部署:</span> {staff.department}</div>
                        <div><span class="font:medium">メール:</span> {staff.email}</div>
                        <div><span class="font:medium">入社日:</span> {formatDate(staff.hireDate)}</div>
                        <div><span class="font:medium">更新日:</span> {formatDate(staff.updatedAt)}</div>
                      </div>
                    </div>

                    <div class="flex ai:center gap:2 ml:4">
                      <button
                        onclick={(e) => {
                          e.stopPropagation();
                          staffStore.toggleFavoriteStaff(staff.id);
                        }}
                        class="p:2 hover:bg:care-primary-100 r:9999px"
                        title="お気に入り解除"
                        aria-label="favorite"
                        data-testid="favorite-toggle-{staff.id}"
                      >
                        <svg class="w:5 h:5 text:care-primary-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      </button>
                      <svg class="w:5 h:5 text:care-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="divide-y:1|solid|care-gray-200">
        {#each staffStore.paginatedNonFavoriteStaff as staff (staff.id)}
          <div
            class="p:4 hover:bg:care-gray-50 cursor-pointer transition-colors {staffStore.selectedStaff?.id === staff.id ? 'bg:care-primary-50 border-l:4|solid|care-primary-500' : ''}"
            onclick={() => handleStaffClick(staff)}
            data-testid="staff-item-{staff.id}"
            role="button"
            tabindex="0"
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleStaffClick(staff);
              }
            }}
          >
            <div class="flex ai:center jc:space-betwrrn">
              <div class="flex-1">
                <div class="flex ai:center gap:3 mb:2">
                  <h3 class="text:lg font:medium text:care-text-primary">
                    {staff.name}
                  </h3>
                  <span class="text:sm text:care-text-secondary">
                    ({staff.nameKana})
                  </span>
                  <span class="px:2 py:1 bg:care-secondary-100 text:care-secondary-700 text:xs r:9999px">
                    {getRoleLabel(staff.role)}
                  </span>
                  {#if !staff.isActive}
                    <span class="px:2 py:1 bg:care-gray-100 text:care-gray-700 text:xs r:9999px">
                      非アクティブ
                    </span>
                  {/if}
                </div>
                
                <div class="grid grid-cols:2 md:grid-cols:4 gap:4 text:sm text:care-text-secondary">
                  <div>
                    <span class="font:medium">部署:</span>
                    {staff.department}
                  </div>
                  <div>
                    <span class="font:medium">メール:</span>
                    {staff.email}
                  </div>
                  <div>
                    <span class="font:medium">入社日:</span>
                    {formatDate(staff.hireDate)}
                  </div>
                  <div>
                    <span class="font:medium">更新日:</span>
                    {formatDate(staff.updatedAt)}
                  </div>
                </div>
                
                {#if staff.qualifications.length > 0}
                  <div class="mt:2">
                    <span class="text:xs font:medium text:care-text-secondary">資格:</span>
                    <div class="flex flex-wrap gap:1 mt:1">
                      {#each staff.qualifications.slice(0, 3) as qualification}
                        <span class="px:2 py:0.5 bg:care-accent-success-100 text:care-accent-success-700 text:xs rounded">
                          {qualification.name}
                        </span>
                      {/each}
                      {#if staff.qualifications.length > 3}
                        <span class="text:xs text:care-text-secondary">
                          +{staff.qualifications.length - 3}件
                        </span>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
              
              <div class="flex ai:center gap:2 ml:4">
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    staffStore.toggleFavoriteStaff(staff.id);
                  }}
                  class="p:2 hover:bg:care-primary-100 r:9999px"
                  title={isFavoriteStaff(staff.id) ? 'お気に入り解除' : 'お気に入りに追加'}
                  aria-label="favorite"
                  data-testid="favorite-toggle-{staff.id}"
                >
                  {#if isFavoriteStaff(staff.id)}
                    <svg class="w:5 h:5 text:care-primary-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  {:else}
                    <svg class="w:5 h:5 text:care-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.617 4.98a1 1 0 00.95.69h5.234c.969 0 1.371 1.24.588 1.81l-4.236 3.078a1 1 0 00-.364 1.118l1.618 4.98c.3.922-.755 1.688-1.54 1.118l-4.236-3.078a1 1 0 00-1.176 0l-4.236 3.078c-.784.57-1.838-.196-1.539-1.118l1.618-4.98a1 1 0 00-.364-1.118L2.98 10.407c-.783-.57-.38-1.81.588-1.81h5.234a1 1 0 00.95-.69l1.617-4.98z" />
                    </svg>
                  {/if}
                </button>
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
    {#if staffStore.nonFavoriteTotalPages > 1}
      <div class="flex-shrink:0 p:4 border-t:1|solid|care-gray-200 bg:care-background-primary">
        <div class="flex ai:center jc:space-betwrrn">
          <div class="text:sm text:care-text-secondary">
            {((staffStore.currentPage - 1) * staffStore.itemsPerPage) + 1} - 
            {Math.min(staffStore.currentPage * staffStore.itemsPerPage, staffStore.nonFavoriteStaff.length)} 件 / 
            {staffStore.nonFavoriteStaff.length} 件中
          </div>
          
          <div class="flex ai:center gap:1">
            <Button
              variant="outline"
              size="sm"
              disabled={staffStore.currentPage === 1}
              onclick={() => handlePageChange(staffStore.currentPage - 1)}
              data-testid="prev-page"
            >
              {#snippet children()}
                <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              {/snippet}
            </Button>

				{#each getPaginationPages(staffStore.currentPage, staffStore.nonFavoriteTotalPages) as page}
					{#if page === '...'}
						<span class="px:3 py:1 text:care-text-secondary">...</span>
					{:else}
						<Button
							variant={staffStore.currentPage === page ? 'primary' : 'outline'}
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
					disabled={staffStore.currentPage === staffStore.nonFavoriteTotalPages}
					onclick={() => handlePageChange(staffStore.currentPage + 1)}
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