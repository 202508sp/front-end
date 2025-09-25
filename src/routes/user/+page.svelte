<script lang="ts">
	// 利用者管理ページ
	import UserList from '$lib/components/user/UserList.svelte';
	import UserSidebar from '$lib/components/user/UserSidebar.svelte';
	import type { User } from '$lib/types/user';
	import { userStore } from '$lib/stores/user.svelte';

	let selectedUser = $state<User | null>(null);
	let isSidebarOpen = $state(false);
	let isFullscreen = $state(false);

	function handleUserSelect(user: User) {
		selectedUser = user;
		isSidebarOpen = true;
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
			await userStore.updateUser(updatedUser.id, updatedUser);
			selectedUser = updatedUser;
		} catch (error) {
			console.error('Failed to update user:', error);
		}
	}
</script>

<div class="p:6px">
	<h1 class="text:2xl font:bold text:care-text-primary mb:6px">利用者管理</h1>

	<div class="h:screen-80">
		<!-- 利用者一覧 -->
		<div class="bg:care-background-primary rounded:lg shadow:sm border:1|solid|care-gray-200 overflow:hidden h:full">
			<UserList onUserSelect={handleUserSelect} class="h:full" />
		</div>
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
