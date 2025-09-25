<!--
  ダッシュボードカードコンポーネント
  ドラッグ&ドロップ機能付きのカード表示
-->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { makeUniversalDraggable } from '$lib/utils/dragdrop.js';
  import type { DashboardCard } from '$lib/types/dashboard.js';
  import type { DragData } from '$lib/utils/dragdrop.js';
  import Icon from '@iconify/svelte';

  interface Props {
    card: DashboardCard;
    isDraggable?: boolean;
    isEditMode?: boolean;
    onRemove?: (cardId: string) => void;
    onEdit?: (cardId: string) => void;
    onDragStart?: (cardId: string) => void;
    onDragEnd?: (cardId: string) => void;
  }

  let {
    card,
    isDraggable = false,
    isEditMode = false,
    onRemove,
    onEdit,
    onDragStart,
    onDragEnd
  }: Props = $props();

  let cardElement: HTMLElement;
  let cleanupDrag: (() => void) | null = null;

  // カードサイズに応じたCSSクラス
  const sizeClasses = {
    small: 'w:120px h:120px',
    medium: 'w:240px h:120px',
    large: 'w:240px h:240px'
  };

  // ドラッグデータを作成
  const dragData: DragData = {
    id: card.id,
    type: 'dashboard-card',
    data: card
  };

  // ドラッグ機能を初期化
  function initializeDrag() {
    if (!cardElement || !isDraggable) return;

    cleanupDrag = makeUniversalDraggable(cardElement, dragData, {
      dragOptions: {
        ghostOpacity: 0.5,
        onDragStart: () => {
          cardElement.classList.add('dragging');
          onDragStart?.(card.id);
        },
        onDragEnd: () => {
          cardElement.classList.remove('dragging');
          onDragEnd?.(card.id);
        }
      },
      touchOptions: {
        threshold: 10,
        ghostElement: true,
        onDragStart: () => {
          cardElement.classList.add('touch-dragging');
          onDragStart?.(card.id);
        },
        onDragEnd: () => {
          cardElement.classList.remove('touch-dragging');
          onDragEnd?.(card.id);
        }
      }
    });
  }

  // ドラッグ機能をクリーンアップ
  function cleanupDragFunctionality() {
    if (cleanupDrag) {
      cleanupDrag();
      cleanupDrag = null;
    }
  }

  // カード削除ハンドラー
  function handleRemove(event: Event) {
    event.stopPropagation();
    onRemove?.(card.id);
  }

  // カード編集ハンドラー
  function handleEdit(event: Event) {
    event.stopPropagation();
    onEdit?.(card.id);
  }

  // カードクリックハンドラー
  function handleCardClick() {
    if (!isEditMode && !isDraggable) {
      // カードタイプに応じた処理を実装
      handleCardTypeClick(card.type);
    }
  }

  // カードタイプ別のクリック処理
  function handleCardTypeClick(cardType: string) {
    switch (cardType) {
      case 'user-list':
        // 利用者一覧ページに遷移
        window.location.href = '/user';
        break;
      case 'statistics':
        // 統計ページに遷移
        window.location.href = '/statistics';
        break;
      case 'schedule':
        // スケジュール詳細を表示（モーダルまたは別ページ）
        console.log('Opening schedule details');
        break;
      case 'notifications':
        // 通知一覧を表示
        console.log('Opening notifications');
        break;
      case 'quick-actions':
        // クイックアクション実行（カード内で処理）
        console.log('Quick actions clicked');
        break;
      case 'recent-reports':
        // レポート一覧ページに遷移
        window.location.href = '/management';
        break;
      case 'chat-summary':
        // チャット画面に遷移
        window.location.href = '/management';
        break;
      default:
        console.log('Card clicked:', cardType);
    }
  }

  // マウント時にドラッグ機能を初期化
  onMount(() => {
    if (isDraggable) {
      initializeDrag();
    }
  });

  // アンマウント時にクリーンアップ
  onDestroy(() => {
    cleanupDragFunctionality();
  });

  // isDraggable の変更を監視してドラッグ機能を更新
  $effect(() => {
    cleanupDragFunctionality();
    if (isDraggable) {
      initializeDrag();
    }
  });
</script>

<div
  bind:this={cardElement}
  class="dashboard-card {sizeClasses[card.size]} bg:white border:1|solid|gray-200 r:8px shadow:sm transition:all|0.2s cursor:pointer hover:shadow:md {isDraggable ? 'draggable' : ''}"
  style="transform: translate({card.position.x * 120}px, {card.position.y * 120}px);"
  onclick={handleCardClick}
  onkeydown={(e) => e.key === 'Enter' && handleCardClick()}
  role="button"
  tabindex="0"
  data-card-id={card.id}
  data-card-type={card.type}
>
  <!-- カードヘッダー -->
  <div class="card-header flex justify:between align:center p:12px border-bottom:1|solid|gray-100">
    <div class="card-title flex align:center gap:8px">
      <Icon icon={card.icon} class="w:20px h:20px text:gray-600" />
      <span class="font:medium text:sm text:gray-800 truncate">{card.title}</span>
    </div>
    
    {#if isEditMode}
      <div class="card-actions flex gap:4px">
        <button
          onclick={handleEdit}
          class="action-btn w:24px h:24px flex align:center justify:center r:4px bg:blue-50 hover:bg:blue-100 text:blue-600"
          title="編集"
        >
          <Icon icon="material-symbols:edit-outline" class="w:14px h:14px" />
        </button>
        <button
          onclick={handleRemove}
          class="action-btn w:24px h:24px flex align:center justify:center r:4px bg:red-50 hover:bg:red-100 text:red-600"
          title="削除"
        >
          <Icon icon="material-symbols:close" class="w:14px h:14px" />
        </button>
      </div>
    {/if}
  </div>

  <!-- カードコンテンツ -->
  <div class="card-content p:12px flex-1 overflow:hidden">
    {#if card.type === 'user-list'}
      <div class="user-list-preview">
        <div class="text:xs text:gray-500 mb:4px">利用者数</div>
        <div class="text:lg font:bold text:gray-800">24名</div>
        <div class="text:xs text:gray-500 mt:2px">今日の出席: 22名</div>
      </div>
    {:else if card.type === 'statistics'}
      <div class="statistics-preview">
        <div class="text:xs text:gray-500 mb:4px">今日の統計</div>
        <div class="flex justify:between">
          <div>
            <div class="text:sm font:medium">レポート</div>
            <div class="text:lg font:bold text:blue-600">8件</div>
          </div>
          <div>
            <div class="text:sm font:medium">通知</div>
            <div class="text:lg font:bold text:orange-600">3件</div>
          </div>
        </div>
      </div>
    {:else if card.type === 'schedule'}
      <div class="schedule-preview">
        <div class="text:xs text:gray-500 mb:4px">今日の予定</div>
        <div class="space-y:2px">
          <div class="text:xs">10:00 健康チェック</div>
          <div class="text:xs">14:00 レクリエーション</div>
          <div class="text:xs">16:00 おやつタイム</div>
        </div>
      </div>
    {:else if card.type === 'notifications'}
      <div class="notifications-preview">
        <div class="text:xs text:gray-500 mb:4px">通知</div>
        <div class="flex align:center gap:4px">
          <div class="w:8px h:8px bg:red-500 r:full"></div>
          <div class="text:xs">緊急: 3件</div>
        </div>
        <div class="flex align:center gap:4px mt:2px">
          <div class="w:8px h:8px bg:blue-500 r:full"></div>
          <div class="text:xs">情報: 5件</div>
        </div>
      </div>
    {:else if card.type === 'quick-actions'}
      <div class="quick-actions-preview">
        <div class="text:xs text:gray-500 mb:4px">クイックアクション</div>
        <div class="grid grid-cols:2 gap:4px">
          <button class="text:xs bg:gray-50 p:4px r:3px hover:bg:gray-100">利用者追加</button>
          <button class="text:xs bg:gray-50 p:4px r:3px hover:bg:gray-100">レポート作成</button>
        </div>
      </div>
    {:else}
      <div class="default-preview">
        <div class="text:xs text:gray-500">カードタイプ: {card.type}</div>
        <div class="text:xs text:gray-400 mt:4px">コンテンツを実装してください</div>
      </div>
    {/if}
  </div>

  <!-- ドラッグハンドル（編集モード時のみ表示） -->
  {#if isEditMode && isDraggable}
    <div class="drag-handle absolute top:4px right:4px w:16px h:16px flex align:center justify:center text:gray-400 hover:text:gray-600">
      <Icon icon="material-symbols:drag-indicator" class="w:12px h:12px" />
    </div>
  {/if}
</div>

<style>
  .dashboard-card {
    position: relative;
    display: flex;
    flex-direction: column;
    user-select: none;
  }

  .dashboard-card.draggable {
    cursor: grab;
  }

  .dashboard-card.dragging,
  .dashboard-card.touch-dragging {
    opacity: 0.5;
    transform: rotate(5deg) !important;
    z-index: 1000;
    cursor: grabbing;
  }

  .action-btn {
    transition: all 0.2s;
    cursor: pointer;
  }

  .action-btn:hover {
    transform: scale(1.1);
  }

  .drag-handle {
    cursor: grab;
  }

  .card-content {
    min-height: 0;
  }

  /* ドラッグ中のグローバルスタイル */
  :global(body.drag-active) .dashboard-card:not(.dragging) {
    pointer-events: none;
  }

  :global(body.touch-drag-active) .dashboard-card:not(.touch-dragging) {
    pointer-events: none;
  }
</style>