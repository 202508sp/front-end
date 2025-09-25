<script lang="ts">
	// 利用者管理ページ
	import UserList from '$lib/components/user/UserList.svelte';
	import type { User } from '$lib/types/user';

	let selectedUser = $state<User | null>(null);

	function handleUserSelect(user: User) {
		selectedUser = user;
	}
</script>

<div class="p:6px">
	<h1 class="text:2xl font:bold text:care-text-primary mb:6px">利用者管理</h1>

	<div class="grid-cols:1 lg:grid-cols:3 gap:6 h:screen-80 grid">
		<!-- 利用者一覧 -->
		<div
			class="lg:col-span:2 bg:care-background-primary rounded:lg shadow:sm border:1|solid|care-gray-200 overflow:hidden"
		>
			<UserList onUserSelect={handleUserSelect} class="h:full" />
		</div>

		<!-- 利用者詳細 -->
		<div class="bg:care-background-primary rounded:lg shadow:sm border:1|solid|care-gray-200">
			<div class="p:4 border-b:1|solid|care-gray-200">
				<h2 class="text:lg font:semibold text:care-text-primary">利用者詳細</h2>
			</div>

			<div class="p:4">
				{#if selectedUser}
					<div class="space-y:4">
						<div>
							<h3 class="text:lg font:medium text:care-text-primary mb:2">{selectedUser.name}</h3>
							<p class="text:care-text-secondary">{selectedUser.nameKana}</p>
						</div>

						<div class="grid-cols:2 gap:4 text:sm grid">
							<div>
								<span class="font:medium text:care-text-secondary">年齢:</span>
								<span class="text:care-text-primary ml:1">
									{new Date().getFullYear() - selectedUser.birthDate.getFullYear()}歳
								</span>
							</div>
							<div>
								<span class="font:medium text:care-text-secondary">性別:</span>
								<span class="text:care-text-primary ml:1">
									{selectedUser.gender === 'male'
										? '男性'
										: selectedUser.gender === 'female'
											? '女性'
											: 'その他'}
								</span>
							</div>
							<div>
								<span class="font:medium text:care-text-secondary">要介護度:</span>
								<span class="text:care-text-primary ml:1">要介護{selectedUser.careLevel}</span>
							</div>
							<div>
								<span class="font:medium text:care-text-secondary">入所日:</span>
								<span class="text:care-text-primary ml:1">
									{selectedUser.admissionDate.toLocaleDateString('ja-JP')}
								</span>
							</div>
						</div>

						<div>
							<h4 class="font:medium text:care-text-primary mb:2">住所</h4>
							<p class="text:sm text:care-text-secondary">
								〒{selectedUser.address.postalCode}<br />
								{selectedUser.address.prefecture}{selectedUser.address.city}<br />
								{selectedUser.address.street}
								{#if selectedUser.address.building}
									<br />{selectedUser.address.building}
								{/if}
							</p>
						</div>

						<div>
							<h4 class="font:medium text:care-text-primary mb:2">緊急連絡先</h4>
							<div class="text:sm text:care-text-secondary">
								<p>
									{selectedUser.emergencyContact.name} ({selectedUser.emergencyContact
										.relationship})
								</p>
								<p>{selectedUser.emergencyContact.phone}</p>
								{#if selectedUser.emergencyContact.email}
									<p>{selectedUser.emergencyContact.email}</p>
								{/if}
							</div>
						</div>

						{#if selectedUser.medicalInfo.conditions.length > 0}
							<div>
								<h4 class="font:medium text:care-text-primary mb:2">医療情報</h4>
								<div class="gap:1 flex flex-wrap">
									{#each selectedUser.medicalInfo.conditions as condition}
										<span
											class="px:2 py:1 bg:care-accent-warning-100 text:care-accent-warning-700 text:xs rounded"
										>
											{condition}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="text:center py:8">
						<p class="text:care-text-secondary">利用者を選択してください</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
