<!--
  仮想リストコンポーネント
  大量データの効率的な表示を実現
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { intersectionManager } from '$lib/utils/intersectionObserver';

  interface Props<T = any> {
    /** 表示するアイテムの配列 */
    items: T[];
    /** 各アイテムの高さ（px） */
    itemHeight: number;
    /** コンテナの高さ（px） */
    containerHeight: number;
    /** 追加のバッファサイズ（表示領域外のアイテム数） */
    overscan?: number;
    /** 無限スクロール用のコールバック */
    onLoadMore?: () => Promise<void>;
    /** 読み込み中フラグ */
    loading?: boolean;
    /** 一意キーを取得する関数 */
    getItemKey?: (item: T, index: number) => string | number;
    /** アイテムの動的高さを取得する関数 */
    getItemHeight?: (item: T, index: number) => number;
    /** アイテムレンダリングスニペット */
    itemComponent: Snippet<[{ item: T; index: number }]>;
  }

  let {
    items,
    itemHeight,
    containerHeight,
    overscan = 5,
    onLoadMore,
    loading = false,
    getItemKey = (_, index) => index,
    getItemHeight,
    itemComponent
  }: Props = $props();

  let containerElement: HTMLDivElement;
  let scrollTop = $state(0);
  let isLoadingMore = $state(false);

  // 動的高さの場合のキャッシュ
  let heightCache = new Map<number, number>();
  let totalHeight = $state(0);

  // 表示範囲の計算
  const visibleRange = $derived(() => {
    if (getItemHeight) {
      // 動的高さの場合
      return calculateDynamicRange();
    } else {
      // 固定高さの場合
      return calculateFixedRange();
    }
  });

  // 固定高さでの表示範囲計算
  function calculateFixedRange() {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, items.length);
    const actualStartIndex = Math.max(0, startIndex - overscan);

    return {
      startIndex: actualStartIndex,
      endIndex,
      offsetY: actualStartIndex * itemHeight,
      totalHeight: items.length * itemHeight
    };
  }

  // 動的高さでの表示範囲計算
  function calculateDynamicRange() {
    let currentHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    let offsetY = 0;
    let foundStart = false;

    // 各アイテムの高さを計算してキャッシュ
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight!(items[i], i);
      heightCache.set(i, height);

      if (!foundStart && currentHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        offsetY = Array.from({ length: startIndex }, (_, idx) => 
          heightCache.get(idx) || itemHeight
        ).reduce((sum, h) => sum + h, 0);
        foundStart = true;
      }

      if (foundStart && currentHeight > scrollTop + containerHeight) {
        endIndex = Math.min(i + overscan, items.length);
        break;
      }

      currentHeight += height;
    }

    if (!foundStart) {
      startIndex = Math.max(0, items.length - overscan);
      endIndex = items.length;
    }

    totalHeight = currentHeight;

    return {
      startIndex,
      endIndex,
      offsetY,
      totalHeight: currentHeight
    };
  }

  // 表示するアイテム
  const visibleItems = $derived(() => {
    const range = visibleRange();
    return items.slice(range.startIndex, range.endIndex).map((item, index) => ({
      item,
      index: range.startIndex + index,
      key: getItemKey(item, range.startIndex + index)
    }));
  });

  // スクロールイベントハンドラ
  function handleScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    scrollTop = target.scrollTop;

    // 無限スクロールの処理
    if (onLoadMore && !isLoadingMore && !loading) {
      const { scrollTop, scrollHeight, clientHeight } = target;
      const threshold = 200; // 200px手前で読み込み開始

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        loadMore();
      }
    }
  }

  // 追加データの読み込み
  async function loadMore() {
    if (!onLoadMore || isLoadingMore || loading) return;

    isLoadingMore = true;
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      isLoadingMore = false;
    }
  }

  // 特定のインデックスにスクロール
  export function scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth') {
    if (!containerElement) return;

    let targetScrollTop: number;

    if (getItemHeight) {
      // 動的高さの場合
      targetScrollTop = Array.from({ length: index }, (_, i) => 
        heightCache.get(i) || itemHeight
      ).reduce((sum, h) => sum + h, 0);
    } else {
      // 固定高さの場合
      targetScrollTop = index * itemHeight;
    }

    containerElement.scrollTo({
      top: targetScrollTop,
      behavior
    });
  }

  // アイテムの高さを更新（動的高さの場合）
  export function updateItemHeight(index: number, height: number) {
    if (getItemHeight) {
      heightCache.set(index, height);
      // 必要に応じて再計算をトリガー
      scrollTop = containerElement?.scrollTop || 0;
    }
  }
</script>

<div
  bind:this={containerElement}
  class="virtual-list"
  style="height: {containerHeight}px; overflow-y: auto;"
  onscroll={handleScroll}
>
  <!-- 仮想的な全体の高さを確保 -->
  <div
    class="virtual-list-spacer"
    style="height: {visibleRange().totalHeight}px; position: relative;"
  >
    <!-- 表示領域のアイテム -->
    <div
      class="virtual-list-items"
      style="transform: translateY({visibleRange().offsetY}px);"
    >
      {#each visibleItems() as { item, index, key } (key)}
        <div
          class="virtual-list-item"
          style="height: {getItemHeight ? getItemHeight(item, index) : itemHeight}px;"
          data-index={index}
        >
          {@render itemComponent({ item, index })}
        </div>
      {/each}
    </div>

    <!-- 読み込み中インジケーター -->
    {#if loading || isLoadingMore}
      <div
        class="virtual-list-loading"
        style="position: absolute; bottom: 0; left: 0; right: 0; padding: 16px; text-align: center; background: rgba(255, 255, 255, 0.9);"
      >
        <div class="loading-spinner">
          <div class="spinner"></div>
          <span class="loading-text">読み込み中...</span>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .virtual-list {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .virtual-list-spacer {
    position: relative;
  }

  .virtual-list-items {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }

  .virtual-list-item {
    position: relative;
    overflow: hidden;
  }

  .loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    font-size: 14px;
    color: #6b7280;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* スクロールバーのスタイリング */
  .virtual-list::-webkit-scrollbar {
    width: 8px;
  }

  .virtual-list::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }

  .virtual-list::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  .virtual-list::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>