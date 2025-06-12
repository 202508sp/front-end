<script lang="ts">

    let { icon, id, title, list, size } = $props<{
        icon: string;
        id: string;
        title: string;
        list: { name: string; icon: string }[];
        size: {
            width: string;
            height: string;
        };
    }>();
</script>

<div
    class="grid grid-template-rows:60px|1fr bg:var(--color-primary) fg:var(--color-text) b:2.5px|solid|var(--color-tertiary) r:16px"
    style="width: {size.width}; height: {size.height};"
>
    <div class="w:100% h:100% bb:4px|double|var(--color-tertiary)"></div>
    <div></div>
</div>
