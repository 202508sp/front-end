<!--
  ホームダッシュボードページ
  カスタマイズ可能なダッシュボード機能を提供
-->
<script lang="ts">
  import { dashboardStore } from '$lib/stores';
  import Button from '$lib/components/ui/Button.svelte';
  import CardGrid from '$lib/components/dashboard/CardGrid.svelte';
  import CardSelector from '$lib/components/dashboard/CardSelector.svelte';
  import type { CardTemplate, Position } from '$lib/types/dashboard.js';
  import Icon from '@iconify/svelte';

  // ストアから状態を取得
  const { visibleCards, isEditMode, canEdit, cardTemplates, gridSettings } = dashboardStore;

  let showCardSelector = $state(false);

  function toggleEditMode() {
    dashboardStore.toggleEditMode();
  }

  function openCardSelector() {
    showCardSelector = true;
  }

  function closeCardSelector() {
    showCardSelector = false;
  }

  function handleCardSelect(template: CardTemplate) {
    dashboardStore.addCard(template);
  }

  function handleCardMove(cardId: string, newPosition: Position) {
    dashboardStore.moveCard(cardId, newPosition);
  }

  function handleCardRemove(cardId: string) {
    if (confirm('このカードを削除しますか？')) {
      dashboardStore.removeCard(cardId);
    }
  }

  function handleCardEdit(cardId: string) {
    // TODO: カード編集モーダルを実装
    console.log('Edit card:', cardId);
  }

  function handleCardAdd(position: Position) {
    showCardSelector = true;
  }

  function resetDashboard() {
    if (confirm('ダッシュボードをリセットしますか？')) {
      dashboardStore.reset();
    }
  }
</script>

<svelte:head>
  <title>ホーム - 介護施設ダッシュボード</title>
</svelte:head>

<div class="dashboard-page min-h:screen bg:gray-50">
  <!-- ヘッダー -->
  <header class="dashboard-header bg:white border-bottom:1|solid|gray-200 px:24px py:16px">
    <div class="flex justify:between align:center">
      <div>
        <h1 class="text:2xl font:bold text:gray-800">ダッシュボード</h1>
        <p class="text:gray-600 mt:2px">
          {new Date().toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>
      
      <div class="header-actions flex align:center gap:12px">
        <div class="stats text:sm text:gray-600">
          表示中: {visibleCards.length}個のカード
        </div>
        
        <Button
          variant={isEditMode ? 'primary' : 'secondary'}
          onclick={toggleEditMode}
        >
          <Icon icon="material-symbols:edit-outline" class="w:16px h:16px mr:6px" />
          {isEditMode ? '編集完了' : '編集モード'}
        </Button>
        
        {#if isEditMode}
          <Button variant="outline" onclick={openCardSelector}>
            <Icon icon="material-symbols:add" class="w:16px h:16px mr:6px" />
            カード追加
          </Button>
          
          <Button variant="danger" onclick={resetDashboard}>
            <Icon icon="material-symbols:refresh" class="w:16px h:16px mr:6px" />
            リセット
          </Button>
        {/if}
      </div>
    </div>
  </header>

  <!-- メインコンテンツ -->
  <main class="dashboard-main p:24px">
    {#if visibleCards.length === 0 && !isEditMode}
      <!-- 空の状態 -->
      <div class="empty-dashboard flex flex-col align:center justify:center min-h:400px bg:white r:12px border:2|dashed|gray-300">
        <Icon icon="material-symbols:dashboard-outline" class="w:64px h:64px text:gray-400 mb:16px" />
        <h2 class="text:xl font:semibold text:gray-600 mb:8px">ダッシュボードが空です</h2>
        <p class="text:gray-500 mb:16px text:center max-w:400px">
          カードを追加してダッシュボードをカスタマイズしましょう。
          編集モードを有効にしてカードを追加できます。
        </p>
        <Button onclick={toggleEditMode}>
          <Icon icon="material-symbols:add" class="w:16px h:16px mr:6px" />
          カードを追加
        </Button>
      </div>
    {:else}
      <!-- カードグリッド -->
      <div class="cards-container flex justify:center">
        <CardGrid
          cards={visibleCards}
          {gridSettings}
          {isEditMode}
          onCardMove={handleCardMove}
          onCardRemove={handleCardRemove}
          onCardEdit={handleCardEdit}
          onCardAdd={handleCardAdd}
        />
      </div>
    {/if}

    <!-- 編集モードのヘルプテキスト -->
    {#if isEditMode}
      <div class="edit-help bg:blue-50 border:1|solid|blue-200 r:8px p:16px mt:24px">
        <div class="flex align:start gap:12px">
          <Icon icon="material-symbols:info-outline" class="w:20px h:20px text:blue-600 mt:2px" />
          <div>
            <h3 class="font:medium text:blue-800 mb:4px">編集モードのヒント</h3>
            <ul class="text:sm text:blue-700 space-y:2px">
              <li>• カードをドラッグして位置を変更できます</li>
              <li>• 空のセルをクリックして新しいカードを追加できます</li>
              <li>• カードの右上のボタンで編集・削除ができます</li>
              <li>• 編集完了ボタンで通常モードに戻ります</li>
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<!-- カードセレクターモーダル -->
<CardSelector
  isOpen={showCardSelector}
  templates={cardTemplates}
  onClose={closeCardSelector}
  onSelect={handleCardSelect}
/>

<style>
  .dashboard-page {
    min-height: 100vh;
  }

  .cards-container {
    max-width: 100%;
    overflow-x: auto;
  }

  .edit-help {
    max-width: 800px;
    margin: 0 auto;
  }
</style>
