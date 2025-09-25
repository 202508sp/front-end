<!--
  ダッシュボードストアの使用例
  このコンポーネントは実装の参考として作成されています
-->
<script lang="ts">
  import { dashboardStore } from '$lib/stores';
  import type { CardTemplate } from '$lib/types/dashboard';

  // ストアから状態を取得
  const { visibleCards, isEditMode, canEdit, cardStats } = dashboardStore;

  // サンプルカードテンプレート
  const sampleTemplate: CardTemplate = {
    type: 'user-list',
    title: 'サンプルカード',
    icon: 'material-symbols:person-outline',
    defaultSize: 'medium',
    defaultConfig: { maxItems: 10 },
    description: 'サンプル用のカード',
    category: 'management'
  };

  function addSampleCard() {
    dashboardStore.addCard(sampleTemplate);
  }

  function toggleEdit() {
    dashboardStore.toggleEditMode();
  }

  function resetDashboard() {
    dashboardStore.reset();
  }
</script>

<div class="dashboard-example p:20px">
  <h2 class="mb:16px">ダッシュボードストア使用例</h2>
  
  <!-- 状態表示 -->
  <div class="status-panel bg:gray-100 p:16px r:8px mb:16px">
    <h3 class="mb:8px">現在の状態</h3>
    <p>編集モード: {isEditMode ? 'ON' : 'OFF'}</p>
    <p>表示中のカード数: {visibleCards.length}</p>
    <p>編集可能: {canEdit ? 'YES' : 'NO'}</p>
  </div>

  <!-- 統計情報 -->
  <div class="stats-panel bg:blue-50 p:16px r:8px mb:16px">
    <h3 class="mb:8px">カード統計</h3>
    <div class="grid grid-cols:2 gap:8px">
      <div>利用者リスト: {cardStats['user-list']}</div>
      <div>統計: {cardStats.statistics}</div>
      <div>スケジュール: {cardStats.schedule}</div>
      <div>通知: {cardStats.notifications}</div>
    </div>
  </div>

  <!-- コントロールボタン -->
  <div class="controls mb:16px">
    <button 
      onclick={addSampleCard}
      class="btn bg:blue-500 text:white p:8px|16px r:4px mr:8px hover:bg:blue-600"
    >
      サンプルカード追加
    </button>
    
    <button 
      onclick={toggleEdit}
      class="btn bg:green-500 text:white p:8px|16px r:4px mr:8px hover:bg:green-600"
    >
      編集モード切替
    </button>
    
    <button 
      onclick={resetDashboard}
      class="btn bg:red-500 text:white p:8px|16px r:4px hover:bg:red-600"
    >
      リセット
    </button>
  </div>

  <!-- カード一覧 -->
  <div class="cards-list">
    <h3 class="mb:8px">表示中のカード</h3>
    {#if visibleCards.length === 0}
      <p class="text:gray-500">カードがありません</p>
    {:else}
      <div class="grid grid-cols:1 gap:8px">
        {#each visibleCards as card (card.id)}
          <div class="card bg:white border:1|solid|gray-200 p:12px r:6px">
            <div class="flex justify:between align:center">
              <div>
                <h4 class="font:bold">{card.title}</h4>
                <p class="text:sm text:gray-600">
                  位置: ({card.position.x}, {card.position.y}) | 
                  サイズ: {card.size} | 
                  タイプ: {card.type}
                </p>
              </div>
              <div class="actions">
                <button 
                  onclick={() => dashboardStore.toggleCardVisibility(card.id)}
                  class="btn bg:yellow-500 text:white p:4px|8px r:3px text:xs mr:4px hover:bg:yellow-600"
                >
                  非表示
                </button>
                <button 
                  onclick={() => dashboardStore.removeCard(card.id)}
                  class="btn bg:red-500 text:white p:4px|8px r:3px text:xs hover:bg:red-600"
                >
                  削除
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .btn {
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .btn:hover {
    transform: translateY(-1px);
  }
</style>