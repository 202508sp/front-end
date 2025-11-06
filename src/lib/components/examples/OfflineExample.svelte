<!--
  オフライン機能のデモンストレーション用コンポーネント
-->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { dataService } from '../../services/data.js';
  import { offlineStorageService } from '../../services/offline.js';
  import type { User } from '../../types/user.js';
  import type { DataServiceState } from '../../services/data.js';
  import type { OfflineCacheState } from '../../services/offline.js';

  let users: User[] = $state([]);
  let dataState: DataServiceState = $state({
    isOnline: true,
    isInitialized: false,
    lastSyncTime: null,
    pendingChanges: 0,
    syncErrors: 0
  });
  let cacheState: OfflineCacheState = $state({
    isOffline: false,
    lastSyncTime: null,
    pendingChanges: 0,
    cacheSize: 0,
    cacheVersion: '1.0.0'
  });

  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // クリーンアップ関数
  let unsubscribeDataState: (() => void) | null = null;
  let unsubscribeCacheState: (() => void) | null = null;
  let unsubscribeUsers: (() => void) | null = null;

  onMount(() => {
    // データサービス状態の監視
    unsubscribeDataState = dataService.onStateChange((state) => {
      dataState = state;
    });

    // キャッシュ状態の監視
    unsubscribeCacheState = offlineStorageService.onCacheStateChange((state) => {
      cacheState = state;
    });

    // 利用者データの監視
    unsubscribeUsers = dataService.subscribeToUsers((updatedUsers) => {
      users = updatedUsers;
    });

    // 初期データの読み込み
    loadUsers();
  });

  onDestroy(() => {
    unsubscribeDataState?.();
    unsubscribeCacheState?.();
    unsubscribeUsers?.();
  });

  async function loadUsers() {
    isLoading = true;
    error = null;
    
    try {
      users = await dataService.getUsers();
    } catch (err: any) {
      error = err.message;
      console.error('Failed to load users:', err);
    } finally {
      isLoading = false;
    }
  }

  async function createTestUser() {
    isLoading = true;
    error = null;

    try {
      const testUser = {
        name: `テストユーザー ${Date.now()}`,
        nameKana: 'テストユーザー',
        birthDate: new Date('1950-01-01'),
        gender: 'male' as const,
        address: {
          postalCode: '123-4567',
          prefecture: '東京都',
          city: '渋谷区',
          street: 'テスト町1-1-1'
        },
        emergencyContact: {
          name: '緊急連絡先',
          relationship: '家族',
          phone: '090-1234-5678'
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

      await dataService.createUser(testUser);
      await loadUsers(); // リストを更新
    } catch (err: any) {
      error = err.message;
      console.error('Failed to create user:', err);
    } finally {
      isLoading = false;
    }
  }

  async function forceSync() {
    isLoading = true;
    error = null;

    try {
      await dataService.forceSync();
      await loadUsers();
    } catch (err: any) {
      error = err.message;
      console.error('Failed to sync:', err);
    } finally {
      isLoading = false;
    }
  }

  function clearCache() {
    dataService.clearCache();
    users = [];
  }

  function getStatusColor(isOnline: boolean): string {
    return isOnline ? 'text:green-600' : 'text:red-600';
  }

  function formatDate(date: Date | null): string {
    if (!date) return '未同期';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }
</script>

<div class="p:24px max-w:800px mx:auto">
  <h1 class="text:24px font:bold mb:24px">オフライン機能デモ</h1>

  <!-- 状態表示 -->
  <div class="grid grid-cols:1 md:grid-cols:2 gap:16px mb:24px">
    <!-- データサービス状態 -->
    <div class="bg:white p:16px rounded:8px shadow:sm border:1px|solid|gray-200">
      <h2 class="text:16px font:semibold mb:12px">データサービス状態</h2>
      <div class="space-y:8px text:14px">
        <div class="flex justify:between">
          <span>オンライン状態:</span>
          <span class={getStatusColor(dataState.isOnline)}>
            {dataState.isOnline ? 'オンライン' : 'オフライン'}
          </span>
        </div>
        <div class="flex justify:between">
          <span>初期化済み:</span>
          <span>{dataState.isInitialized ? 'はい' : 'いいえ'}</span>
        </div>
        <div class="flex justify:between">
          <span>保留中の変更:</span>
          <span class={dataState.pendingChanges > 0 ? 'text:orange-600' : 'text:gray-600'}>
            {dataState.pendingChanges}件
          </span>
        </div>
        <div class="flex justify:between">
          <span>同期エラー:</span>
          <span class={dataState.syncErrors > 0 ? 'text:red-600' : 'text:gray-600'}>
            {dataState.syncErrors}件
          </span>
        </div>
        <div class="flex justify:between">
          <span>最終同期:</span>
          <span class="text:gray-600 text:12px">
            {formatDate(dataState.lastSyncTime)}
          </span>
        </div>
      </div>
    </div>

    <!-- キャッシュ状態 -->
    <div class="bg:white p:16px rounded:8px shadow:sm border:1px|solid|gray-200">
      <h2 class="text:16px font:semibold mb:12px">キャッシュ状態</h2>
      <div class="space-y:8px text:14px">
        <div class="flex justify:between">
          <span>キャッシュサイズ:</span>
          <span>{cacheState.cacheSize} MB</span>
        </div>
        <div class="flex justify:between">
          <span>保留中の変更:</span>
          <span class={cacheState.pendingChanges > 0 ? 'text:orange-600' : 'text:gray-600'}>
            {cacheState.pendingChanges}件
          </span>
        </div>
        <div class="flex justify:between">
          <span>キャッシュバージョン:</span>
          <span class="text:gray-600">{cacheState.cacheVersion}</span>
        </div>
        <div class="flex justify:between">
          <span>最終キャッシュ更新:</span>
          <span class="text:gray-600 text:12px">
            {formatDate(cacheState.lastSyncTime)}
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- 操作ボタン -->
  <div class="flex flex-wrap gap:12px mb:24px">
    <button
      onclick={loadUsers}
      disabled={isLoading}
      class="px:16px py:8px bg:blue-600 text:white rounded:6px hover:bg:blue-700 disabled:opacity:50 disabled:cursor:not-allowed"
    >
      {isLoading ? '読み込み中...' : 'データ再読み込み'}
    </button>

    <button
      onclick={createTestUser}
      disabled={isLoading}
      class="px:16px py:8px bg:green-600 text:white rounded:6px hover:bg:green-700 disabled:opacity:50 disabled:cursor:not-allowed"
    >
      テストユーザー作成
    </button>

    <button
      onclick={forceSync}
      disabled={isLoading || !dataState.isOnline}
      class="px:16px py:8px bg:purple-600 text:white rounded:6px hover:bg:purple-700 disabled:opacity:50 disabled:cursor:not-allowed"
    >
      強制同期
    </button>

    <button
      onclick={clearCache}
      disabled={isLoading}
      class="px:16px py:8px bg:red-600 text:white rounded:6px hover:bg:red-700 disabled:opacity:50 disabled:cursor:not-allowed"
    >
      キャッシュクリア
    </button>
  </div>

  <!-- エラー表示 -->
  {#if error}
    <div class="bg:red-50 border:1px|solid|red-200 text:red-700 px:16px py:12px rounded:6px mb:24px">
      <strong>エラー:</strong> {error}
    </div>
  {/if}

  <!-- 利用者一覧 -->
  <div class="bg:white rounded:8px shadow:sm border:1px|solid|gray-200">
    <div class="px:16px py:12px border-b:1px|solid|gray-200">
      <h2 class="text:16px font:semibold">利用者一覧 ({users.length}件)</h2>
    </div>
    
    <div class="p:16px">
      {#if isLoading}
        <div class="text:center py:24px text:gray-500">
          読み込み中...
        </div>
      {:else if users.length === 0}
        <div class="text:center py:24px text:gray-500">
          利用者データがありません
        </div>
      {:else}
        <div class="space-y:8px">
          {#each users as user (user.id)}
            <div class="flex justify:between items:center p:12px bg:gray-50 rounded:6px">
              <div>
                <div class="font:medium">{user.name}</div>
                <div class="text:14px text:gray-600">{user.nameKana}</div>
              </div>
              <div class="text:14px text:gray-500">
                要介護度: {user.careLevel}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- 使用方法 -->
  <div class="mt:32px bg:blue-50 border:1px|solid|blue-200 rounded:8px p:16px">
    <h3 class="text:16px font:semibold mb:12px text:blue-800">オフライン機能の使用方法</h3>
    <ol class="list-decimal list-inside space-y:4px text:14px text:blue-700">
      <li>ブラウザの開発者ツールでネットワークを無効にしてオフライン状態をシミュレート</li>
      <li>オフライン時でもキャッシュされたデータが表示される</li>
      <li>オフライン時にテストユーザーを作成すると「保留中の変更」として記録される</li>
      <li>ネットワークを有効にすると自動的に同期が実行される</li>
      <li>「強制同期」ボタンで手動同期も可能</li>
    </ol>
  </div>
</div>