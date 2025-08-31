<script lang="ts">
	import CardList from '$lib/components/CardList.svelte';
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
		size={{ width: '400px', height: '300px' }}
		draggable={true}
        resizable
	/>
</div>
