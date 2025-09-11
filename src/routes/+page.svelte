<script lang="ts">
	import CardList from '$lib/components/CardList.svelte';

	// グリッドサイズ（px）
	const GRID_SIZE = 40;

	// カードデータ
	let cards = $state([
		{
			id: 'user-list',
			title: '利用者一覧',
			icon: 'material-symbols:person',
			list: [
				{ name: '山田 太郎', detail: '' },
				{ name: '佐藤 花子', detail: '' },
				{ name: '鈴木 一郎', detail: '' }
			],
			position: { x: 0, y: 0 },
			size: { width: 400, height: 300 }
		},
		{
			id: 'task-list',
			title: 'タスク一覧',
			icon: 'material-symbols:task',
			list: [
				{ name: 'プロジェクト企画', detail: '進行中' },
				{ name: 'デザイン作成', detail: '完了' },
				{ name: 'コーディング', detail: '進行中' }
			],
			position: { x: 440, y: 0 },
			size: { width: 360, height: 240 }
		},
		{
			id: 'note-list',
			title: 'メモ',
			icon: 'material-symbols:note',
			list: [
				{ name: '会議メモ', detail: '2024/01/15' },
				{ name: 'アイデア', detail: '新機能' }
			],
			position: { x: 0, y: 320 },
			size: { width: 320, height: 200 }
		}
	]);

	// グリッドにスナップする関数
	function snapToGrid(value: number): number {
		return Math.round(value / GRID_SIZE) * GRID_SIZE;
	}

	// カードの位置を更新
	function updateCardPosition(cardId: string, x: number, y: number) {
		const card = cards.find((c) => c.id === cardId);
		if (card) {
			card.position.x = snapToGrid(x);
			card.position.y = snapToGrid(y);
		}
	}

	// カードのサイズを更新
	function updateCardSize(cardId: string, width: number, height: number) {
		const card = cards.find((c) => c.id === cardId);
		if (card) {
			card.size.width = snapToGrid(width);
			card.size.height = snapToGrid(height);
		}
	}
</script>

<div
	class="w:100% h:100vh rel overflow:hidden bg:color-imemo-primary"
	style="background-image:radial-gradient(circle, rgba(134, 106, 80, 0.3) 1px, transparent 1px); background-size:{GRID_SIZE}px|{GRID_SIZE}px;"
>
	{#each cards as card (card.id)}
		<CardList
			id={card.id}
			title={card.title}
			icon={card.icon}
			list={card.list}
			position={card.position}
			size={card.size}
			draggable={true}
			resizable={true}
			gridSize={GRID_SIZE}
			onPositionChange={(x, y) => updateCardPosition(card.id, x, y)}
			onSizeChange={(width, height) => updateCardSize(card.id, width, height)}
		/>
	{/each}
</div>
