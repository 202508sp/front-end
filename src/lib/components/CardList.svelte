<script lang="ts">
	import Icon from '@iconify/svelte';

	let { icon, id, title, list, size } = $props<{
		icon: string;
		id: string;
		title: string;
		list: { name: string; detail: string }[];
		size: {
			width: string;
			height: string;
		};
	}>();
</script>

<div
	class="grid-template-rows:60px|1fr bg:var(--color-primary) fg:var(--color-text) b:2.5px|solid|var(--color-tertiary) r:16px grid"
	style="width: {size.width}; height: {size.height};"
>
	<div
		class="w:100% h:100% bb:4px|double|var(--color-tertiary) grid-template-columns:120px|1fr|120px px:16px grid"
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
			<div class="w:100% h:45px grid-template-columns:120px|1fr py:8px grid bb:2px|solid|var(--color-tertiary) cursor:pointer">
				<div
					class="w:100% px:16px justify-content:start align-items:center gap:16px flex"
				>
					<Icon icon={item.icon} class="w:40px h:40px" />
					<span>{item.name}</span>
				</div>
				<div class=""></div>
			</div>
		{/each}
	</div>
</div>
