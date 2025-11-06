<!--
  無限スクロールコンポーネント
  データの段階的読み込みを実装
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { intersectionManager } from '$lib/utils/intersectionObserver';
  import Icon from '@iconify/svelte';

  interface Props<T = any> {
    /** 表示するアイテムの配列 */
    items: T[];
    /** 追加データ読み込み関数 */
    onLoadMore: () => Promise<void>;
    /** 読み込み中フラグ */
    loading?: boolean;
    /** すべてのデータを読み込み済みか */
    hasMore?: boolean;
    /** 読み込みトリガーの閾値（px） */
    threshold?: number;
    /** 一意キーを取得する関数 */
    getItemKey?: (item: T, index: number) => string | number;
    /** エラー状態 */
    error?: Error | null;
    /** 再試行コールバック */
    onRetry?: () => void;
    /** 空の状態のメッセージ */
    emptyMessage?: string;
    /** 読み込み完了メッセージ */
    endMessage?: string;
    /** 初期読み込み中フラグ */
    initialLoading?: boolean;
    /** アイテムレンダリングスニペット */
    itemComponent: Snippet<[{ item: T; index: number }]>;
  }

  let {
    items,
    onLoadMore,
    loading = false,
    hasMore = true,
    threshold = 200,
    getItemKey = (_, index) => index,
    error = null,
    onRetry,
    emptyMessage = 'データがありません',
    endMessage = 'すべてのデータを読み込みました',
    initialLoading = false,
    itemComponent
  }: Props = $props();

  let containerElement: HTMLDivElement;
  let triggerElement: HTMLDivElement;
  let isLoadingMore = $state(false);

  // 無限スクロールのトリガー設定
  $effect(() => {
    if (triggerElement && hasMore && !loading && !error) {
      const unobserve = intersectionManager.observe(
        triggerElement,
        (entry) => {
          if (entry.isIntersecting && !isLoadingMore) {
            loadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
          threshold: 0.1
        }
      );

      return unobserve;
    }
  });

  // 追加データの読み込み
  async function loadMore() {
    if (isLoadingMore || loading || !hasMore || error) {
      return;
    }

    isLoadingMore = true;
    try {
      await onLoadMore();
    } catch (err) {
      console.error('Failed to load more items:', err);
    } finally {
      isLoadingMore = false;
    }
  }

  // 手動再読み込み
  function handleRetry() {
    if (onRetry) {
      onRetry();
    } else {
      loadMore();
    }
  }

  // 先頭にスクロール
  export function scrollToTop(behavior: ScrollBehavior = 'smooth') {
    if (containerElement) {
      containerElement.scrollTo({
        top: 0,
        behavior
      });
    }
  }

  // 特定のアイテムにスクロール
  export function scrollToItem(index: number, behavior: ScrollBehavior = 'smooth') {
    const itemElement = containerElement?.querySelector(`[data-index="${index}"]`);
    if (itemElement) {
      itemElement.scrollIntoView({ behavior, block: 'start' });
    }
  }
</script>

<div bind:this={containerElement} class="infinite-scroll-container">
  {#if initialLoading}
    <!-- 初期読み込み中 -->
    <div class="initial-loading">
      <div class="loading-spinner">
        <Icon icon="material-symbols:progress-activity" class="w:32px h:32px text:blue-500 animate:spin" />
      </div>
      <p class="loading-text">データを読み込み中...</p>
    </div>
  {:else if items.length === 0 && !loading}
    <!-- 空の状態 -->
    <div class="empty-state">
      <Icon icon="material-symbols:inbox-outline" class="w:48px h:48px text:gray-400 mb:16px" />
      <p class="empty-message">{emptyMessage}</p>
    </div>
  {:else}
    <!-- アイテムリスト -->
    <div class="items-container">
      {#each items as item, index (getItemKey(item, index))}
        <div class="item-wrapper" data-index={index}>
          {@render itemComponent({ item, index })}
        </div>
      {/each}
    </div>

    <!-- 読み込み状態の表示 -->
    {#if hasMore}
      <div bind:this={triggerElement} class="load-trigger">
        {#if loading || isLoadingMore}
          <!-- 読み込み中 -->
          <div class="loading-more">
            <div class="loading-spinner">
              <Icon icon="material-symbols:progress-activity" class="w:24px h:24px text:blue-500 animate:spin" />
            </div>
            <span class="loading-text">読み込み中...</span>
          </div>
        {:else if error}
          <!-- エラー状態 -->
          <div class="error-state">
            <Icon icon="material-symbols:error-outline" class="w:24px h:24px text:red-500 mb:8px" />
            <p class="error-message">読み込みに失敗しました</p>
            <button onclick={handleRetry} class="retry-button">
              <Icon icon="material-symbols:refresh" class="w:16px h:16px mr:4px" />
              再試行
            </button>
          </div>
        {:else}
          <!-- 読み込みトリガー（見えない要素） -->
          <div class="invisible-trigger" aria-hidden="true"></div>
        {/if}
      </div>
    {:else if items.length > 0}
      <!-- 読み込み完了 -->
      <div class="end-state">
        <Icon icon="material-symbols:check-circle-outline" class="w:24px h:24px text:green-500 mb:8px" />
        <p class="end-message">{endMessage}</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .infinite-scroll-container {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .initial-loading,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 40px 20px;
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .loading-text {
    font-size: 14px;
    color: #6b7280;
  }

  .empty-message {
    font-size: 16px;
    color: #6b7280;
    text-align: center;
  }

  .items-container {
    display: flex;
    flex-direction: column;
  }

  .item-wrapper {
    position: relative;
  }

  .load-trigger {
    display: flex;
    justify-content: center;
    padding: 20px;
    min-height: 60px;
  }

  .loading-more {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .error-message {
    font-size: 14px;
    color: #dc2626;
    margin-bottom: 12px;
  }

  .retry-button {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background-color: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-button:hover {
    background-color: #dc2626;
  }

  .end-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    text-align: center;
  }

  .end-message {
    font-size: 14px;
    color: #059669;
  }

  .invisible-trigger {
    width: 1px;
    height: 1px;
    opacity: 0;
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

  /* スクロールバーのスタイリング */
  .infinite-scroll-container::-webkit-scrollbar {
    width: 8px;
  }

  .infinite-scroll-container::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .infinite-scroll-container::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .infinite-scroll-container::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>