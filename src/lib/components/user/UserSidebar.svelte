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
				class="
					items:center justify:center w:32px h:32px r:6px
					bg:transparent hover:bg:gray-100 transition:background-color|200ms
					focus:outline:2|solid|blue-500
					focus:outline-offset:2 flex
				"
				onclick={handleEditToggle}
				aria-label="編集"
				title="利用者情報を編集"
			>
				<iconify-icon icon="material-symbols:edit" class="w:20px h:20px text:gray-600"
				></iconify-icon>
			</button>
		{/if}
	{/snippet}

	{#if user}
		<UserDetail {user} {isEditMode} onSave={handleUserSave} onCancel={handleEditCancel} />
	{:else}
		<div class="items:center justify:center h:full flex">
			<div class="text:center py:8">
				<iconify-icon icon="material-symbols:person" class="w:48px h:48px text:gray-300 mb:4"
				></iconify-icon>
				<p class="text:gray-500">利用者を選択してください</p>
			</div>
		</div>
	{/if}
</Sidebar>
