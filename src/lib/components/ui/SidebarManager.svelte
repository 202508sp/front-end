<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import SidebarContent from './SidebarContent.svelte';

	interface SidebarLevel {
		id: string;
		title: string;
		subtitle?: string;
		content: Snippet;
		actions?: Snippet;
	}

	interface Props {
		isOpen?: boolean;
		isFullscreen?: boolean;
		levels?: SidebarLevel[];
		currentLevel?: number;
		width?: 'narrow' | 'normal' | 'wide';
		onClose?: () => void;
		onToggleFullscreen?: () => void;
		onLevelChange?: (level: number, direction: 'forward' | 'back') => void;
	}

	let {
		isOpen = false,
		isFullscreen = false,
		levels = [],
		currentLevel = 0,
		width = 'normal',
		onClose,
		onToggleFullscreen,
		onLevelChange
	}: Props = $props();

	// Navigation history for back button
	let navigationHistory: number[] = $state([]);

	// Current level data
	let currentLevelData = $derived(levels[currentLevel] || null);

	function handleClose() {
		navigationHistory = [];
		onClose?.();
	}

	function handleToggleFullscreen() {
		onToggleFullscreen?.();
	}

	function handleBack() {
		if (navigationHistory.length > 0) {
			const previousLevel = navigationHistory.pop();
			if (previousLevel !== undefined) {
				currentLevel = previousLevel;
				onLevelChange?.(currentLevel, 'back');
			}
		} else if (currentLevel > 0) {
			currentLevel = 0;
			onLevelChange?.(currentLevel, 'back');
		}
	}

	function navigateToLevel(level: number) {
		if (level !== currentLevel && level < levels.length) {
			navigationHistory.push(currentLevel);
			currentLevel = level;
			onLevelChange?.(currentLevel, 'forward');
		}
	}

	// Expose navigation method
	export function goToLevel(level: number) {
		navigateToLevel(level);
	}

	// Reset navigation when sidebar closes
	$effect(() => {
		if (!isOpen) {
			navigationHistory = [];
			currentLevel = 0;
		}
	});
</script>

{#if currentLevelData}
	<Sidebar
		{isOpen}
		{isFullscreen}
		{width}
		title={currentLevelData.title}
		subtitle={currentLevelData.subtitle}
		level={currentLevel + 1}
		actions={currentLevelData.actions}
		onClose={handleClose}
		onToggleFullscreen={handleToggleFullscreen}
		onBack={currentLevel > 0 ? handleBack : undefined}
	>
		{@render currentLevelData.content()}
	</Sidebar>
{/if}