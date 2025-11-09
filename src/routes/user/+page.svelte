<script lang="ts">
	// 利用者管理ページ
	import UserList from '$lib/components/user/UserList.svelte';
	import UserSidebar from '$lib/components/user/UserSidebar.svelte';
	import type { User } from '$lib/types/user';
	import { userStore } from '$lib/stores/user.svelte';

	let selectedUser = $state<User | null>(null);
	let isSidebarOpen = $state(false);
	let isFullscreen = $state(false);
	let notification = $state<{ type: 'success' | 'error'; message: string } | null>(null);

	function handleUserSelect(user: User) {
		selectedUser = user;
		isSidebarOpen = true;
		// 通知をクリア
		notification = null;
	}

	function handleSidebarClose() {
		isSidebarOpen = false;
		selectedUser = null;
	}

	function handleToggleFullscreen() {
		isFullscreen = !isFullscreen;
	}

	async function handleUserUpdate(updatedUser: User) {
		try {
			const result = await userStore.updateUser(updatedUser.id, updatedUser);
			selectedUser = result;
			
			// 成功通知を表示
			notification = {
				type: 'success',
				message: '利用者情報を更新しました'
			};
			
			// 3秒後に通知を自動で消す
			setTimeout(() => {
				notification = null;
			}, 3000);
			
		} catch (error) {
			console.error('Failed to update user:', error);
			
			// エラー通知を表示
			notification = {
				type: 'error',
				message: error instanceof Error ? error.message : '利用者情報の更新に失敗しました'
			};
			
			// 5秒後に通知を自動で消す
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	function dismissNotification() {
		notification = null;
	}
</script>

<div class="p:16px w:100% h:fit bg:imemo-beige-50">
	<!-- Notification -->
	{#if notification}
		<div class="mb:16px p:16px r:8px border:2|solid {notification.type === 'success' ? 'bg:imemo-green border:imemo-green' : 'bg:imemo-pink border:imemo-pink'} flex ai:center jc:space-betwrrn box-shadow:md">
			<div class="flex ai:center gap:12px">
				{#if notification.type === 'success'}
					<svg class="w:24px h:24px text:white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
					</svg>
				{:else}
					<svg class="w:24px h:24px text:white" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
				{/if}
				<span class="font:16px  text:white">
					{notification.message}
				</span>
			</div>
			<button
				type="button"
				onclick={dismissNotification}
				class="text:white hover:opacity:80 transition-opacity"
				aria-label="通知を閉じる"
			>
				<svg class="w:20px h:20px" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- User List Container -->
	<div class="w:100% bg:var(--color-primary) r:16px b:2px|solid|var(--color-tertiary)">
		<UserList onUserSelect={handleUserSelect} class="h:full" />
	</div>
</div>

<!-- User Detail Sidebar -->
<UserSidebar
	user={selectedUser}
	isOpen={isSidebarOpen}
	{isFullscreen}
	onClose={handleSidebarClose}
	onToggleFullscreen={handleToggleFullscreen}
	onUserUpdate={handleUserUpdate}
/>
