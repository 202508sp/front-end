<!--
  仮想化対応利用者リストコンポーネント
  大量データの効率的な表示を実現
-->
<script lang="ts">
  import type { User, UserFilter } from '$lib/types/user';
  import { userStore } from '$lib/stores/user.svelte';
  import VirtualList from '$lib/components/ui/VirtualList.svelte';
  import InfiniteScroll from '$lib/components/ui/InfiniteScroll.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import UserListItem from './UserListItem.svelte';
  import { createInfiniteScroll, createPagination } from '$lib/utils/pagination';
  import { onMount } from 'svelte';
  import Icon from '@iconify/svelte';

  interface Props {
    /** 表示モード */
    mode?: 'virtual' | 'infinite' | 'pagination';
    /** 仮想化時のアイテム高さ */
    itemHeight?: number;
    /** コンテナの高さ */
    containerHeight?: number;
    /** ユーザー選択時のコールバック */
    onUserSelect?: (user: User) => void;
    /** 初期ページサイズ */
    initialPageSize?: number;
    /** 追加読み込みサイズ */
    loadMoreSize?: number;
    /** クラス名 */
    class?: string;
    /** テストID */
    'data-testid'?: string;
  }

  let {
    mode = 'virtual',
    itemHeight = 120,
    containerHeight = 600,
    onUserSelect,
    initialPageSize = 50,
    loadMoreSize = 25,
    class: className = '',
    'data-testid': testId = 'virtualized-user-list'
  }: Props = $props();

  // フィルター状態
  let searchInput = $state('');
  let selectedCareLevel = $state<number[]>([]);
  let selectedGender = $state<('male' | 'female' | 'other')[]>([]);
  let selectedStatus = $state<('active' | 'inactive')[]>(['active']);
  let ageRangeMin = $state<number | undefined>();
  let ageRangeMax = $state<number | undefined>();
  let showFilters = $state(false);

  // 表示状態
  let currentPage = $state(1);
  let itemsPerPage = $state(initialPageSize);
  let loading = $state(false);
  let error = $state<Error | null>(null);

  // データ管理
  let filteredUsers = $state<User[]>([]);
  let displayUsers = $state<User[]>([]);
  let hasMore = $state(true);
  let totalItems = $state(0);

  // 無限スクロール管理
  let infiniteScrollManager: ReturnType<typeof createInfiniteScroll<User>> | null = null;

  // ページネーション管理
  let paginationManager: ReturnType<typeof createPagination<User>> | null = null;

  // フィルターオプション
  const careLevelOptions = [
    { value: 1, label: '要介護1' },
    { value: 2, label: '要介護2' },
    { value: 3, label: '要介護3' },
    { value: 4, label: '要介護4' },
    { value: 5, label: '要介護5' }
  ];

  const genderOptions = [
    { value: 'male' as const, label: '男性' },
    { value: 'female' as const, label: '女性' },
    { value: 'other' as const, label: 'その他' }
  ];

  const statusOptions = [
    { value: 'active' as const, label: 'アクティブ' },
    { value: 'inactive' as const, label: '非アクティブ' }
  ];

  // 初期化
  onMount(() => {
    initializeDataManager();
    loadInitialData();
  });

  // データマネージャーの初期化
  function initializeDataManager() {
    if (mode === 'infinite') {
      infiniteScrollManager = createInfiniteScroll(
        {
          initialPageSize,
          loadMorePageSize: loadMoreSize,
          prefetchThreshold: 10,
          maxCacheSize: 1000
        },
        loadUsersForInfiniteScroll
      );
    } else if (mode === 'pagination') {
      paginationManager = createPagination(
        {
          pageSize: itemsPerPage,
          currentPage: 1,
          totalItems: 0
        },
        loadUsersForPagination
      );
    }
  }

  // 初期データの読み込み
  async function loadInitialData() {
    try {
      loading = true;
      error = null;

      if (mode === 'infinite' && infiniteScrollManager) {
        displayUsers = await infiniteScrollManager.loadInitial();
      } else if (mode === 'pagination' && paginationManager) {
        const result = await paginationManager.getPage(1);
        displayUsers = result.items;
        totalItems = result.totalItems;
      } else {
        // 仮想化モード - 全データを読み込み
        await userStore.loadUsers();
        applyFilters();
      }
    } catch (err) {
      error = err as Error;
      console.error('Failed to load initial data:', err);
    } finally {
      loading = false;
    }
  }

  // 無限スクロール用のデータ読み込み
  async function loadUsersForInfiniteScroll(offset: number, limit: number) {
    // フィルターを適用してデータを取得
    const allUsers = await getUsersWithFilters();
    const items = allUsers.slice(offset, offset + limit);
    const hasMore = offset + limit < allUsers.length;

    return { items, hasMore };
  }

  // ページネーション用のデータ読み込み
  async function loadUsersForPagination(page: number, pageSize: number) {
    const allUsers = await getUsersWithFilters();
    const startIndex = (page - 1) * pageSize;
    const items = allUsers.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalItems: allUsers.length
    };
  }

  // フィルター適用済みユーザーデータを取得
  async function getUsersWithFilters(): Promise<User[]> {
    await userStore.loadUsers();
    
    let users = userStore.users;

    // 検索フィルター
    if (searchInput.trim()) {
      const searchTerm = searchInput.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm) ||
        user.nameKana.toLowerCase().includes(searchTerm) ||
        user.id.toLowerCase().includes(searchTerm)
      );
    }

    // 要介護度フィルター
    if (selectedCareLevel.length > 0) {
      users = users.filter(user => selectedCareLevel.includes(user.careLevel));
    }

    // 性別フィルター
    if (selectedGender.length > 0) {
      users = users.filter(user => selectedGender.includes(user.gender));
    }

    // ステータスフィルター
    if (selectedStatus.length > 0) {
      users = users.filter(user => 
        selectedStatus.includes(user.isActive ? 'active' : 'inactive')
      );
    }

    // 年齢フィルター
    if (ageRangeMin !== undefined || ageRangeMax !== undefined) {
      users = users.filter(user => {
        const age = calculateAge(user.birthDate);
        const min = ageRangeMin ?? 0;
        const max = ageRangeMax ?? 150;
        return age >= min && age <= max;
      });
    }

    return users;
  }

  // フィルター適用（仮想化モード用）
  async function applyFilters() {
    if (mode !== 'virtual') return;

    try {
      loading = true;
      filteredUsers = await getUsersWithFilters();
      displayUsers = filteredUsers;
      totalItems = filteredUsers.length;
    } catch (err) {
      error = err as Error;
    } finally {
      loading = false;
    }
  }

  // フィルター変更時の処理
  $effect(() => {
    if (mode === 'virtual') {
      applyFilters();
    } else {
      // 他のモードでは再読み込み
      reloadData();
    }
  });

  // データの再読み込み
  async function reloadData() {
    if (mode === 'infinite' && infiniteScrollManager) {
      infiniteScrollManager.reset();
      displayUsers = await infiniteScrollManager.loadInitial();
    } else if (mode === 'pagination' && paginationManager) {
      const result = await paginationManager.goToPage(1);
      displayUsers = result.items;
      totalItems = result.totalItems;
      currentPage = 1;
    }
  }

  // 無限スクロール用の追加読み込み
  async function handleLoadMore() {
    if (infiniteScrollManager) {
      displayUsers = await infiniteScrollManager.loadMore();
      const state = infiniteScrollManager.getState();
      hasMore = state.hasMore;
    }
  }

  // ページネーション用のページ変更
  async function handlePageChange(page: number) {
    if (paginationManager) {
      const result = await paginationManager.goToPage(page);
      displayUsers = result.items;
      currentPage = page;
    }
  }

  // ページサイズ変更
  async function handlePageSizeChange(newPageSize: number) {
    itemsPerPage = newPageSize;
    
    if (paginationManager) {
      const result = await paginationManager.changePageSize(newPageSize);
      displayUsers = result.items;
      currentPage = result.currentPage;
      totalItems = result.totalItems;
    }
  }

  // ユーザー選択
  function handleUserSelect(user: User) {
    userStore.selectUser(user);
    onUserSelect?.(user);
  }

  // フィルターのクリア
  function clearFilters() {
    searchInput = '';
    selectedCareLevel = [];
    selectedGender = [];
    selectedStatus = ['active'];
    ageRangeMin = undefined;
    ageRangeMax = undefined;
  }

  // フィルター配列のトグル
  function toggleFilter<T>(array: T[], value: T): T[] {
    const index = array.indexOf(value);
    if (index === -1) {
      return [...array, value];
    } else {
      return array.filter(item => item !== value);
    }
  }

  // 年齢計算
  function calculateAge(birthDate: Date): number {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    
    return age;
  }
</script>

<div class="virtualized-user-list h:full flex flex:col {className}" data-testid={testId}>
  <!-- ヘッダー -->
  <div class="header flex-shrink:0 p:16px border-b:1|solid|gray-200 bg:white">
    <div class="flex items:center justify:between mb:16px">
      <h2 class="text:xl font:semibold text:gray-800">
        利用者一覧
        <span class="text:sm font:normal text:gray-600 ml:8px">
          ({totalItems}件)
        </span>
      </h2>
      
      <div class="flex items:center gap:8px">
        <Button
          variant="outline"
          size="sm"
          onclick={() => showFilters = !showFilters}
        >
          <Icon icon="material-symbols:filter-list" class="w:16px h:16px mr:4px" />
          フィルタ
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onclick={clearFilters}
        >
          クリア
        </Button>
      </div>
    </div>

    <!-- 検索 -->
    <div class="mb:16px">
      <FormField label="検索">
        <Input
          type="search"
          bind:value={searchInput}
          placeholder="名前、フリガナ、IDで検索..."
        />
      </FormField>
    </div>

    <!-- フィルター -->
    {#if showFilters}
      <div class="filters grid grid-cols:1 md:grid-cols:2 lg:grid-cols:4 gap:16px p:16px bg:gray-50 r:8px">
        <!-- 要介護度フィルター -->
        <fieldset>
          <legend class="block text:sm font:medium text:gray-700 mb:8px">要介護度</legend>
          <div class="space-y:4px">
            {#each careLevelOptions as option}
              <label class="flex items:center">
                <input
                  type="checkbox"
                  checked={selectedCareLevel.includes(option.value)}
                  onchange={() => selectedCareLevel = toggleFilter(selectedCareLevel, option.value)}
                  class="mr:8px"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- 性別フィルター -->
        <fieldset>
          <legend class="block text:sm font:medium text:gray-700 mb:8px">性別</legend>
          <div class="space-y:4px">
            {#each genderOptions as option}
              <label class="flex items:center">
                <input
                  type="checkbox"
                  checked={selectedGender.includes(option.value)}
                  onchange={() => selectedGender = toggleFilter(selectedGender, option.value)}
                  class="mr:8px"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- ステータスフィルター -->
        <fieldset>
          <legend class="block text:sm font:medium text:gray-700 mb:8px">ステータス</legend>
          <div class="space-y:4px">
            {#each statusOptions as option}
              <label class="flex items:center">
                <input
                  type="checkbox"
                  checked={selectedStatus.includes(option.value)}
                  onchange={() => selectedStatus = toggleFilter(selectedStatus, option.value)}
                  class="mr:8px"
                />
                <span class="text:sm">{option.label}</span>
              </label>
            {/each}
          </div>
        </fieldset>

        <!-- 年齢範囲フィルター -->
        <fieldset>
          <legend class="block text:sm font:medium text:gray-700 mb:8px">年齢範囲</legend>
          <div class="flex items:center gap:8px">
            <Input
              type="number"
              bind:value={ageRangeMin}
              placeholder="最小"
              size="sm"
              min={0}
              max={150}
            />
            <span class="text:sm text:gray-500">〜</span>
            <Input
              type="number"
              bind:value={ageRangeMax}
              placeholder="最大"
              size="sm"
              min={0}
              max={150}
            />
          </div>
        </fieldset>
      </div>
    {/if}
  </div>

  <!-- コンテンツ -->
  <div class="content flex-1 overflow:hidden">
    {#if loading}
      <!-- ローディング状態 -->
      <div class="loading flex items:center justify:center h:full">
        <div class="text:center">
          <Icon icon="material-symbols:progress-activity" class="w:32px h:32px text:blue-500 animate:spin mb:12px" />
          <p class="text:gray-600">読み込み中...</p>
        </div>
      </div>
    {:else if error}
      <!-- エラー状態 -->
      <div class="error flex items:center justify:center h:full">
        <div class="text:center">
          <Icon icon="material-symbols:error-outline" class="w:32px h:32px text:red-500 mb:12px" />
          <p class="text:red-600 mb:16px">{error.message}</p>
          <Button onclick={loadInitialData}>再試行</Button>
        </div>
      </div>
    {:else if displayUsers.length === 0}
      <!-- 空の状態 -->
      <div class="empty flex items:center justify:center h:full">
        <div class="text:center">
          <Icon icon="material-symbols:inbox-outline" class="w:48px h:48px text:gray-400 mb:16px" />
          <h3 class="text:lg font:medium text:gray-700 mb:8px">利用者が見つかりません</h3>
          <p class="text:gray-500">検索条件を変更してください</p>
        </div>
      </div>
    {:else}
      <!-- データ表示 -->
      {#if mode === 'virtual'}
        <VirtualList
          items={displayUsers}
          {itemHeight}
          {containerHeight}
          getItemKey={(user) => user.id}
        >
          {#snippet itemComponent({ item, index })}
            <UserListItem user={item} {index} onSelect={handleUserSelect} />
          {/snippet}
        </VirtualList>
      {:else if mode === 'infinite'}
        <InfiniteScroll
          items={displayUsers}
          onLoadMore={handleLoadMore}
          {loading}
          {hasMore}
          getItemKey={(user) => user.id}
        >
          {#snippet itemComponent({ item, index })}
            <UserListItem user={item} {index} onSelect={handleUserSelect} />
          {/snippet}
        </InfiniteScroll>
      {:else}
        <!-- 通常のリスト表示 -->
        <div class="list overflow-y:auto h:full">
          {#each displayUsers as user (user.id)}
            <UserListItem {user} onSelect={handleUserSelect} />
          {/each}
        </div>
      {/if}
    {/if}
  </div>

  <!-- ページネーション -->
  {#if mode === 'pagination' && !loading && displayUsers.length > 0}
    <div class="pagination flex-shrink:0 border-t:1|solid|gray-200 bg:white">
      <Pagination
        {currentPage}
        {itemsPerPage}
        {totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[25, 50, 100, 200]}
      />
    </div>
  {/if}
</div>

<style>
  .virtualized-user-list {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .animate\:spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>