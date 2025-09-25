<!--
  UserStore と StaffStore の使用例
  このコンポーネントは実装されたストアの基本的な使用方法を示します
-->

<script lang="ts">
	import { userStore, staffStore } from '$lib/stores';
	import { type StaffRole } from '$lib/types';
	import { onMount } from 'svelte';

	// ストアの状態を取得
	let { users, filteredUsers, isLoading: userLoading, statistics: userStats } = $derived(userStore);
	let {
		staff,
		filteredStaff,
		isLoading: staffLoading,
		statistics: staffStats
	} = $derived(staffStore);

	// コンポーネントマウント時にデータを読み込み
	onMount(async () => {
		await userStore.loadUsers();
		await staffStore.loadStaff();
	});

	// 検索処理
	function handleUserSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		userStore.setSearchTerm(target.value);
	}

	function handleStaffSearch(event: Event) {
		const target = event.target as HTMLInputElement;
		staffStore.setSearchTerm(target.value);
	}

	// フィルタ処理
	function handleUserCareLevel(careLevel: number) {
		const currentFilter = userStore.filter.careLevel || [];
		const newFilter = currentFilter.includes(careLevel)
			? currentFilter.filter((level) => level !== careLevel)
			: [...currentFilter, careLevel];

		userStore.setFilter({ careLevel: newFilter });
	}

	function handleStaffRole(role: string) {
		const currentFilter = staffStore.filter.role || [];
		const newFilter = currentFilter.includes(role as any)
			? currentFilter.filter((r) => r !== role)
			: [...currentFilter, role as any];

		staffStore.setFilter({ role: newFilter });
	}
</script>

<div class="p:20px">
	<h1 class="font-size:24px font-weight:bold mb:20px">ストア使用例</h1>

	<!-- 利用者管理セクション -->
	<section class="mb:40px">
		<h2 class="font-size:20px font-weight:bold mb:16px">利用者管理 (UserStore)</h2>

		<!-- 統計情報 -->
		<div class="mb:16px p:16px bg:gray-100 border-radius:8px">
			<h3 class="font-size:16px font-weight:bold mb:8px">統計情報</h3>
			<div class="display:flex gap:16px">
				<span>総数: {userStats.total}</span>
				<span>アクティブ: {userStats.active}</span>
				<span>非アクティブ: {userStats.inactive}</span>
			</div>
		</div>

		<!-- 検索・フィルタ -->
		<div class="mb:16px">
			<input
				type="text"
				placeholder="利用者を検索..."
				oninput={handleUserSearch}
				class="p:8px border:1px|solid|gray-300 border-radius:4px mr:16px"
			/>

			<div class="display:inline-block">
				<span class="mr:8px">要介護度:</span>
				{#each [1, 2, 3, 4, 5] as level}
					<button
						onclick={() => handleUserCareLevel(level)}
						class="p:4px|8px mr:4px border:1px|solid|gray-300 border-radius:4px
                   {userStore.filter.careLevel?.includes(level)
							? 'bg:blue-500 color:white'
							: 'bg:white'}"
					>
						{level}
					</button>
				{/each}
			</div>
		</div>

		<!-- 利用者リスト -->
		<div class="border:1px|solid|gray-300 border-radius:8px">
			<div class="p:12px bg:gray-50 border-bottom:1px|solid|gray-300 font-weight:bold">
				利用者一覧 ({filteredUsers.length}件)
			</div>

			{#if userLoading}
				<div class="p:20px text-align:center">読み込み中...</div>
			{:else if filteredUsers.length === 0}
				<div class="p:20px text-align:center color:gray-500">該当する利用者がいません</div>
			{:else}
				{#each filteredUsers.slice(0, 5) as user (user.id)}
					<div
						class="p:12px border-bottom:1px|solid|gray-200 display:flex justify-content:space-between"
					>
						<div>
							<div class="font-weight:bold">{user.name}</div>
							<div class="font-size:14px color:gray-600">要介護度: {user.careLevel}</div>
						</div>
						<div class="font-size:14px color:gray-600">
							{user.isActive ? 'アクティブ' : '非アクティブ'}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<!-- 職員管理セクション -->
	<section>
		<h2 class="font-size:20px font-weight:bold mb:16px">職員管理 (StaffStore)</h2>

		<!-- 統計情報 -->
		<div class="mb:16px p:16px bg:gray-100 border-radius:8px">
			<h3 class="font-size:16px font-weight:bold mb:8px">統計情報</h3>
			<div class="display:flex gap:16px">
				<span>総数: {staffStats.total}</span>
				<span>アクティブ: {staffStats.active}</span>
				<span>非アクティブ: {staffStats.inactive}</span>
			</div>
			<div class="mt:8px">
				<span class="mr:16px">管理者: {staffStats.byRole.manager || 0}</span>
				<span class="mr:16px">介護士: {staffStats.byRole.caregiver || 0}</span>
				<span>看護師: {staffStats.byRole.nurse || 0}</span>
			</div>
		</div>

		<!-- 検索・フィルタ -->
		<div class="mb:16px">
			<input
				type="text"
				placeholder="職員を検索..."
				oninput={handleStaffSearch}
				class="p:8px border:1px|solid|gray-300 border-radius:4px mr:16px"
			/>

			<div class="display:inline-block">
				<span class="mr:8px">役職:</span>
				{#each ['manager', 'caregiver', 'nurse'] as role}
					<button
						onclick={() => handleStaffRole(role)}
						class="p:4px|8px mr:4px border:1px|solid|gray-300 border-radius:4px
                   {staffStore.filter.role?.includes(role as StaffRole)
							? 'bg:blue-500 color:white'
							: 'bg:white'}"
					>
						{role === 'manager' ? '管理者' : role === 'caregiver' ? '介護士' : '看護師'}
					</button>
				{/each}
			</div>
		</div>

		<!-- 職員リスト -->
		<div class="border:1px|solid|gray-300 border-radius:8px">
			<div class="p:12px bg:gray-50 border-bottom:1px|solid|gray-300 font-weight:bold">
				職員一覧 ({filteredStaff.length}件)
			</div>

			{#if staffLoading}
				<div class="p:20px text-align:center">読み込み中...</div>
			{:else if filteredStaff.length === 0}
				<div class="p:20px text-align:center color:gray-500">該当する職員がいません</div>
			{:else}
				{#each filteredStaff.slice(0, 5) as staffMember (staffMember.id)}
					<div
						class="p:12px border-bottom:1px|solid|gray-200 display:flex justify-content:space-between"
					>
						<div>
							<div class="font-weight:bold">{staffMember.name}</div>
							<div class="font-size:14px color:gray-600">
								{staffMember.role === 'manager'
									? '管理者'
									: staffMember.role === 'caregiver'
										? '介護士'
										: staffMember.role === 'nurse'
											? '看護師'
											: staffMember.role} - {staffMember.department}
							</div>
						</div>
						<div class="font-size:14px color:gray-600">
							{staffMember.isActive ? 'アクティブ' : '非アクティブ'}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</section>

	<!-- クリアボタン -->
	<div class="mt:20px">
		<button
			onclick={() => userStore.clearFilter()}
			class="p:8px|16px mr:8px bg:gray-500 color:white border:none border-radius:4px cursor:pointer"
		>
			利用者フィルタクリア
		</button>
		<button
			onclick={() => staffStore.clearFilter()}
			class="p:8px|16px bg:gray-500 color:white border:none border-radius:4px cursor:pointer"
		>
			職員フィルタクリア
		</button>
	</div>
</div>
