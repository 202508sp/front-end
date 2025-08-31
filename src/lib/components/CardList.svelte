<script lang="ts">
    import Icon from '@iconify/svelte';

    let {
        icon,
        id,
        title,
        list,
        size = $bindable({ width: '400px', height: '300px' }),
        draggable = false,
        resizable = false
    } = $props<{
        icon: string;
        id: string;
        title: string;
        list: { name: string; detail: string; icon?: string }[];
        size: { width: string; height: string };
        draggable?: boolean;
        resizable?: boolean;
    }>();

    let posX: number = $state(0);
    let posY: number = $state(0);

    let rootEl: HTMLDivElement | null = null;
    let headerEl: HTMLDivElement | null = null;

    function enableDrag() {
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

            const maxX = parentRect.width - cardRect.width;
            const maxY = parentRect.height - cardRect.height;
            if (nextX < 0) nextX = 0;
            if (nextY < 0) nextY = 0;
            if (nextX > maxX) nextX = maxX;
            if (nextY > maxY) nextY = maxY;

            posX = nextX;
            posY = nextY;
        };

        const stop = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', stop, true);
            headerEl?.releasePointerCapture(lastPointerId);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        let lastPointerId = 0;

        const onPointerDown = (e: PointerEvent) => {
            if (!draggable) return;
            lastPointerId = e.pointerId;
            headerEl?.setPointerCapture(lastPointerId);
            startX = e.clientX;
            startY = e.clientY;
            originX = posX;
            originY = posY;
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

    function enableResize() {
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

            if (nextW < 200) nextW = 200;
            if (nextH < 150) nextH = 150;

            const maxW = parentRect.width - posX;
            const maxH = parentRect.height - posY;
            if (nextW > maxW) nextW = maxW;
            if (nextH > maxH) nextH = maxH;

            size = {
                ...size,
                width: Math.max(400, nextW) + 'px',
                height: Math.max(300, nextH) + 'px'
            };
        };

        const stop = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', stop, true);
            resizeHandleEl?.releasePointerCapture(lastPointerId);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        let lastPointerId = 0;

        const onDown = (e: PointerEvent) => {
            if (!resizable) return;
            lastPointerId = e.pointerId;
            resizeHandleEl?.setPointerCapture(lastPointerId);
            startX = e.clientX;
            startY = e.clientY;
            startW = parseInt(size.width);
            startH = parseInt(size.height);
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
</script>

<div
    bind:this={rootEl}
    class="grid-template-rows:60px|1fr bg:var(--color-primary) fg:var(--color-text) b:2.5px|solid|var(--color-tertiary) r:16px grid"
    style="width: {size.width}; height: {size.height}; {draggable ? 'position:absolute;' : 'position:relative;'} transform: translate({posX}px, {posY}px); touch-action:none;"
>
    <div
        bind:this={headerEl}
        class="w:100% h:100% bb:4px|double|var(--color-tertiary) grid-template-columns:120px|1fr|120px px:16px grid {draggable ? 'cursor:grab' : ''}"
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
                class="w:100% h:45px grid-template-columns:120px|1fr py:8px bb:2px|solid|var(--color-tertiary) cursor:pointer grid"
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
            style="right:4px; bottom:4px; width:18px; height:18px; cursor:nwse-resize; background:linear-gradient(135deg, var(--color-tertiary) 0 40%, transparent 40% 100%); opacity:0.6; border-radius:4px;"
            aria-label="resize"
        ></div>
    {/if}
</div>