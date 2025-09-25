<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen?: boolean;
		isFullscreen?: boolean;
		title?: string;
		subtitle?: string;
		level?: number; // 0: closed, 1: sidebar, 2: expanded
		width?: 'narrow' | 'normal' | 'wide';
		children?: Snippet;
		actions?: Snippet;
		onClose?: () => void;
		onToggleFullscreen?: () => void;
		onBack?: () => void;
	}

	let {
		isOpen = false,
		isFullscreen = false,
		title = '',
		subtitle = '',
		level = 0,
		width = 'normal',
		children,
		actions,
		onClose,
		onToggleFullscreen,
		onBack
	}: Props = $props();

	let sidebarElement: HTMLElement = $state()!;
	let previousFocusedElement: HTMLElement | null = $state(null);

	// Handle keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleClose();
		} else if (event.key === 'F11' || (event.key === 'f' && event.ctrlKey)) {
			event.preventDefault();
			handleToggleFullscreen();
		} else if (event.key === 'Tab') {
			handleTabNavigation(event);
		}
	}

	// Handle tab navigation within sidebar
	function handleTabNavigation(event: KeyboardEvent) {
		if (!sidebarElement) return;

		const focusableElements = sidebarElement.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.shiftKey) {
			if (document.activeElement === firstElement) {
				event.preventDefault();
				lastElement?.focus();
			}
		} else {
			if (document.activeElement === lastElement) {
				event.preventDefault();
				firstElement?.focus();
			}
		}
	}

	function handleClose() {
		onClose?.();
		restoreFocus();
	}

	function handleToggleFullscreen() {
		onToggleFullscreen?.();
	}

	function handleBack() {
		onBack?.();
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleClose();
		}
	}

	function saveFocus() {
		previousFocusedElement = document.activeElement as HTMLElement;
	}

	function restoreFocus() {
		previousFocusedElement?.focus();
		previousFocusedElement = null;
	}

	// Focus management
	$effect(() => {
		if (isOpen && sidebarElement) {
			saveFocus();
			// Focus first focusable element
			const firstFocusable = sidebarElement.querySelector(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			) as HTMLElement;
			firstFocusable?.focus();
		}
	});

	// Get width classes based on level and width prop
	function getWidthClasses() {
		if (isFullscreen) return 'w:100vw';
		
		const baseWidths = {
			narrow: level === 1 ? 'w:320px' : 'w:480px',
			normal: level === 1 ? 'w:400px' : 'w:600px',
			wide: level === 1 ? 'w:480px' : 'w:720px'
		};

		return `${baseWidths[width]} max-w:90vw`;
	}

	// Get responsive classes
	function getResponsiveClasses() {
		if (isFullscreen) return 'w:100vw h:100vh';
		
		return `
			w:100vw h:100vh
			@md:w:auto @md:h:100vh @md:max-w:90vw
			@lg:${getWidthClasses()}
		`;
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Overlay -->
	<div
		class="
			fixed inset:0 bg:black/.5 z:1000
			@md:bg:transparent @md:pointer-events:none
		"
		onclick={handleOverlayClick}
		role="presentation"
	>
		<!-- Sidebar Container -->
		<div
			bind:this={sidebarElement}
			class="
				fixed top:0 right:0 h:100vh bg:white shadow:xl
				flex flex:col
				transform transition:transform|300ms|ease-in-out
				{getResponsiveClasses()}
				{isOpen ? 'translate-x:0' : 'translate-x:100%'}
			"
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? 'sidebar-title' : undefined}
			aria-describedby={subtitle ? 'sidebar-subtitle' : undefined}
		>
			<!-- Header -->
			<header class="
				flex items:center justify:between p:16px|20px
				border-b:1|solid|gray-200 bg:gray-50
				min-h:64px
			">
				<div class="flex items:center gap:12px flex:1 min-w:0">
					{#if level > 1 && onBack}
						<button
							type="button"
							class="
								flex items:center justify:center w:32px h:32px
								rounded:6px bg:transparent hover:bg:gray-100
								transition:background-color|200ms
								focus:outline:2|solid|blue-500 focus:outline-offset:2
							"
							onclick={handleBack}
							aria-label="戻る"
						>
							<Icon icon="material-symbols:arrow-back" class="w:20px h:20px text:gray-600" />
						</button>
					{/if}

					<div class="flex:1 min-w:0">
						{#if title}
							<h2 id="sidebar-title" class="
								font:600 text:16px text:gray-900 truncate
								@md:text:18px
							">
								{title}
							</h2>
						{/if}
						{#if subtitle}
							<p id="sidebar-subtitle" class="
								text:14px text:gray-600 truncate mt:2px
							">
								{subtitle}
							</p>
						{/if}
					</div>
				</div>

				<div class="flex items:center gap:8px ml:12px">
					{#if actions}
						{@render actions()}
					{/if}

					<!-- Fullscreen Toggle -->
					{#if onToggleFullscreen}
						<button
							type="button"
							class="
								flex items:center justify:center w:32px h:32px
								rounded:6px bg:transparent hover:bg:gray-100
								transition:background-color|200ms
								focus:outline:2|solid|blue-500 focus:outline-offset:2
							"
							onclick={handleToggleFullscreen}
							aria-label={isFullscreen ? '通常表示に戻す' : '全画面表示'}
							title={isFullscreen ? '通常表示に戻す (F11)' : '全画面表示 (F11)'}
						>
							<Icon 
								icon={isFullscreen ? 'material-symbols:fullscreen-exit' : 'material-symbols:fullscreen'} 
								class="w:20px h:20px text:gray-600" 
							/>
						</button>
					{/if}

					<!-- Close Button -->
					<button
						type="button"
						class="
							flex items:center justify:center w:32px h:32px
							rounded:6px bg:transparent hover:bg:gray-100
							transition:background-color|200ms
							focus:outline:2|solid|blue-500 focus:outline-offset:2
						"
						onclick={handleClose}
						aria-label="閉じる"
						title="閉じる (Esc)"
					>
						<Icon icon="material-symbols:close" class="w:20px h:20px text:gray-600" />
					</button>
				</div>
			</header>

			<!-- Content -->
			<main class="flex:1 overflow:auto">
				{#if children}
					{@render children()}
				{/if}
			</main>
		</div>
	</div>
{/if}

<style>
	/* Ensure smooth transitions on mobile */
	@media (max-width: 768px) {
		.sidebar-container {
			will-change: transform;
		}
	}

	/* Custom scrollbar for content area */
	main::-webkit-scrollbar {
		width: 6px;
	}

	main::-webkit-scrollbar-track {
		background: transparent;
	}

	main::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 3px;
	}

	main::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>