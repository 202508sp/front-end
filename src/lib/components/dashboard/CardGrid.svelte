<!--
  カードグリッドコンポーネント
  ダッシュボードカードの配置とドロップ処理を管理
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { makeUniversalDropZone, calculateGridPosition } from '$lib/utils/dragdrop.js';
	import DashboardCard from './DashboardCard.svelte';
	import type {
		DashboardCard as DashboardCardType,
		Position,
		GridSettings
	} from '$lib/types/dashboard.js';
	import type { DropZone, DragData } from '$lib/utils/dragdrop.js';

	interface Props {
		cards: DashboardCardType[];
		gridSettings: GridSettings;
		isEditMode?: boolean;
		onCardMove?: (cardId: string, newPosition: Position) => void;
		onCardRemove?: (cardId: string) => void;
		onCardEdit?: (cardId: string) => void;
		onCardAdd?: (position: Position) => void;
	}

	let {
		cards,
		gridSettings,
		isEditMode = false,
		onCardMove,
		onCardRemove,
		onCardEdit,
		onCardAdd
	}: Props = $props();

	let gridElement: HTMLElement;
	let cleanupDropZone: (() => void) | null = null;
	let draggedCardId = $state<string | null>(null);
	let dropPreviewPosition = $state<Position | null>(null);

	// グリッドのスタイル計算
	const gridStyle = $derived(() => {
		const totalWidth =
			gridSettings.columns * (gridSettings.cellWidth + gridSettings.gap) - gridSettings.gap;
		const totalHeight =
			gridSettings.rows * (gridSettings.cellHeight + gridSettings.gap) - gridSettings.gap;

		return {
			width: `${totalWidth}px`,
			height: `${totalHeight}px`,
			gap: `${gridSettings.gap}px`
		};
	});

	// 占有されているポジションのセット
	const occupiedPositions = $derived.by(() => {
		const occupied = new Set<string>();
		cards.forEach((card) => {
			if (card.id !== draggedCardId) {
				occupied.add(`${card.position.x},${card.position.y}`);
			}
		});
		return occupied;
	});

	// 利用可能なドロップゾーンを生成
	const availableDropZones = $derived.by(() => {
		const zones: Position[] = [];
		for (let y = 0; y < gridSettings.rows; y++) {
			for (let x = 0; x < gridSettings.columns; x++) {
				if (!occupiedPositions.has(`${x},${y}`)) {
					zones.push({ x, y });
				}
			}
		}
		return zones;
	});

	// ドロップゾーンを初期化
	function initializeDropZone() {
		if (!gridElement || !isEditMode) return;

		const dropZone: DropZone = {
			id: 'card-grid',
			element: gridElement,
			accepts: ['dashboard-card'],
			onDrop: handleDrop,
			onDragOver: handleDragOver,
			onDragLeave: handleDragLeave
		};

		cleanupDropZone = makeUniversalDropZone(gridElement, dropZone, {
			dragOverClass: 'drag-over',
			dragActiveClass: 'drag-active',
			dropValidClass: 'drop-valid',
			dropInvalidClass: 'drop-invalid'
		});
	}

	// ドロップゾーンをクリーンアップ
	function cleanupDropZoneFunctionality() {
		if (cleanupDropZone) {
			cleanupDropZone();
			cleanupDropZone = null;
		}
	}

	// ドロップ処理
	function handleDrop(data: DragData, position: Position) {
		if (data.type !== 'dashboard-card') return;

		const rect = gridElement.getBoundingClientRect();
		const gridPosition = calculateGridPosition(
			{ x: position.x + rect.left, y: position.y + rect.top },
			{
				width: gridSettings.cellWidth + gridSettings.gap,
				height: gridSettings.cellHeight + gridSettings.gap
			},
			rect
		);

		// グリッド範囲内かチェック
		if (
			gridPosition.x >= 0 &&
			gridPosition.x < gridSettings.columns &&
			gridPosition.y >= 0 &&
			gridPosition.y < gridSettings.rows
		) {
			// 占有されていない位置かチェック
			if (!occupiedPositions.has(`${gridPosition.x},${gridPosition.y}`)) {
				onCardMove?.(data.id, gridPosition);
			} else {
				// 占有されている場合は最も近い空いている位置を探す
				const nearestPosition = findNearestAvailablePosition(gridPosition);
				if (nearestPosition) {
					onCardMove?.(data.id, nearestPosition);
				}
			}
		}

		// ドラッグ状態をリセット
		draggedCardId = null;
		dropPreviewPosition = null;
	}

	// ドラッグオーバー処理
	function handleDragOver(data: DragData) {
		if (data.type !== 'dashboard-card') return;

		// ドロップ位置のプレビューを更新
		// この処理は実際のマウス位置に基づいて行う必要があるため、
		// 実装では mousemove イベントを使用することを推奨
	}

	// ドラッグリーブ処理
	function handleDragLeave() {
		dropPreviewPosition = null;
	}

	// 最も近い利用可能な位置を見つける
	function findNearestAvailablePosition(targetPosition: Position): Position | null {
		const available = availableDropZones;
		if (available.length === 0) return null;

		let nearest = available[0];
		let minDistance = calculateDistance(targetPosition, nearest);

		for (const position of available) {
			const distance = calculateDistance(targetPosition, position);
			if (distance < minDistance) {
				minDistance = distance;
				nearest = position;
			}
		}

		return nearest;
	}

	// 距離計算
	function calculateDistance(pos1: Position, pos2: Position): number {
		const dx = pos2.x - pos1.x;
		const dy = pos2.y - pos1.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	// カードドラッグ開始ハンドラー
	function handleCardDragStart(cardId: string) {
		draggedCardId = cardId;
	}

	// カードドラッグ終了ハンドラー
	function handleCardDragEnd(cardId: string) {
		draggedCardId = null;
		dropPreviewPosition = null;
	}

	// 空のセルクリックハンドラー
	function handleEmptyCellClick(position: Position) {
		if (isEditMode) {
			onCardAdd?.(position);
		}
	}

	// マウント時にドロップゾーンを初期化
	onMount(() => {
		if (isEditMode) {
			initializeDropZone();
		}
	});

	// アンマウント時にクリーンアップ
	onDestroy(() => {
		cleanupDropZoneFunctionality();
	});

	// isEditMode の変更を監視してドロップゾーンを更新
	$effect(() => {
		cleanupDropZoneFunctionality();
		if (isEditMode) {
			initializeDropZone();
		}
	});
</script>

<div
	bind:this={gridElement}
	class="card-grid bg:gray-50 border:2|dashed|gray-200 r:8px relative p:{gridSettings.gap}px {isEditMode
		? 'edit-mode'
		: ''}"
	style="width: {gridStyle().width}px; height: {gridStyle().height}px;"
	data-drop-zone="card-grid"
>
	<!-- グリッドセル（編集モード時のみ表示） -->
	{#if isEditMode}
		{#each Array(gridSettings.rows) as _, y}
			{#each Array(gridSettings.columns) as _, x}
				{@const position = { x, y }}
				{@const isOccupied = occupiedPositions.has(`${x},${y}`)}
				{@const isDropPreview =
					dropPreviewPosition && dropPreviewPosition.x === x && dropPreviewPosition.y === y}

				<div
					class="grid-cell border:1|solid|gray-300 r:4px transition:all|0.2s absolute {isOccupied
						? 'occupied'
						: 'available'} {isDropPreview ? 'drop-preview' : ''}"
					style="
            left: {x * (gridSettings.cellWidth + gridSettings.gap)}px;
            top: {y * (gridSettings.cellHeight + gridSettings.gap)}px;
            width: {gridSettings.cellWidth}px;
            height: {gridSettings.cellHeight}px;
          "
					onclick={() => handleEmptyCellClick(position)}
					onkeydown={(e) => e.key === 'Enter' && handleEmptyCellClick(position)}
					role="button"
					tabindex="0"
				>
					{#if !isOccupied}
						<div
							class="add-card-hint align:center justify:center h:full text:gray-400 hover:text:gray-600 cursor:pointer flex"
						>
							<span class="text:xs">+</span>
						</div>
					{/if}
				</div>
			{/each}
		{/each}
	{/if}

	<!-- ダッシュボードカード -->
	{#each cards as card (card.id)}
		<div
			class="card-container transition:transform|0.3s absolute"
			style="
        left: {card.position.x * (gridSettings.cellWidth + gridSettings.gap)}px;
        top: {card.position.y * (gridSettings.cellHeight + gridSettings.gap)}px;
        z-index: {draggedCardId === card.id ? 1000 : 1};
      "
		>
			<DashboardCard
				{card}
				isDraggable={isEditMode}
				{isEditMode}
				onRemove={onCardRemove}
				onEdit={onCardEdit}
				onDragStart={handleCardDragStart}
				onDragEnd={handleCardDragEnd}
			/>
		</div>
	{/each}

	<!-- ドロップゾーンのビジュアルフィードバック -->
	{#if isEditMode && availableDropZones.length > 0}
		<div class="drop-zones-overlay inset:0 pointer-events:none absolute">
			{#each availableDropZones as zone}
				<div
					class="drop-zone-indicator border:2|dashed|blue-300 r:4px opacity:0 transition:opacity|0.2s absolute"
					style="
            left: {zone.x * (gridSettings.cellWidth + gridSettings.gap)}px;
            top: {zone.y * (gridSettings.cellHeight + gridSettings.gap)}px;
            width: {gridSettings.cellWidth}px;
            height: {gridSettings.cellHeight}px;
          "
				></div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.card-grid {
		min-height: 400px;
		overflow: visible;
	}

	.card-grid.edit-mode {
		background-color: #f8fafc;
		border-color: #3b82f6;
	}

	.grid-cell {
		background-color: rgba(255, 255, 255, 0.5);
	}

	.grid-cell.available:hover {
		background-color: rgba(59, 130, 246, 0.1);
		border-color: #3b82f6;
	}

	.grid-cell.occupied {
		background-color: transparent;
		border-color: transparent;
	}

	.grid-cell.drop-preview {
		background-color: rgba(34, 197, 94, 0.2);
		border-color: #22c55e;
	}

	.add-card-hint {
		font-size: 24px;
		font-weight: bold;
	}

	/* ドラッグ中のスタイル */
	.card-grid.drag-active {
		background-color: #eff6ff;
		border-color: #3b82f6;
	}

	.card-grid.drag-over {
		background-color: #dbeafe;
		border-color: #2563eb;
	}

	.card-grid.drop-valid {
		background-color: #dcfce7;
		border-color: #16a34a;
	}

	.card-grid.drop-invalid {
		background-color: #fef2f2;
		border-color: #dc2626;
	}

	/* ドロップゾーンインジケーター */
	:global(body.drag-active) .drop-zone-indicator {
		opacity: 0.6;
	}

	:global(body.touch-drag-active) .drop-zone-indicator {
		opacity: 0.6;
	}

	/* カードコンテナのアニメーション */
	.card-container {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* タッチドラッグ中のスタイル */
	.card-grid.touch-drag-over {
		background-color: #dbeafe;
		border-color: #2563eb;
	}
</style>
