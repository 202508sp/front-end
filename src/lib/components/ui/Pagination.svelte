<!--
  ページネーションコンポーネント
  大量データの分割表示を管理
-->
<script lang="ts">
  import Icon from '@iconify/svelte';
  import Button from './Button.svelte';

  interface Props {
    /** 現在のページ（1ベース） */
    currentPage: number;
    /** 1ページあたりのアイテム数 */
    itemsPerPage: number;
    /** 総アイテム数 */
    totalItems: number;
    /** 表示するページ番号の最大数 */
    maxVisiblePages?: number;
    /** ページサイズ選択オプション */
    pageSizeOptions?: number[];
    /** ページサイズ変更を許可するか */
    allowPageSizeChange?: boolean;
    /** 情報表示を有効にするか */
    showInfo?: boolean;
    /** ジャンプ機能を有効にするか */
    showJumpTo?: boolean;
    /** ページ変更時のコールバック */
    onPageChange: (page: number) => void;
    /** ページサイズ変更時のコールバック */
    onPageSizeChange?: (pageSize: number) => void;
  }

  let {
    currentPage,
    itemsPerPage,
    totalItems,
    maxVisiblePages = 7,
    pageSizeOptions = [10, 20, 50, 100],
    allowPageSizeChange = true,
    showInfo = true,
    showJumpTo = false,
    onPageChange,
    onPageSizeChange
  }: Props = $props();

  let jumpToPage = $state('');

  // 計算されたプロパティ
  const totalPages = $derived(Math.ceil(totalItems / itemsPerPage));
  const startItem = $derived((currentPage - 1) * itemsPerPage + 1);
  const endItem = $derived(Math.min(currentPage * itemsPerPage, totalItems));
  const hasPrevious = $derived(currentPage > 1);
  const hasNext = $derived(currentPage < totalPages);

  // 表示するページ番号の配列
  const visiblePages = $derived(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    // 終端に近い場合の調整
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: (number | string)[] = [];

    // 最初のページ
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }

    // 中間のページ
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 最後のページ
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return pages;
  });

  // ページ変更
  function changePage(page: number) {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }

  // ページサイズ変更
  function changePageSize(newPageSize: number) {
    if (onPageSizeChange && newPageSize !== itemsPerPage) {
      onPageSizeChange(newPageSize);
    }
  }

  // ジャンプ機能
  function handleJumpTo() {
    const page = parseInt(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      changePage(page);
      jumpToPage = '';
    }
  }

  // キーボードイベント
  function handleJumpKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleJumpTo();
    }
  }
</script>

{#if totalPages > 1}
  <div class="pagination-container">
    <!-- 情報表示 -->
    {#if showInfo}
      <div class="pagination-info">
        <span class="text:sm text:gray-600">
          {totalItems}件中 {startItem}-{endItem}件を表示
        </span>
      </div>
    {/if}

    <!-- メインのページネーション -->
    <div class="pagination-main">
      <!-- 前のページボタン -->
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrevious}
        onclick={() => changePage(currentPage - 1)}
        class="pagination-button"
      >
        <Icon icon="material-symbols:chevron-left" class="w:16px h:16px" />
        前へ
      </Button>

      <!-- ページ番号 -->
      <div class="pagination-pages">
        {#each visiblePages() as page}
          {#if page === '...'}
            <span class="pagination-ellipsis">...</span>
          {:else}
            <Button
              variant={page === currentPage ? 'primary' : 'outline'}
              size="sm"
              onclick={() => changePage(page as number)}
              class="pagination-page-button"
            >
              {page}
            </Button>
          {/if}
        {/each}
      </div>

      <!-- 次のページボタン -->
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onclick={() => changePage(currentPage + 1)}
        class="pagination-button"
      >
        次へ
        <Icon icon="material-symbols:chevron-right" class="w:16px h:16px" />
      </Button>
    </div>

    <!-- オプション機能 -->
    <div class="pagination-options">
      <!-- ページサイズ選択 -->
      {#if allowPageSizeChange && onPageSizeChange}
        <div class="page-size-selector">
          <label class="text:sm text:gray-600">
            表示件数:
            <select
              value={itemsPerPage}
              onchange={(e) => changePageSize(parseInt(e.currentTarget.value))}
              class="ml:8px px:8px py:4px border:1|solid|gray-300 r:4px text:sm"
            >
              {#each pageSizeOptions as option}
                <option value={option}>{option}件</option>
              {/each}
            </select>
          </label>
        </div>
      {/if}

      <!-- ジャンプ機能 -->
      {#if showJumpTo && totalPages > maxVisiblePages}
        <div class="jump-to-page">
          <label class="text:sm text:gray-600">
            ページ移動:
            <input
              type="number"
              min="1"
              max={totalPages}
              bind:value={jumpToPage}
              onkeydown={handleJumpKeydown}
              placeholder="ページ番号"
              class="ml:8px w:80px px:8px py:4px border:1|solid|gray-300 r:4px text:sm"
            />
            <Button
              variant="outline"
              size="sm"
              onclick={handleJumpTo}
              disabled={!jumpToPage}
              class="ml:4px"
            >
              移動
            </Button>
          </label>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .pagination-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    padding: 16px 0;
  }

  .pagination-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pagination-pages {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .pagination-ellipsis {
    padding: 8px 4px;
    color: #6b7280;
    font-size: 14px;
  }

  .pagination-options {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
    justify-content: center;
  }

  .page-size-selector,
  .jump-to-page {
    display: flex;
    align-items: center;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .pagination-container {
      gap: 12px;
    }

    .pagination-main {
      flex-wrap: wrap;
      justify-content: center;
    }

    .pagination-options {
      flex-direction: column;
      gap: 12px;
    }

    .pagination-info {
      order: -1;
    }
  }

  @media (max-width: 480px) {
    .pagination-pages {
      flex-wrap: wrap;
      justify-content: center;
    }

    :global(.pagination-button) {
      min-width: 60px;
    }

    :global(.pagination-page-button) {
      min-width: 40px;
    }
  }
</style>