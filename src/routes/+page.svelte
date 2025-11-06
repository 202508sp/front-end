<!--
  ホームダッシュボードページ
  カスタマイズ可能なダッシュボード機能を提供
-->
<script lang="ts">
	import { dashboardStore } from '$lib/stores';
	import Button from '$lib/components/ui/Button.svelte';
	import LazyComponent from '$lib/components/ui/LazyComponent.svelte';
	import { componentLoader } from '$lib/utils/componentLoader';
	import type { CardTemplate, Position, DashboardCard } from '$lib/types/dashboard.js';
	import Icon from '@iconify/svelte';

	// ストアから状態を取得
	const { visibleCards, isEditMode, canEdit, cardTemplates, gridSettings } = dashboardStore;

	let showCardSelector = $state(false);
	let showCardEditModal = $state(false);
	let editingCard = $state<DashboardCard | null>(null);
	let shouldLoadCardGrid = $state(true);
	let shouldLoadCardSelector = $state(false);
	let shouldLoadCardEditModal = $state(false);

	function toggleEditMode() {
		dashboardStore.toggleEditMode();
	}

	function openCardSelector() {
		shouldLoadCardSelector = true;
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
		const card = visibleCards.find((c) => c.id === cardId);
		if (card) {
			editingCard = card;
			shouldLoadCardEditModal = true;
			showCardEditModal = true;
		}
	}

	function closeCardEditModal() {
		showCardEditModal = false;
		editingCard = null;
	}

	function handleCardSave(cardId: string, updates: Partial<DashboardCard>) {
		dashboardStore.updateCard(cardId, updates);
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

<div class="dashboard-page w:100% h:100% flex flex:column bg:gray-50">
	<!-- ヘッダー -->
	<header class="dashboard-header bg:white bb:1|solid|gray-200 px:24px py:16px">
		<div class="jc:between ai:center flex">
			<div>
				<h1 class="fg:2xl font:bold fg:gray-800">ダッシュボード</h1>
				<p class="fg:gray-600 mt:2px">
					{new Date().toLocaleDateString('ja-JP', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						weekday: 'long'
					})}
				</p>
			</div>

			<div class="header-actions ai:center gap:12px flex">
				<div class="stats fg:sm fg:gray-600">
					表示中: {visibleCards.length}個のカード
				</div>

				<Button variant={isEditMode ? 'primary' : 'secondary'} onclick={toggleEditMode}>
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
			<div
				class="empty-dashboard ai:center jc:center min-h:400px bg:white r:12px b:2|dashed|gray-300 flex flex:column"
			>
				<Icon
					icon="material-symbols:dashboard-outline"
					class="w:64px h:64px text:gray-400 mb:16px"
				/>
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
			<div class="cards-container jc:center flex">
				<LazyComponent
					loader={() => componentLoader.loadComponent('dashboard/CardGrid')}
					key="dashboard-cardgrid"
					shouldLoad={shouldLoadCardGrid}
					props={{
						cards: visibleCards,
						gridSettings,
						isEditMode,
						onCardMove: handleCardMove,
						onCardRemove: handleCardRemove,
						onCardEdit: handleCardEdit,
						onCardAdd: handleCardAdd
					}}
					loadingText="ダッシュボードを読み込み中..."
				/>
			</div>
		{/if}

		<!-- 編集モードのヘルプテキスト -->
		{#if isEditMode}
			<div class="edit-help bg:blue-50 b:1|solid|blue-200 r:8px p:16px mt:24px">
				<div class="align:start gap:12px flex">
					<Icon icon="material-symbols:info-outline" class="w:20px h:20px fg:blue-600 mt:2px" />
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
{#if shouldLoadCardSelector}
	<LazyComponent
		loader={() => componentLoader.loadComponent('dashboard/CardSelector')}
		key="dashboard-cardselector"
		shouldLoad={shouldLoadCardSelector}
		props={{
			isOpen: showCardSelector,
			templates: cardTemplates,
			onClose: closeCardSelector,
			onSelect: handleCardSelect
		}}
		loadingText="カード選択画面を読み込み中..."
	/>
{/if}

<!-- カード編集モーダル -->
{#if shouldLoadCardEditModal}
	<LazyComponent
		loader={() => componentLoader.loadComponent('dashboard/CardEditModal')}
		key="dashboard-cardeditmodal"
		shouldLoad={shouldLoadCardEditModal}
		props={{
			isOpen: showCardEditModal,
			card: editingCard,
			onClose: closeCardEditModal,
			onSave: handleCardSave
		}}
		loadingText="編集画面を読み込み中..."
	/>
{/if}

<style>
	.dashboard-page {
		min-height: calc(100vh - 90px - 80px);
    max-height: calc(100vh - 90px - 80px);
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
