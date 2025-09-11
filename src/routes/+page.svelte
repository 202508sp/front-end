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

	// 矩形の衝突検知（1グリッド分のマージンを含む）
	function isColliding(
		rect1: { x: number; y: number; width: number; height: number },
		rect2: { x: number; y: number; width: number; height: number }
	): boolean {
		const margin = GRID_SIZE; // 1グリッド分のマージン
		return !(
			rect1.x + rect1.width + margin <= rect2.x ||
			rect2.x + rect2.width + margin <= rect1.x ||
			rect1.y + rect1.height + margin <= rect2.y ||
			rect2.y + rect2.height + margin <= rect1.y
		);
	}

	// 指定位置・サイズで他のカードと衝突するかチェック
	function checkCollision(
		cardId: string,
		x: number,
		y: number,
		width: number,
		height: number
	): boolean {
		const targetRect = { x, y, width, height };
		return cards.some((card) => {
			if (card.id === cardId) return false; // 自分自身は除外
			const cardRect = {
				x: card.position.x,
				y: card.position.y,
				width: card.size.width,
				height: card.size.height
			};
			return isColliding(targetRect, cardRect);
		});
	}

	// 有効な位置かチェック（境界内 & 衝突なし）
	function isValidPosition(
		cardId: string,
		x: number,
		y: number,
		width: number,
		height: number
	): boolean {
		// 境界チェック
		if (x < 0 || y < 0) return false;
		// 画面サイズは動的に取得するため、ここでは基本的な境界のみチェック

		// 衝突チェック
		return !checkCollision(cardId, x, y, width, height);
	}

	// 軸ごとの有効性チェック
	function getValidPosition(
		cardId: string,
		targetX: number,
		targetY: number,
		width: number,
		height: number,
		currentX: number,
		currentY: number
	): { x: number; y: number; canMoveX: boolean; canMoveY: boolean } {
		// X軸のみの移動をチェック
		const canMoveX = isValidPosition(cardId, targetX, currentY, width, height);
		// Y軸のみの移動をチェック
		const canMoveY = isValidPosition(cardId, currentX, targetY, width, height);
		// 両軸同時の移動をチェック
		const canMoveBoth = isValidPosition(cardId, targetX, targetY, width, height);

		let finalX = currentX;
		let finalY = currentY;

		if (canMoveBoth) {
			// 両方向に移動可能
			finalX = targetX;
			finalY = targetY;
		} else {
			// 個別軸での移動を試す
			if (canMoveX) finalX = targetX;
			if (canMoveY) finalY = targetY;
		}

		return {
			x: finalX,
			y: finalY,
			canMoveX: canMoveX || canMoveBoth,
			canMoveY: canMoveY || canMoveBoth
		};
	}

	// スマートな位置調整（半分を超えたら移動）
	function getSmartPosition(
		cardId: string,
		targetX: number,
		targetY: number,
		width: number,
		height: number,
		currentX: number,
		currentY: number
	): { x: number; y: number } {
		const card = cards.find((c) => c.id === cardId);
		if (!card) return { x: currentX, y: currentY };

		// 他のカードとの重複をチェックして、スマートな位置を見つける
		const otherCards = cards.filter((c) => c.id !== cardId);

		let bestX = targetX;
		let bestY = targetY;

		// 各軸で最適な位置を探す
		for (const otherCard of otherCards) {
			const otherRect = {
				x: otherCard.position.x,
				y: otherCard.position.y,
				width: otherCard.size.width,
				height: otherCard.size.height
			};

			const targetRect = { x: targetX, y: targetY, width, height };

			if (isColliding(targetRect, otherRect)) {
				// 衝突している場合、半分を超えているかチェック
				const overlapX =
					Math.min(targetX + width, otherRect.x + otherRect.width) - Math.max(targetX, otherRect.x);
				const overlapY =
					Math.min(targetY + height, otherRect.y + otherRect.height) -
					Math.max(targetY, otherRect.y);

				// X軸での調整
				if (overlapX > 0) {
					const halfWidth = width / 2;
					const targetCenterX = targetX + halfWidth;
					const otherCenterX = otherRect.x + otherRect.width / 2;

					if (Math.abs(targetCenterX - otherCenterX) > halfWidth) {
						// 半分を超えている場合、反対側に移動
						if (targetCenterX > otherCenterX) {
							bestX = otherRect.x + otherRect.width + GRID_SIZE;
						} else {
							bestX = otherRect.x - width - GRID_SIZE;
						}
					}
				}

				// Y軸での調整
				if (overlapY > 0) {
					const halfHeight = height / 2;
					const targetCenterY = targetY + halfHeight;
					const otherCenterY = otherRect.y + otherRect.height / 2;

					if (Math.abs(targetCenterY - otherCenterY) > halfHeight) {
						// 半分を超えている場合、反対側に移動
						if (targetCenterY > otherCenterY) {
							bestY = otherRect.y + otherRect.height + GRID_SIZE;
						} else {
							bestY = otherRect.y - height - GRID_SIZE;
						}
					}
				}
			}
		}

		// 境界チェック
		bestX = Math.max(0, bestX);
		bestY = Math.max(0, bestY);

		// グリッドにスナップ
		bestX = snapToGrid(bestX);
		bestY = snapToGrid(bestY);

		// 最終的な有効性チェック
		if (isValidPosition(cardId, bestX, bestY, width, height)) {
			return { x: bestX, y: bestY };
		}

		return { x: currentX, y: currentY };
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
			checkCollision={(x, y, width, height) => checkCollision(card.id, x, y, width, height)}
			isValidPosition={(x, y, width, height) => isValidPosition(card.id, x, y, width, height)}
			getValidPosition={(targetX, targetY, width, height, currentX, currentY) =>
				getValidPosition(card.id, targetX, targetY, width, height, currentX, currentY)}
			getSmartPosition={(targetX, targetY, width, height, currentX, currentY) =>
				getSmartPosition(card.id, targetX, targetY, width, height, currentX, currentY)}
		/>
	{/each}
</div>
