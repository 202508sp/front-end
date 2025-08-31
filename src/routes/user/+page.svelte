<script lang="ts">
    import CardList from "$lib/components/CardList.svelte";
	import { onMount } from "svelte";

    let size = $state({ width: '400px', height: '300px' });

    const updateSize = () => {
        size = {
            width: `${window.innerWidth - 75 - 80}px`,
            height: `${window.innerHeight - 90 - 80}px`
        };
    }

    onMount(() => {
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => {
            window.removeEventListener('resize', updateSize);
        };
    });
</script>

<div class="w:100% h:100%">
    <CardList
		id="user-list"
		title="利用者一覧"
		icon="material-symbols:person"
		list={[
			{ name: '山田 太郎', detail: '' },
			{ name: '佐藤 花子', detail: '' },
			{ name: '鈴木 一郎', detail: '' }
		]}
		bind:size={size}
	/>
</div>