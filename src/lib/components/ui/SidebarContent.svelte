<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '@iconify/svelte';

	interface SidebarContentItem {
		id: string;
		title: string;
		subtitle?: string;
		icon?: string;
		badge?: string | number;
		disabled?: boolean;
		children?: Snippet;
		onClick?: () => void;
	}

	interface Props {
		items?: SidebarContentItem[];
		selectedId?: string;
		level?: number;
		children?: Snippet;
		onItemClick?: (item: SidebarContentItem, level: number) => void;
	}

	let {
		items = [],
		selectedId = '',
		level = 1,
		children,
		onItemClick
	}: Props = $props();

	function handleItemClick(item: SidebarContentItem) {
		if (item.disabled) return;
		
		item.onClick?.();
		onItemClick?.(item, level);
	}

	function handleKeydown(event: KeyboardEvent, item: SidebarContentItem) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleItemClick(item);
		}
	}
</script>

<div class="sidebar-content" role="region" aria-label="サイドバーコンテンツ">
	{#if children}
		{@render children()}
	{:else if items.length > 0}
		<nav class="p:16px" aria-label="項目一覧">
			<ul class="space-y:2px" role="list">
				{#each items as item (item.id)}
					<li role="listitem">
						<button
							type="button"
							class="
								w:100% text:left p:12px|16px r:8px
								flex items:center gap:12px
								transition:all|200ms|ease-in-out
								{selectedId === item.id 
									? 'bg:blue-50 text:blue-700 border:1|solid|blue-200' 
									: 'bg:transparent text:gray-700 hover:bg:gray-50 border:1|solid|transparent'
								}
								{item.disabled 
									? 'opacity:50 cursor:not-allowed' 
									: 'cursor:pointer focus:outline:2|solid|blue-500 focus:outline-offset:2'
								}
							"
							disabled={item.disabled}
							onclick={() => handleItemClick(item)}
							onkeydown={(e) => handleKeydown(e, item)}
							aria-current={selectedId === item.id ? 'true' : 'false'}
							aria-disabled={item.disabled}
						>
							{#if item.icon}
								<div class="flex-shrink:0">
									<Icon 
										icon={item.icon} 
										class="w:20px h:20px {selectedId === item.id ? 'text:blue-600' : 'text:gray-500'}" 
									/>
								</div>
							{/if}

							<div class="flex:1 min-w:0">
								<div class=" text:14px truncate">
									{item.title}
								</div>
								{#if item.subtitle}
									<div class="text:12px text:gray-500 truncate mt:2px">
										{item.subtitle}
									</div>
								{/if}
							</div>

							{#if item.badge}
								<div class="
									flex-shrink:0 px:6px py:2px r:9999px
									bg:red-100 text:red-700 text:11px 
									min-w:20px text:center
								">
									{item.badge}
								</div>
							{/if}

							{#if item.children}
								<div class="flex-shrink:0">
									<Icon 
										icon="material-symbols:chevron-right" 
										class="w:16px h:16px text:gray-400" 
									/>
								</div>
							{/if}
						</button>

						<!-- Expanded content for level 2 -->
						{#if selectedId === item.id && item.children && level === 2}
							<div class="mt:8px ml:32px p:16px bg:gray-50 r:8px">
								{@render item.children()}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>
	{:else}
		<div class="p:32px text:center text:gray-500">
			<Icon icon="material-symbols:inbox" class="w:48px h:48px mx:auto mb:12px opacity:50" />
			<p class="text:14px">表示する項目がありません</p>
		</div>
	{/if}
</div>

<style>
	.sidebar-content {
		/* Ensure proper scrolling behavior */
		overflow-y: auto;
		height: 100%;
	}

	/* Focus styles for better accessibility */
	button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Smooth hover transitions */
	button {
		transition: all 0.2s ease-in-out;
	}

	/* Custom scrollbar */
	.sidebar-content::-webkit-scrollbar {
		width: 6px;
	}

	.sidebar-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-content::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	.sidebar-content::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>