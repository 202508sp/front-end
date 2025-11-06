<!--
  遅延読み込みコンポーネントラッパー
  コンポーネントの動的読み込みとローディング状態を管理
-->
<script lang="ts">
  import type { Component } from 'svelte';
  import { lazyLoader } from '$lib/utils/lazy';
  import Icon from '@iconify/svelte';

  interface Props {
    /** 遅延読み込み関数 */
    loader: () => Promise<any>;
    /** キャッシュキー */
    key: string;
    /** コンポーネントに渡すプロパティ */
    props?: Record<string, any>;
    /** ローディング中の表示内容 */
    loadingText?: string;
    /** エラー時の表示内容 */
    errorText?: string;
    /** 最小ローディング時間（ms） */
    minLoadingTime?: number;
    /** 遅延読み込みを開始するかどうか */
    shouldLoad?: boolean;
  }

  let {
    loader,
    key,
    props = {},
    loadingText = '読み込み中...',
    errorText = '読み込みに失敗しました',
    minLoadingTime = 200,
    shouldLoad = true
  }: Props = $props();

  let component: Component | null = $state(null);
  let loading = $state(false);
  let error: Error | null = $state(null);
  let startTime = 0;

  // 遅延読み込みの実行
  async function loadComponent() {
    if (!shouldLoad || component || loading) {
      return;
    }

    loading = true;
    error = null;
    startTime = Date.now();

    try {
      const loadedModule = await loader();
      
      // 最小ローディング時間を確保
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsed));
      }
      
      component = loadedModule.default;
    } catch (err) {
      error = err as Error;
      console.error(`Failed to load component ${key}:`, err);
    } finally {
      loading = false;
    }
  }

  // 再試行
  function retry() {
    lazyLoader.clearCache(key);
    component = null;
    error = null;
    loadComponent();
  }

  // shouldLoadが変更されたときに読み込みを開始
  $effect(() => {
    if (shouldLoad) {
      loadComponent();
    }
  });
</script>

{#if loading}
  <!-- ローディング状態 -->
  <div class="lazy-loading ai:center jc:center p:24px flex flex:col">
    <div class="loading-spinner mb:12px">
      <Icon 
        icon="material-symbols:progress-activity" 
        class="w:32px h:32px text:blue-500 animate:spin"
      />
    </div>
    <p class="text:sm text:gray-600">{loadingText}</p>
  </div>
{:else if error}
  <!-- エラー状態 -->
  <div class="lazy-error ai:center jc:center p:24px flex flex:col">
    <div class="error-icon mb:12px">
      <Icon 
        icon="material-symbols:error-outline" 
        class="w:32px h:32px text:red-500"
      />
    </div>
    <p class="text:sm text:red-600 mb:16px text:center">{errorText}</p>
    <button 
      onclick={retry}
      class="px:16px py:8px bg:red-500 text:white r:6px hover:bg:red-600 transition:colors cursor:pointer"
    >
      再試行
    </button>
  </div>
{:else if component}
  <!-- 読み込み完了 -->
  <component {...props} />
{:else if !shouldLoad}
  <!-- 読み込み待機状態 -->
  <div class="lazy-waiting ai:center jc:center p:24px flex flex:col">
    <Icon 
      icon="material-symbols:hourglass-empty" 
      class="w:32px h:32px text:gray-400 mb:12px"
    />
    <p class="text:sm text:gray-500">読み込み待機中</p>
  </div>
{/if}

<style>
  .lazy-loading,
  .lazy-error,
  .lazy-waiting {
    min-height: 120px;
    border: 1px dashed #e5e7eb;
    border-radius: 8px;
    background-color: #f9fafb;
  }

  .loading-spinner {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
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