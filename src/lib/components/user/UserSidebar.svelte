<script lang="ts">
	import type { User } from '$lib/types/user';
	import Sidebar from '$lib/components/ui/Sidebar.svelte';
	import UserDetail from './UserDetail.svelte';

	interface Props {
		user: User | null;
		isOpen?: boolean;
		isFullscreen?: boolean;
		level?: number;
		onClose?: () => void;
		onToggleFullscreen?: () => void;
		onBack?: () => void;
		onUserUpdate?: (user: User) => void;
	}

	let {
		user,
		isOpen = false,
		isFullscreen = false,
		level = 1,
		onClose,
		onToggleFullscreen,
		onBack,
		onUserUpdate
	}: Props = $props();

	let isEditMode = $state(false);

	function handleEditToggle() {
		isEditMode = !isEditMode;
	}

	function handleUserSave(updatedUser: User) {
		onUserUpdate?.(updatedUser);
		isEditMode = false;
	}

	function handleEditCancel() {
		isEditMode = false;
	}
</script>

<Sidebar
	{isOpen}
	{isFullscreen}
	{level}
	title={user?.name || '利用者詳細'}
	subtitle={user?.nameKana}
	width="wide"
	{onClose}
	{onToggleFullscreen}
	{onBack}
>
	{#snippet actions()}
		{#if user && !isEditMode}
			<button
				type="button"
				class="flex ai:center jc:center w:36px h:36px r:8px bg:imemo-brown-400 hover:bg:imemo-brown-500 transition-colors focus:outline:none"
				onclick={handleEditToggle}
				aria-label="編集"
				title="利用者情報を編集"
			>
				<svg class="w:20px h:20px text:white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
				</svg>
			</button>
		{/if}
	{/snippet}

	{#if user}
		<UserDetail {user} {isEditMode} onSave={handleUserSave} onCancel={handleEditCancel} />
	{:else}
		<div class="flex ai:center jc:center h:full">
			<div class="text-center py:32px">
				<svg class="w:64px h:64px text:imemo-brown-300 mx:auto mb:16px" fill="currentColor" viewBox="0 0 24 24">
					<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
				</svg>
				<p class="font:16px text:imemo-brown-600">利用者を選択してください</p>
			</div>
		</div>
	{/if}
</Sidebar>
