<script lang="ts">
    import Icon from '@iconify/svelte';

    let {
        icon,
        id,
        title,
        list,
        position = { x: 0, y: 0 },
        size = { width: 400, height: 300 },
        draggable = false,
        resizable = false,
        gridSize = 20,
        onPositionChange,
        onSizeChange,
        checkCollision,
        isValidPosition,
        getValidPosition,
        getSmartPosition
    } = $props<{
        icon: string;
        id: string;
        title: string;
        list: { name: string; detail: string; icon?: string }[];
        position?: { x: number; y: number };
        size?: { width: number; height: number };
        draggable?: boolean;
        resizable?: boolean;
        gridSize?: number;
        onPositionChange?: (x: number, y: number) => void;
        onSizeChange?: (width: number, height: number) => void;
        checkCollision?: (x: number, y: number, width: number, height: number) => boolean;
        isValidPosition?: (x: number, y: number, width: number, height: number) => boolean;
        getValidPosition?: (targetX: number, targetY: number, width: number, height: number, currentX: number, currentY: number) => { x: number; y: number; canMoveX: boolean; canMoveY: boolean };
        getSmartPosition?: (targetX: number, targetY: number, width: number, height: number, currentX: number, currentY: number) => { x: number; y: number };
    }>();

    let posX: number = $state(position.x);
    let posY: number = $state(position.y);
    let cardWidth: number = $state(size.width);
    let cardHeight: number = $state(size.height);
    let isDragging: boolean = $state(false);
    let isResizing: boolean = $state(false);
    let isBlocked: boolean = $state(false); // 移動/リサイズがブロックされている状態
    let blockedX: boolean = $state(false); // X軸の移動がブロックされている状態
    let blockedY: boolean = $state(false); // Y軸の移動がブロックされている状態
    
    // ドラッグ中の一時的な位置（衝突時は元の位置を保持）
    let tempPosX: number = $state(position.x);
    let tempPosY: number = $state(position.y);
    
    // スマート移動のためのタイマー
    let moveTimer: ReturnType<typeof setTimeout> | null = null;
    const SMART_MOVE_DELAY = 500; // 500ms後にスマート移動を試行

    // グリッドにスナップする関数
    function snapToGrid(value: number): number {
        return Math.round(value / gridSize) * gridSize;
    }

    let rootEl: HTMLDivElement | null = null;
    let headerEl: HTMLDivElement | null = null;

    const enableDrag = () => {
        if (!draggable || !headerEl || !rootEl) return;

        let startX = 0;
        let startY = 0;
        let originX = 0;
        let originY = 0;
        let parentRect: DOMRect;
        let cardRect: DOMRect;

        const onPointerMove = (e: PointerEvent) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let nextX = originX + dx;
            let nextY = originY + dy;

            // 境界チェック
            const maxX = parentRect.width - cardRect.width;
            const maxY = parentRect.height - cardRect.height;
            if (nextX < 0) nextX = 0;
            if (nextY < 0) nextY = 0;
            if (nextX > maxX) nextX = maxX;
            if (nextY > maxY) nextY = maxY;

            // グリッドにスナップ
            const snappedX = snapToGrid(nextX);
            const snappedY = snapToGrid(nextY);
            
            // 軸ごとの移動可能性をチェック
            if (getValidPosition) {
                const result = getValidPosition(snappedX, snappedY, cardWidth, cardHeight, posX, posY);
                
                // 位置を更新
                posX = result.x;
                posY = result.y;
                tempPosX = result.x;
                tempPosY = result.y;
                
                // ブロック状態を更新
                blockedX = !result.canMoveX && snappedX !== posX;
                blockedY = !result.canMoveY && snappedY !== posY;
                isBlocked = blockedX || blockedY;
                
                // スマート移動のタイマーを設定
                if (isBlocked && getSmartPosition) {
                    if (moveTimer) clearTimeout(moveTimer);
                    moveTimer = setTimeout(() => {
                        const smartPos = getSmartPosition!(snappedX, snappedY, cardWidth, cardHeight, posX, posY);
                        if (smartPos.x !== posX || smartPos.y !== posY) {
                            posX = smartPos.x;
                            posY = smartPos.y;
                            tempPosX = smartPos.x;
                            tempPosY = smartPos.y;
                            isBlocked = false;
                            blockedX = false;
                            blockedY = false;
                        }
                    }, SMART_MOVE_DELAY);
                }
            } else {
                // フォールバック: 従来のロジック
                if (isValidPosition && isValidPosition(snappedX, snappedY, cardWidth, cardHeight)) {
                    posX = snappedX;
                    posY = snappedY;
                    tempPosX = snappedX;
                    tempPosY = snappedY;
                    isBlocked = false;
                    blockedX = false;
                    blockedY = false;
                } else {
                    isBlocked = true;
                }
            }
        };

        const stop = () => {
            isDragging = false;
            isBlocked = false;
            blockedX = false;
            blockedY = false;
            
            // タイマーをクリア
            if (moveTimer) {
                clearTimeout(moveTimer);
                moveTimer = null;
            }
            
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', stop, true);
            headerEl?.releasePointerCapture(lastPointerId);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            
            // 親コンポーネントに位置変更を通知（既にスナップ済み）
            onPositionChange?.(posX, posY);
        };

        let lastPointerId = 0;

        const onPointerDown = (e: PointerEvent) => {
            if (!draggable) return;
            isDragging = true;
            lastPointerId = e.pointerId;
            headerEl?.setPointerCapture(lastPointerId);
            startX = e.clientX;
            startY = e.clientY;
            originX = posX;
            originY = posY;
            tempPosX = posX;
            tempPosY = posY;
            parentRect = rootEl!.parentElement!.getBoundingClientRect();
            cardRect = rootEl!.getBoundingClientRect();
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
            window.addEventListener('pointermove', onPointerMove);
            window.addEventListener('pointerup', stop, true);
        };

        headerEl.addEventListener('pointerdown', onPointerDown);

        return () => {
            headerEl?.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', stop, true);
        };
    }

    $effect(() => enableDrag());

    let resizeHandleEl: HTMLDivElement | null = $state(null);

    const enableResize = () => {
        if (!resizable || !resizeHandleEl || !rootEl) return;
        let startX = 0;
        let startY = 0;
        let startW = 0;
        let startH = 0;
        let parentRect: DOMRect;

        const onMove = (e: PointerEvent) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let nextW = startW + dx;
            let nextH = startH + dy;

            // 最小サイズ制限（グリッドサイズの倍数）
            const minWidth = Math.max(200, gridSize * 5); // 最小5グリッド
            const minHeight = Math.max(150, gridSize * 4); // 最小4グリッド
            if (nextW < minWidth) nextW = minWidth;
            if (nextH < minHeight) nextH = minHeight;

            // 最大サイズ制限（親要素の境界内）
            const maxW = parentRect.width - posX;
            const maxH = parentRect.height - posY;
            if (nextW > maxW) nextW = maxW;
            if (nextH > maxH) nextH = maxH;

            // グリッドにスナップ
            const snappedW = snapToGrid(nextW);
            const snappedH = snapToGrid(nextH);
            
            // 軸ごとのリサイズ可能性をチェック
            const canResizeW = !isValidPosition || isValidPosition(posX, posY, snappedW, cardHeight);
            const canResizeH = !isValidPosition || isValidPosition(posX, posY, cardWidth, snappedH);
            const canResizeBoth = !isValidPosition || isValidPosition(posX, posY, snappedW, snappedH);
            
            // サイズを更新
            if (canResizeBoth) {
                cardWidth = snappedW;
                cardHeight = snappedH;
                isBlocked = false;
            } else {
                if (canResizeW) cardWidth = snappedW;
                if (canResizeH) cardHeight = snappedH;
                isBlocked = !canResizeW || !canResizeH;
            }
        };

        const stop = () => {
            isResizing = false;
            isBlocked = false;
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', stop, true);
            resizeHandleEl?.releasePointerCapture(lastPointerId);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            
            // 親コンポーネントにサイズ変更を通知（既にスナップ済み）
            onSizeChange?.(cardWidth, cardHeight);
        };

        let lastPointerId = 0;

        const onDown = (e: PointerEvent) => {
            if (!resizable) return;
            isResizing = true;
            lastPointerId = e.pointerId;
            resizeHandleEl?.setPointerCapture(lastPointerId);
            startX = e.clientX;
            startY = e.clientY;
            startW = cardWidth;
            startH = cardHeight;
            parentRect = rootEl!.parentElement!.getBoundingClientRect();
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'nwse-resize';
            window.addEventListener('pointermove', onMove);
            window.addEventListener('pointerup', stop, true);
        };

        resizeHandleEl.addEventListener('pointerdown', onDown);
        return () => {
            resizeHandleEl?.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', stop, true);
        };
    }

    $effect(() => enableResize());

    // 位置とサイズの初期化
    $effect(() => {
        posX = position.x;
        posY = position.y;
        tempPosX = position.x;
        tempPosY = position.y;
        cardWidth = size.width;
        cardHeight = size.height;
    });

    // クリーンアップ
    $effect(() => {
        return () => {
            if (moveTimer) {
                clearTimeout(moveTimer);
                moveTimer = null;
            }
        };
    });
</script>

<div
    bind:this={rootEl}
    class="grid-template-rows:60px|1fr bg:color-imemo-secondary fg:color-imemo-text b:2.5px|solid|color-imemo-tertiary r:16px grid shadow:0|4px|12px|rgba(0,0,0,0.15)"
    style="width: {cardWidth}px; height: {cardHeight}px; position: absolute; transform: translate({posX}px, {posY}px); touch-action: none; z-index: {isDragging || isResizing ? 10 : 1}; transition: {isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease'};"
    class:dragging={isDragging}
    class:resizing={isResizing}
    class:blocked={isBlocked}
    class:blocked-x={blockedX}
    class:blocked-y={blockedY}
>
    <div
        bind:this={headerEl}
        class="w:100% h:100% bb:4px|double|color-imemo-tertiary grid-template-columns:120px|1fr|120px px:16px grid {draggable ? 'cursor:grab' : ''}"
    >
        <div class="flex-direction:column align-items:start justify-content:center flex">
            <h2>{title}</h2>
        </div>
        <div class="flex-direction:column align-items:start justify-content:center flex">
            <h2>詳細</h2>
        </div>
        <div class="flex-direction:column align-items:end justify-content:center flex">
            <h2>操作</h2>
        </div>
    </div>
    <div class="w:100% h:fit">
        {#each list as item}
            <div
                class="w:100% h:45px grid-template-columns:120px|1fr py:8px bb:2px|solid|color-imemo-tertiary cursor:pointer grid hover:bg:rgba(134,106,80,0.1)"
            >
                <div class="w:100% px:16px justify-content:start align-items:center gap:16px flex">
                    {#if item.icon}
                        <Icon icon={item.icon} class="w:40px h:40px" />
                    {/if}
                    <span>{item.name}</span>
                </div>
                <div class=""></div>
            </div>
        {/each}
    </div>
    {#if resizable}
        <div
            bind:this={resizeHandleEl}
            class="abs"
            style="right:4px; bottom:4px; width:18px; height:18px; cursor:nwse-resize; background:linear-gradient(135deg, rgba(134, 106, 80, 1) 0 40%, transparent 40% 100%); opacity:0.6; border-radius:4px;"
            aria-label="resize"
        ></div>
    {/if}
</div>

<style>
    .dragging {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25) !important;
        transform-origin: center;
    }
    
    .resizing {
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2) !important;
    }
    
    .blocked {
        box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3) !important;
        border-color: rgba(255, 0, 0, 0.5) !important;
    }
    
    .blocked-x {
        border-left-color: rgba(255, 0, 0, 0.7) !important;
        border-right-color: rgba(255, 0, 0, 0.7) !important;
    }
    
    .blocked-y {
        border-top-color: rgba(255, 0, 0, 0.7) !important;
        border-bottom-color: rgba(255, 0, 0, 0.7) !important;
    }
</style>