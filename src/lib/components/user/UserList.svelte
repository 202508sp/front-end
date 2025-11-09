<script lang="ts">
	import type { User, UserFilter, UserSortOption } from '$lib/types/user';
	import { userStore } from '$lib/stores/user.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { onMount, untrack } from 'svelte';
	import { formatDate } from '$lib/utils';

	interface Props {
		onUserSelect?: (user: User) => void;
		class?: string;
		'data-testid'?: string;
	}

	let {
		onUserSelect,
		class: className = '',
		'data-testid': testId = 'user-list'
	}: Props = $props();

	// Local state for filters
	let searchInput = $state('');
	let selectedCareLevel = $state<number[]>([]);
	let selectedGender = $state<('male' | 'female' | 'other')[]>([]);
	let selectedStatus = $state<('active' | 'inactive')[]>(['active']);
	let ageRangeMin = $state<number | undefined>();
	let ageRangeMax = $state<number | undefined>();
	let showFilters = $state(false);

	// Sort options
	const sortOptions: { value: keyof User; label: string }[] = [
		{ value: 'name', label: '名前' },
		{ value: 'nameKana', label: 'フリガナ' },
		{ value: 'careLevel', label: '要介護度' },
		{ value: 'birthDate', label: '生年月日' },
		{ value: 'admissionDate', label: '入所日' },
		{ value: 'updatedAt', label: '更新日' }
	];

	// Care level options
	const careLevelOptions = [
		{ value: 1, label: '要介護1' },
		{ value: 2, label: '要介護2' },
		{ value: 3, label: '要介護3' },
		{ value: 4, label: '要介護4' },
		{ value: 5, label: '要介護5' }
	];

	// Gender options
	const genderOptions = [
		{ value: 'male' as const, label: '男性' },
		{ value: 'female' as const, label: '女性' },
		{ value: 'other' as const, label: 'その他' }
	];

	// Status options
	const statusOptions = [
		{ value: 'active' as const, label: 'アクティブ' },
		{ value: 'inactive' as const, label: '非アクティブ' }
	];

	// Items per page options
	const itemsPerPageOptions = [10, 20, 50, 100];

	// Load users on mount
	onMount(() => {
		userStore.loadUsers();
	});

	// Apply search filter
	$effect(() => {
		userStore.setSearchTerm(searchInput);
	});

	// Apply other filters
	$effect(() => {
		// Capture dependencies
		const careLevel = selectedCareLevel;
		const gender = selectedGender;
		const status = selectedStatus;
		const minAge = ageRangeMin;
		const maxAge = ageRangeMax;

		untrack(() => {
			const filter: UserFilter = {};

			if (careLevel.length > 0) {
				filter.careLevel = careLevel;
			}

			if (gender.length > 0) {
				filter.gender = gender;
			}

			if (status.length > 0) {
				filter.status = status;
			}

			if (minAge !== undefined || maxAge !== undefined) {
				filter.ageRange = {
					min: minAge ?? 0,
					max: maxAge ?? 150
				};
			}

			userStore.setFilter(filter);
		});
	});

	// Handle user selection
	function handleUserClick(user: User) {
		userStore.selectUser(user);
		onUserSelect?.(user);
	}

	// Handle sort change
	function handleSortChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const [field, direction] = target.value.split('-') as [keyof User, 'asc' | 'desc'];
		userStore.setSortOption({ field, direction });
	}

	// Handle page change
	function handlePageChange(page: number) {
		userStore.setPage(page);
	}

	// Handle items per page change
	function handleItemsPerPageChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		userStore.setItemsPerPage(parseInt(target.value));
	}

	// Clear all filters
	function clearFilters() {
		searchInput = '';
		selectedCareLevel = [];
		selectedGender = [];
		selectedStatus = ['active'];
		ageRangeMin = undefined;
		ageRangeMax = undefined;
		userStore.clearFilter();
	}

	// Toggle filter in array
	function toggleFilter<T>(array: T[], value: T): T[] {
		const index = array.indexOf(value);
		if (index === -1) {
			return [...array, value];
		} else {
			return array.filter((item) => item !== value);
		}
	}

	// Calculate age from birth date
	function calculateAge(birthDate: Date): number {
		const today = new Date();
		const age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();

		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
			return age - 1;
		}

		return age;
	}

	// Generate pagination pages
	function getPaginationPages(currentPage: number, totalPages: number): (number | '...')[] {
		const pages: (number | '...')[] = [];
		const maxVisiblePages = 7;

		if (totalPages <= maxVisiblePages) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			pages.push(1);

			if (currentPage > 4) {
				pages.push('...');
			}

			const start = Math.max(2, currentPage - 2);
			const end = Math.min(totalPages - 1, currentPage + 2);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - 3) {
				pages.push('...');
			}

			pages.push(totalPages);
		}

		return pages;
	}
</script>

<div class="h:full flex flex:column {className}" data-testid={testId}>
	<!-- Header with search and controls -->
	<div class="flex-shrink:0 p:16px bg:imemo-beige-100 r:8px m:16px box-shadow:md">
		<div class="mb:16px flex ai:center jc:space-betwrrn">
			<div class="gap:8px flex ai:center">
				<svg class="w:24px h:24px" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
				<h2 class="font:20px text:imemo-brown-700">利用者　一覧</h2>
			</div>
			<div class="gap:8px bg:imemo-beige-50 px:12px py:6px r:8px flex ai:center">
				<span class="font:14px text:imemo-brown-600"> 結果 </span>
				<span class="font:14px text:imemo-brown-700">
					{userStore.sortedUsers.length}件
				</span>
			</div>
		</div>

		<!-- Search and Filter Controls -->
		<div class="gap:8px mb:16px flex ai:center">
			<div class="rel flex-1">
				<svg
					class="abs left:12px top:50% translateY(-50%) w:16px h:16px text:imemo-brown-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
				<input
					type="search"
					bind:value={searchInput}
					placeholder="名前、フリガナ、IDで検索..."
					class="w:full pl:40px pr:12px py:10px bg:white border:1|solid|imemo-brown-200 r:8px font:14px text:imemo-brown-700 placeholder:text:imemo-brown-300 focus:outline:none focus:border:imemo-brown-400"
					data-testid="search-input"
				/>
			</div>
			<button
				onclick={() => (showFilters = !showFilters)}
				class="gap:6px px:16px py:10px bg:imemo-brown-400 text:white r:8px font:14px  hover:bg:imemo-brown-500 border:none flex cursor-pointer ai:center transition-colors"
				data-testid="toggle-filters"
			>
				<svg class="w:16px h:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
					/>
				</svg>
				編集
			</button>
			<button
				aria-label="buttons"
				onclick={clearFilters}
				class="gap:6px px:16px py:10px bg:white border:1|solid|imemo-brown-300 text:imemo-brown-600 r:8px font:14px  hover:bg:imemo-beige-50 flex cursor-pointer ai:center transition-colors"
				data-testid="clear-filters"
			>
				<svg class="w:16px h:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			</button>
		</div>

		<!-- Filters -->
		{#if showFilters}
			<div
				class="grid-cols:1 md:grid-cols:2 lg:grid-cols:4 gap:12px p:16px bg:imemo-beige-50 r:8px border:1|solid|imemo-brown-200 grid"
			>
				<!-- Care Level Filter -->
				<fieldset>
					<legend class="font:14px text:imemo-brown-700 mb:8px block">要介護度</legend>
					<div class="gap:6px flex flex:column">
						{#each careLevelOptions as option}
							<label class="flex cursor-pointer ai:center">
								<input
									type="checkbox"
									checked={selectedCareLevel.includes(option.value)}
									onchange={() =>
										(selectedCareLevel = toggleFilter(selectedCareLevel, option.value))}
									class="mr:8px w:16px h:16px cursor-pointer"
									data-testid="care-level-{option.value}"
								/>
								<span class="font:14px text:imemo-brown-600">{option.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<!-- Gender Filter -->
				<fieldset>
					<legend class="font:14px text:imemo-brown-700 mb:8px block">性別</legend>
					<div class="gap:6px flex flex:column">
						{#each genderOptions as option}
							<label class="flex cursor-pointer ai:center">
								<input
									type="checkbox"
									checked={selectedGender.includes(option.value)}
									onchange={() => (selectedGender = toggleFilter(selectedGender, option.value))}
									class="mr:8px w:16px h:16px cursor-pointer"
									data-testid="gender-{option.value}"
								/>
								<span class="font:14px text:imemo-brown-600">{option.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<!-- Status Filter -->
				<fieldset>
					<legend class="font:14px text:imemo-brown-700 mb:8px block">ステータス</legend>
					<div class="gap:6px flex flex:column">
						{#each statusOptions as option}
							<label class="flex cursor-pointer ai:center">
								<input
									type="checkbox"
									checked={selectedStatus.includes(option.value)}
									onchange={() => (selectedStatus = toggleFilter(selectedStatus, option.value))}
									class="mr:8px w:16px h:16px cursor-pointer"
									data-testid="status-{option.value}"
								/>
								<span class="font:14px text:imemo-brown-600">{option.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<!-- Age Range Filter -->
				<fieldset>
					<legend class="font:14px text:imemo-brown-700 mb:8px block">年齢範囲</legend>
					<div class="gap:8px flex ai:center">
						<input
							type="number"
							bind:value={ageRangeMin}
							placeholder="最小"
							min={0}
							max={150}
							class="w:full px:12px py:8px bg:white border:1|solid|imemo-brown-200 r:8px font:14px text:imemo-brown-700 focus:outline:none focus:border:imemo-brown-400"
							data-testid="age-min"
						/>
						<span class="font:14px text:imemo-brown-400">〜</span>
						<input
							type="number"
							bind:value={ageRangeMax}
							placeholder="最大"
							min={0}
							max={150}
							class="w:full px:12px py:8px bg:white border:1|solid|imemo-brown-200 r:8px font:14px text:imemo-brown-700 focus:outline:none focus:border:imemo-brown-400"
							data-testid="age-max"
						/>
					</div>
				</fieldset>
			</div>
		{/if}

		<!-- Sort and Items per page -->
		<div class="mt:16px pt:16px border-t:1|solid|imemo-brown-200 flex ai:center jc:space-betwrrn">
			<div class="gap:16px flex ai:center">
				<div class="gap:8px flex ai:center">
					<svg
						class="w:16px h:16px text:imemo-brown-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
						/>
					</svg>
					<select
						id="sort-select"
						onchange={handleSortChange}
						class="px:12px py:8px border:1|solid|imemo-brown-200 r:8px font:14px text:imemo-brown-700 bg:white focus:outline:none focus:border:imemo-brown-400 cursor-pointer"
						data-testid="sort-select"
					>
						{#each sortOptions as option}
							<option value="{option.value}-asc">{option.label} (昇順)</option>
							<option value="{option.value}-desc">{option.label} (降順)</option>
						{/each}
					</select>
				</div>

				<div class="gap:8px flex ai:center">
					<span class="font:14px text:imemo-brown-600">表示件数:</span>
					<select
						id="items-per-page-select"
						value={userStore.itemsPerPage}
						onchange={handleItemsPerPageChange}
						class="px:12px py:8px border:1|solid|imemo-brown-200 r:8px font:14px text:imemo-brown-700 bg:white focus:outline:none focus:border:imemo-brown-400 cursor-pointer"
						data-testid="items-per-page-select"
					>
						{#each itemsPerPageOptions as option}
							<option value={option}>{option}件</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Loading state -->
	{#if userStore.isLoading}
		<div class="flex flex-1 ai:center jc:center">
			<div class="text:center">
				<svg
					class="animate:spin h:48px w:48px text:imemo-brown-400 mx:auto mb:16px"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity:75"
						fill="currentColor"
						d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="font:16px text:imemo-brown-600">読み込み中...</p>
			</div>
		</div>
	{:else if userStore.error}
		<!-- Error state -->
		<div class="p:16px flex flex-1 ai:center jc:center">
			<div class="text:center bg:imemo-beige-100 p:32px r:8px max-w:400px">
				<svg
					class="h:48px w:48px text:imemo-pink mx:auto mb:16px"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<p class="font:16px text:imemo-brown-700 mb:16px">{userStore.error}</p>
				<button
					onclick={() => userStore.loadUsers()}
					class="px:20px py:10px bg:imemo-brown-400 text:white r:8px font:14px  hover:bg:imemo-brown-500 border:none cursor-pointer transition-colors"
				>
					再試行
				</button>
			</div>
		</div>
	{:else if userStore.paginatedUsers.length === 0}
		<!-- Empty state -->
		<div class="p:16px flex flex-1 ai:center jc:center">
			<div class="text:center bg:imemo-beige-100 p:32px r:8px max-w:400px">
				<svg
					class="h:64px w:64px text:imemo-brown-300 mx:auto mb:16px"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
					/>
				</svg>
				<h3 class="font:18px text:imemo-brown-700 mb:8px">利用者が見つかりません</h3>
				<p class="font:14px text:imemo-brown-600">
					{userStore.searchTerm || Object.keys(userStore.filter).length > 0
						? '検索条件を変更してください'
						: '利用者データがありません'}
				</p>
			</div>
		</div>
	{:else}
		<!-- User list -->
		<div class="p:16px flex-1 overflow-auto">
			<div class="gap:12px flex flex:column">
				{#each userStore.paginatedUsers as user (user.id)}
					<div
						class="p:16px bg:imemo-beige-100 r:8px hover:box-shadow:md cursor-pointer transition-all {userStore
							.selectedUser?.id === user.id
							? 'box-shadow:lg border:2|solid|imemo-brown-400'
							: 'border:1|solid|imemo-brown-200'}"
						onclick={() => handleUserClick(user)}
						data-testid="user-item-{user.id}"
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								handleUserClick(user);
							}
						}}
					>
						<div class="flex items-start jc:space-betwrrn">
							<div class="flex-1">
								<div class="gap:12px mb:12px flex ai:center">
									<div class="w:48px h:48px bg:imemo-pink r:8px flex ai:center jc:center">
										<svg class="w:28px h:28px text:white" fill="currentColor" viewBox="0 0 24 24">
											<path
												d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
											/>
										</svg>
									</div>
									<div class="flex-1">
										<div class="gap:8px mb:4px flex ai:center">
											<h3 class="font:18px text:imemo-brown-700">
												{user.name}
											</h3>
											<span class="font:14px text:imemo-brown-500">
												{user.nameKana}
											</span>
										</div>
										<div class="gap:8px flex ai:center">
											<span class="px:8px py:4px bg:imemo-brown-400 text:white font:12px r:4px">
												要介護{user.careLevel}
											</span>
											<span class="font:14px text:imemo-brown-600">
												{calculateAge(user.birthDate)}歳
											</span>
											{#if !user.isActive}
												<span
													class="px:8px py:4px bg:imemo-brown-200 text:imemo-brown-600 font:12px r:4px"
												>
													非アクティブ
												</span>
											{/if}
										</div>
									</div>
								</div>

								<div class="grid-cols:2 md:grid-cols:3 gap:12px pl:60px grid">
									<div class="gap:2px flex flex:column">
										<span class="font:12px text:imemo-brown-400">性別</span>
										<span class="font:14px text:imemo-brown-700">
											{user.gender === 'male'
												? '男性'
												: user.gender === 'female'
													? '女性'
													: 'その他'}
										</span>
									</div>
									<div class="gap:2px flex flex:column">
										<span class="font:12px text:imemo-brown-400">入所日</span>
										<span class="font:14px text:imemo-brown-700"
											>{formatDate(user.admissionDate)}</span
										>
									</div>
									<div class="gap:2px flex flex:column">
										<span class="font:12px text:imemo-brown-400">更新日</span>
										<span class="font:14px text:imemo-brown-700">{formatDate(user.updatedAt)}</span>
									</div>
								</div>

								{#if user.medicalInfo.conditions.length > 0}
									<div class="mt:12px pl:60px">
										<div class="gap:6px mb:6px flex ai:center">
											<svg
												class="w:14px h:14px text:imemo-brown-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
											<span class="font:12px text:imemo-brown-600">医療情報</span>
										</div>
										<div class="gap:6px flex flex-wrap">
											{#each user.medicalInfo.conditions.slice(0, 3) as condition}
												<span
													class="px:8px py:4px bg:white border:1|solid|imemo-brown-200 text:imemo-brown-600 font:12px r:4px"
												>
													{condition}
												</span>
											{/each}
											{#if user.medicalInfo.conditions.length > 3}
												<span
													class="px:8px py:4px bg:imemo-brown-100 text:imemo-brown-600 font:12px r:4px"
												>
													+{user.medicalInfo.conditions.length - 3}件
												</span>
											{/if}
										</div>
									</div>
								{/if}
							</div>

							<div class="flex-shrink:0 ml:16px">
								<button
									class="w:32px h:32px bg:imemo-brown-400 r:8px hover:bg:imemo-brown-500 flex ai:center jc:center transition-colors"
								>
									<svg
										class="w:16px h:16px text:white"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 5l7 7-7 7"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Pagination -->
		{#if userStore.totalPages > 1}
			<div class="flex-shrink:0 p:16px bg:imemo-beige-50 border-t:1|solid|imemo-brown-200">
				<div class="flex ai:center jc:space-betwrrn">
					<div class="font:14px text:imemo-brown-600">
						{(userStore.currentPage - 1) * userStore.itemsPerPage + 1} -
						{Math.min(userStore.currentPage * userStore.itemsPerPage, userStore.sortedUsers.length)}
						件 /
						{userStore.sortedUsers.length} 件中
					</div>

					<div class="gap:6px flex ai:center">
						<button
							disabled={userStore.currentPage === 1}
							onclick={() => handlePageChange(userStore.currentPage - 1)}
							class="w:32px h:32px bg:white border:1|solid|imemo-brown-200 r:8px hover:bg:imemo-beige-50 disabled:opacity:50 disabled:cursor:not-allowed flex ai:center jc:center transition-colors"
							data-testid="prev-page"
						>
							<svg
								class="w:16px h:16px text:imemo-brown-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 19l-7-7 7-7"
								/>
							</svg>
						</button>

						{#each getPaginationPages(userStore.currentPage, userStore.totalPages) as page}
							{#if page === '...'}
								<span class="px:12px py:6px font:14px text:imemo-brown-400">...</span>
							{:else}
								<button
									onclick={() => handlePageChange(page)}
									class="min-w:32px h:32px px:12px r:8px font:14px  transition-colors {userStore.currentPage ===
									page
										? 'bg:imemo-brown-400 text:white'
										: 'bg:white border:1|solid|imemo-brown-200 text:imemo-brown-600 hover:bg:imemo-beige-50'}"
									data-testid="page-{page}"
								>
									{page}
								</button>
							{/if}
						{/each}

						<button
							disabled={userStore.currentPage === userStore.totalPages}
							onclick={() => handlePageChange(userStore.currentPage + 1)}
							class="w:32px h:32px bg:white border:1|solid|imemo-brown-200 r:8px hover:bg:imemo-beige-50 disabled:opacity:50 disabled:cursor:not-allowed flex ai:center jc:center transition-colors"
							data-testid="next-page"
						>
							<svg
								class="w:16px h:16px text:imemo-brown-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>
