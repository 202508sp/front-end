<!--
  ドラッグ&ドロップ機能のデモンストレーション
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    makeUniversalDraggable, 
    makeUniversalDropZone,
    type DragData,
    type DropZone
  } from '$lib/utils/dragdrop.js';

  interface DemoCard {
    id: string;
    title: string;
    color: string;
    zone: 'source' | 'target1' | 'target2';
  }

  let cards = $state<DemoCard[]>([
    { id: '1', title: 'カード 1', color: 'bg-blue-100', zone: 'source' },
    { id: '2', title: 'カード 2', color: 'bg-green-100', zone: 'source' },
    { id: '3', title: 'カード 3', color: 'bg-yellow-100', zone: 'source' },
    { id: '4', title: 'カード 4', color: 'bg-purple-100', zone: 'source' }
  ]);

  let sourceZone: HTMLElement;
  let targetZone1: HTMLElement;
  let targetZone2: HTMLElement;

  const handleDrop = (data: DragData, targetZone: 'source' | 'target1' | 'target2') => {
    const cardIndex = cards.findIndex(card => card.id === data.id);
    if (cardIndex !== -1) {
      cards[cardIndex].zone = targetZone;
      cards = [...cards]; // リアクティブ更新をトリガー
    }
  };

  const setupDragDrop = () => {
    // ドロップゾーンの設定
    const sourceDropZone: DropZone = {
      id: 'source',
      element: sourceZone,
      accepts: ['card'],
      onDrop: (data) => handleDrop(data, 'source')
    };

    const targetDropZone1: DropZone = {
      id: 'target1',
      element: targetZone1,
      accepts: ['card'],
      onDrop: (data) => handleDrop(data, 'target1')
    };

    const targetDropZone2: DropZone = {
      id: 'target2',
      element: targetZone2,
      accepts: ['card'],
      onDrop: (data) => handleDrop(data, 'target2')
    };

    // ドロップゾーンを有効化
    const cleanupFunctions = [
      makeUniversalDropZone(sourceZone, sourceDropZone),
      makeUniversalDropZone(targetZone1, targetDropZone1),
      makeUniversalDropZone(targetZone2, targetDropZone2)
    ];

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  };

  onMount(() => {
    const cleanup = setupDragDrop();
    return cleanup;
  });

  const setupCardDrag = (element: HTMLElement, card: DemoCard) => {
    const dragData: DragData = {
      id: card.id,
      type: 'card',
      data: card
    };

    return makeUniversalDraggable(element, dragData, {
      dragOptions: {
        ghostOpacity: 0.6
      },
      touchOptions: {
        threshold: 10,
        ghostElement: true
      }
    });
  };

  const getCardsInZone = (zone: 'source' | 'target1' | 'target2') => {
    return cards.filter(card => card.zone === zone);
  };
</script>

<div class="p-6 max-w-4xl mx-auto">
  <h2 class="text-2xl font-bold mb-6 text-center">ドラッグ&ドロップ デモ</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- ソースゾーン -->
    <div 
      bind:this={sourceZone}
      class="min-h-64 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
      data-drop-zone="source"
    >
      <h3 class="text-lg font-semibold mb-4 text-center">カード一覧</h3>
      <div class="space-y-3">
        {#each getCardsInZone('source') as card (card.id)}
          <div
            class="p-3 rounded-lg shadow-sm cursor-grab {card.color} border border-gray-200 transition-all duration-200 hover:shadow-md"
            use:setupCardDrag={card}
          >
            <div class="font-medium">{card.title}</div>
            <div class="text-sm text-gray-600">ID: {card.id}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- ターゲットゾーン1 -->
    <div 
      bind:this={targetZone1}
      class="min-h-64 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50"
      data-drop-zone="target1"
    >
      <h3 class="text-lg font-semibold mb-4 text-center text-blue-700">ゾーン 1</h3>
      <div class="space-y-3">
        {#each getCardsInZone('target1') as card (card.id)}
          <div
            class="p-3 rounded-lg shadow-sm cursor-grab {card.color} border border-blue-200 transition-all duration-200 hover:shadow-md"
            use:setupCardDrag={card}
          >
            <div class="font-medium">{card.title}</div>
            <div class="text-sm text-gray-600">ID: {card.id}</div>
          </div>
        {/each}
      </div>
      {#if getCardsInZone('target1').length === 0}
        <div class="text-center text-gray-500 mt-8">
          <div class="text-4xl mb-2">📦</div>
          <div>ここにカードをドロップ</div>
        </div>
      {/if}
    </div>

    <!-- ターゲットゾーン2 -->
    <div 
      bind:this={targetZone2}
      class="min-h-64 p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50"
      data-drop-zone="target2"
    >
      <h3 class="text-lg font-semibold mb-4 text-center text-green-700">ゾーン 2</h3>
      <div class="space-y-3">
        {#each getCardsInZone('target2') as card (card.id)}
          <div
            class="p-3 rounded-lg shadow-sm cursor-grab {card.color} border border-green-200 transition-all duration-200 hover:shadow-md"
            use:setupCardDrag={card}
          >
            <div class="font-medium">{card.title}</div>
            <div class="text-sm text-gray-600">ID: {card.id}</div>
          </div>
        {/each}
      </div>
      {#if getCardsInZone('target2').length === 0}
        <div class="text-center text-gray-500 mt-8">
          <div class="text-4xl mb-2">🎯</div>
          <div>ここにカードをドロップ</div>
        </div>
      {/if}
    </div>
  </div>

  <!-- 使用方法の説明 -->
  <div class="mt-8 p-4 bg-gray-100 rounded-lg">
    <h4 class="font-semibold mb-2">使用方法:</h4>
    <ul class="text-sm text-gray-700 space-y-1">
      <li>• デスクトップ: カードをクリック&ドラッグして移動</li>
      <li>• モバイル: カードを長押ししてドラッグ</li>
      <li>• カードは異なるゾーン間で自由に移動できます</li>
      <li>• ドロップゾーンは視覚的フィードバックを提供します</li>
    </ul>
  </div>

  <!-- デバッグ情報 -->
  <div class="mt-4 p-4 bg-gray-50 rounded-lg">
    <h4 class="font-semibold mb-2">現在の状態:</h4>
    <div class="text-sm font-mono">
      <div>ソース: {getCardsInZone('source').length} 枚</div>
      <div>ゾーン1: {getCardsInZone('target1').length} 枚</div>
      <div>ゾーン2: {getCardsInZone('target2').length} 枚</div>
    </div>
  </div>
</div>

<style>
  /* コンポーネント固有のスタイル */
  [data-drop-zone] {
    transition: all 0.3s ease;
  }
  
  [data-drop-zone].drag-over {
    transform: scale(1.02);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }
  
  [data-drop-zone].drop-valid {
    border-style: solid;
    animation: pulse 1s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
</style>