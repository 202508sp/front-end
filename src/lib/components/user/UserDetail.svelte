<script lang="ts">
	import type { User, MedicalInfo, FamilyMember, Note } from '$lib/types/user';
	import type { ValidationError } from '$lib/types/common';
	import FormField from '$lib/components/ui/FormField.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { formatDate, calculateAge } from '$lib/utils/date';
	import { validateUserData } from '$lib/utils/validation';

	interface Props {
		user: User;
		isEditMode?: boolean;
		onSave?: (user: User) => void;
		onCancel?: () => void;
	}

	let { user, isEditMode = false, onSave, onCancel }: Props = $props();

	// Edit form state
	let editedUser = $state<User>(structuredClone(user));
	let expandedSections = $state<Set<string>>(new Set());
	let activeTab = $state<'basic' | 'medical' | 'family' | 'notes'>('basic');
	let validationErrors = $state<ValidationError[]>([]);
	let isValidating = $state(false);
	let isSaving = $state(false);

	// Update edited user when user prop changes
	$effect(() => {
		if (!isEditMode) {
			editedUser = structuredClone(user);
		}
	});

	function toggleSection(sectionId: string) {
		if (expandedSections.has(sectionId)) {
			expandedSections.delete(sectionId);
		} else {
			expandedSections.add(sectionId);
		}
		expandedSections = new Set(expandedSections);
	}

	async function handleSave() {
		isValidating = true;
		validationErrors = [];

		try {
			// バリデーション実行
			const errors = validateUserData(editedUser);
			
			if (errors.length > 0) {
				validationErrors = errors;
				// 最初のエラーがあるタブに切り替え
				const firstError = errors[0];
				if (firstError.field.includes('医療') || firstError.field.includes('服薬') || firstError.field.includes('血液型') || firstError.field.includes('身長') || firstError.field.includes('体重')) {
					activeTab = 'medical';
				} else if (firstError.field.includes('家族')) {
					activeTab = 'family';
				} else if (firstError.field.includes('記録')) {
					activeTab = 'notes';
				} else {
					activeTab = 'basic';
				}
				return;
			}

			isSaving = true;
			await onSave?.(editedUser);
		} catch (error) {
			console.error('保存エラー:', error);
			validationErrors = [{
				field: 'general',
				message: '保存中にエラーが発生しました',
				code: 'save_error'
			}];
		} finally {
			isValidating = false;
			isSaving = false;
		}
	}

	function handleCancel() {
		editedUser = structuredClone(user);
		validationErrors = [];
		onCancel?.();
	}

	// フィールド固有のエラーを取得
	function getFieldError(fieldName: string): ValidationError | undefined {
		return validationErrors.find(error => error.field === fieldName);
	}

	// フィールドにエラーがあるかチェック
	function hasFieldError(fieldName: string): boolean {
		return validationErrors.some(error => error.field === fieldName);
	}

	function addMedication() {
		editedUser.medicalInfo.medications = [
			...editedUser.medicalInfo.medications,
			{
				id: crypto.randomUUID(),
				name: '',
				dosage: '',
				frequency: '',
				startDate: new Date(),
				notes: ''
			}
		];
	}

	function removeMedication(medicationId: string) {
		editedUser.medicalInfo.medications = editedUser.medicalInfo.medications.filter(
			(med) => med.id !== medicationId
		);
	}

	function addFamilyMember() {
		editedUser.familyMembers = [
			...editedUser.familyMembers,
			{
				id: crypto.randomUUID(),
				name: '',
				relationship: '',
				phone: '',
				email: '',
				isPrimaryContact: false,
				hasPortalAccess: false
			}
		];
	}

	function removeFamilyMember(memberId: string) {
		editedUser.familyMembers = editedUser.familyMembers.filter((member) => member.id !== memberId);
	}

	function addNote() {
		editedUser.notes = [
			{
				id: crypto.randomUUID(),
				authorId: 'current-user', // TODO: Get from auth store
				authorName: '現在のユーザー', // TODO: Get from auth store
				content: '',
				category: 'general',
				isImportant: false,
				createdAt: new Date(),
				updatedAt: new Date()
			},
			...editedUser.notes
		];
	}

	function removeNote(noteId: string) {
		editedUser.notes = editedUser.notes.filter((note) => note.id !== noteId);
	}
</script>

<div class="flex:col h:full flex">
	{#if isEditMode}
		<!-- Edit Mode Header -->
		<div class="p:4 border-b:1|solid|gray-200 bg:blue-50">
			<div class="items:center justify:between flex">
				<div>
					<h3 class="text:lg font:semibold text:blue-900">編集モード</h3>
					<p class="text:sm text:blue-700">利用者情報を編集しています</p>
				</div>
				<div class="gap:2 flex">
					<Button variant="outline" size="sm" onclick={handleCancel} disabled={isSaving}>
						キャンセル
					</Button>
					<Button 
						variant="primary" 
						size="sm" 
						onclick={handleSave} 
						disabled={isValidating || isSaving}
					>
						{#if isSaving}
							<svg class="animate:spin w:4 h:4 mr:2" fill="none" viewBox="0 0 24 24">
								<circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							保存中...
						{:else if isValidating}
							検証中...
						{:else}
							保存
						{/if}
					</Button>
				</div>
			</div>
		</div>

		<!-- Validation Errors -->
		{#if validationErrors.length > 0}
			<div class="p:4 bg:red-50 border-b:1|solid|red-200">
				<div class="items:start flex">
					<svg class="w:5 h:5 text:red-500 mt:0.5 mr:2 flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
					<div class="flex:1">
						<h4 class="text:sm font:medium text:red-800 mb:1">入力内容に問題があります</h4>
						<ul class="text:sm text:red-700 space-y:1">
							{#each validationErrors.slice(0, 5) as error}
								<li>• {error.message}</li>
							{/each}
							{#if validationErrors.length > 5}
								<li class="text:red-600">他 {validationErrors.length - 5} 件のエラー</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Tab Navigation -->
	<div class="border-b:1|solid|gray-200 bg:gray-50">
		<nav class="flex">
			<button
				type="button"
				class="
					px:4 py:3 text:sm font:medium border-b:2|solid|transparent
					{activeTab === 'basic'
					? 'text:blue-600 border-b-color:blue-600 bg:white'
					: 'text:gray-500 hover:text:gray-700'}
					transition:all|200ms
				"
				onclick={() => (activeTab = 'basic')}
			>
				基本情報
			</button>
			<button
				type="button"
				class="
					px:4 py:3 text:sm font:medium border-b:2|solid|transparent
					{activeTab === 'medical'
					? 'text:blue-600 border-b-color:blue-600 bg:white'
					: 'text:gray-500 hover:text:gray-700'}
					transition:all|200ms
				"
				onclick={() => (activeTab = 'medical')}
			>
				医療情報
			</button>
			<button
				type="button"
				class="
					px:4 py:3 text:sm font:medium border-b:2|solid|transparent
					{activeTab === 'family'
					? 'text:blue-600 border-b-color:blue-600 bg:white'
					: 'text:gray-500 hover:text:gray-700'}
					transition:all|200ms
				"
				onclick={() => (activeTab = 'family')}
			>
				家族情報
			</button>
			<button
				type="button"
				class="
					px:4 py:3 text:sm font:medium border-b:2|solid|transparent
					{activeTab === 'notes'
					? 'text:blue-600 border-b-color:blue-600 bg:white'
					: 'text:gray-500 hover:text:gray-700'}
					transition:all|200ms
				"
				onclick={() => (activeTab = 'notes')}
			>
				記録・メモ
			</button>
		</nav>
	</div>

	<!-- Tab Content -->
	<div class="flex:1 overflow:auto p:4">
		{#if activeTab === 'basic'}
			<!-- Basic Information -->
			<div class="space-y:6">
				{#if isEditMode}
					<div class="grid-cols:1 @md:grid-cols:2 gap:4 grid">
						<FormField 
							label="氏名" 
							required 
							error={getFieldError('氏名')?.message}
						>
							<Input 
								bind:value={editedUser.name} 
								placeholder="山田 太郎"
								class={hasFieldError('氏名') ? 'border-red-500 focus:border-red-500' : ''}
							/>
						</FormField>
						<FormField 
							label="氏名（カナ）" 
							required
							error={getFieldError('氏名（カナ）')?.message}
						>
							<Input 
								bind:value={editedUser.nameKana} 
								placeholder="ヤマダ タロウ"
								class={hasFieldError('氏名（カナ）') ? 'border-red-500 focus:border-red-500' : ''}
							/>
						</FormField>
						<FormField 
							label="生年月日" 
							required
							error={getFieldError('生年月日')?.message}
						>
							<Input
								type="date"
								value={editedUser.birthDate.toISOString().split('T')[0]}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									editedUser.birthDate = new Date(target.value);
								}}
								class={hasFieldError('生年月日') ? 'border-red-500 focus:border-red-500' : ''}
							/>
						</FormField>
						<FormField 
							label="性別" 
							required
							error={getFieldError('性別')?.message}
						>
							<select
								bind:value={editedUser.gender}
								class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500 {hasFieldError('性別') ? 'border-red-500 focus:border-red-500' : ''}"
							>
								<option value="">選択してください</option>
								<option value="male">男性</option>
								<option value="female">女性</option>
								<option value="other">その他</option>
							</select>
						</FormField>
						<FormField 
							label="要介護度" 
							required
							error={getFieldError('要介護度')?.message}
						>
							<select
								bind:value={editedUser.careLevel}
								class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500 {hasFieldError('要介護度') ? 'border-red-500 focus:border-red-500' : ''}"
							>
								<option value="">選択してください</option>
								{#each [1, 2, 3, 4, 5] as level}
									<option value={level}>要介護{level}</option>
								{/each}
							</select>
						</FormField>
						<FormField 
							label="入所日" 
							required
							error={getFieldError('入所日')?.message}
						>
							<Input
								type="date"
								value={editedUser.admissionDate.toISOString().split('T')[0]}
								oninput={(e) => {
									const target = e.target as HTMLInputElement;
									editedUser.admissionDate = new Date(target.value);
								}}
								class={hasFieldError('入所日') ? 'border-red-500 focus:border-red-500' : ''}
							/>
						</FormField>
					</div>

					<!-- Address -->
					<div>
						<h4 class="text:lg font:semibold text:gray-900 mb:3">住所</h4>
						<div class="grid-cols:1 @md:grid-cols:2 gap:4 grid">
							<FormField label="郵便番号">
								<Input bind:value={editedUser.address.postalCode} placeholder="123-4567" />
							</FormField>
							<FormField label="都道府県">
								<Input bind:value={editedUser.address.prefecture} placeholder="東京都" />
							</FormField>
							<FormField label="市区町村">
								<Input bind:value={editedUser.address.city} placeholder="新宿区" />
							</FormField>
							<FormField label="町名・番地">
								<Input bind:value={editedUser.address.street} placeholder="西新宿1-1-1" />
							</FormField>
							<div class="@md:col-span:2">
								<FormField label="建物名・部屋番号">
									<Input
										bind:value={editedUser.address.building}
										placeholder="○○マンション101号室"
									/>
								</FormField>
							</div>
						</div>
					</div>

					<!-- Emergency Contact -->
					<div>
						<h4 class="text:lg font:semibold text:gray-900 mb:3">緊急連絡先</h4>
						<div class="grid-cols:1 @md:grid-cols:2 gap:4 grid">
							<FormField label="氏名" required>
								<Input bind:value={editedUser.emergencyContact.name} placeholder="山田 花子" />
							</FormField>
							<FormField label="続柄" required>
								<Input bind:value={editedUser.emergencyContact.relationship} placeholder="長女" />
							</FormField>
							<FormField label="電話番号" required>
								<Input bind:value={editedUser.emergencyContact.phone} placeholder="090-1234-5678" />
							</FormField>
							<FormField label="メールアドレス">
								<Input
									bind:value={editedUser.emergencyContact.email}
									placeholder="hanako@example.com"
								/>
							</FormField>
						</div>
					</div>
				{:else}
					<!-- View Mode -->
					<div class="space-y:6">
						<!-- Profile Header -->
						<div class="items:start gap:4 flex">
							<div class="w:16 h:16 bg:gray-200 r:9999px items:center justify:center flex">
								<iconify-icon icon="material-symbols:person" class="w:8 h:8 text:gray-500"
								></iconify-icon>
							</div>
							<div class="flex:1">
								<h3 class="text:xl font:semibold text:gray-900">{user.name}</h3>
								<p class="text:gray-600">{user.nameKana}</p>
								<div class="gap:4 mt:2 text:sm text:gray-500 flex">
									<span>{calculateAge(user.birthDate)}歳</span>
									<span>
										{user.gender === 'male' ? '男性' : user.gender === 'female' ? '女性' : 'その他'}
									</span>
									<span>要介護{user.careLevel}</span>
								</div>
							</div>
						</div>

						<!-- Basic Info Grid -->
						<div class="grid-cols:1 @md:grid-cols:2 gap:6 grid">
							<div>
								<h4 class="font:semibold text:gray-900 mb:2">基本情報</h4>
								<dl class="space-y:2 text:sm">
									<div class="flex">
										<dt class="w:20 text:gray-500">生年月日:</dt>
										<dd class="text:gray-900">{formatDate(user.birthDate)}</dd>
									</div>
									<div class="flex">
										<dt class="w:20 text:gray-500">入所日:</dt>
										<dd class="text:gray-900">{formatDate(user.admissionDate)}</dd>
									</div>
									<div class="flex">
										<dt class="w:20 text:gray-500">状態:</dt>
										<dd>
											<span
												class="
												px:2 py:1 text:xs r:9999px
												{user.isActive ? 'bg:green-100 text:green-800' : 'bg:gray-100 text:gray-800'}
											"
											>
												{user.isActive ? '在所中' : '退所済み'}
											</span>
										</dd>
									</div>
								</dl>
							</div>

							<div>
								<h4 class="font:semibold text:gray-900 mb:2">住所</h4>
								<address class="text:sm text:gray-600 not-italic">
									〒{user.address.postalCode}<br />
									{user.address.prefecture}{user.address.city}<br />
									{user.address.street}
									{#if user.address.building}
										<br />{user.address.building}
									{/if}
								</address>
							</div>
						</div>

						<!-- Emergency Contact -->
						<div>
							<h4 class="font:semibold text:gray-900 mb:2">緊急連絡先</h4>
							<div class="bg:gray-50 p:3 r:16px">
								<div class="text:sm">
									<p class="font:medium text:gray-900">
										{user.emergencyContact.name} ({user.emergencyContact.relationship})
									</p>
									<p class="text:gray-600">{user.emergencyContact.phone}</p>
									{#if user.emergencyContact.email}
										<p class="text:gray-600">{user.emergencyContact.email}</p>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{:else if activeTab === 'medical'}
			<!-- Medical Information -->
			<div class="space-y:6">
				{#if isEditMode}
					<!-- Edit Medical Info -->
					<div class="space-y:4">
						<FormField label="血液型">
							<select
								bind:value={editedUser.medicalInfo.bloodType}
								class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500"
							>
								<option value="">選択してください</option>
								<option value="A">A型</option>
								<option value="B">B型</option>
								<option value="AB">AB型</option>
								<option value="O">O型</option>
							</select>
						</FormField>

						<div class="grid-cols:2 gap:4 grid">
							<FormField label="身長 (cm)">
								<Input type="number" bind:value={editedUser.medicalInfo.height} placeholder="160" />
							</FormField>
							<FormField label="体重 (kg)">
								<Input type="number" bind:value={editedUser.medicalInfo.weight} placeholder="60" />
							</FormField>
						</div>

						<!-- Allergies -->
						<div>
							<label for="allergies-input" class="text:sm font:medium text:gray-700 mb:2 block"
								>アレルギー</label
							>
							<textarea
								id="allergies-input"
								value={editedUser.medicalInfo.allergies.join(', ')}
								oninput={(e) => {
									const target = e.target as HTMLTextAreaElement;
									editedUser.medicalInfo.allergies = target.value
										.split(',')
										.map((s) => s.trim())
										.filter((s) => s);
								}}
								class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500"
								rows="3"
								placeholder="アレルギー情報を入力（カンマ区切り）"
							></textarea>
						</div>

						<!-- Conditions -->
						<div>
							<label for="conditions-input" class="text:sm font:medium text:gray-700 mb:2 block"
								>既往歴・疾患</label
							>
							<textarea
								id="conditions-input"
								value={editedUser.medicalInfo.conditions.join(', ')}
								oninput={(e) => {
									const target = e.target as HTMLTextAreaElement;
									editedUser.medicalInfo.conditions = target.value
										.split(',')
										.map((s) => s.trim())
										.filter((s) => s);
								}}
								class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500"
								rows="3"
								placeholder="既往歴・疾患を入力（カンマ区切り）"
							></textarea>
						</div>

						<!-- Medications -->
						<div>
							<div class="items:center justify:between mb:3 flex">
								<h4 class="text:sm font:medium text:gray-700">服薬情報</h4>
								<Button variant="outline" size="sm" onclick={addMedication}>
									<iconify-icon icon="material-symbols:add" class="w:4 h:4 mr:1"></iconify-icon>
									薬を追加
								</Button>
							</div>
							<div class="space-y:3">
								{#each editedUser.medicalInfo.medications as medication, index}
									<div class="border:1|solid|gray-200 r:16px p:3">
										<div class="items:start justify:between mb:2 flex">
											<h5 class="font:medium text:gray-900">薬 {index + 1}</h5>
											<button
												type="button"
												class="text:red-600 hover:text:red-800"
												onclick={() => removeMedication(medication.id)}
												aria-label="薬を削除"
											>
												<iconify-icon icon="material-symbols:delete" class="w:4 h:4"></iconify-icon>
											</button>
										</div>
										<div class="grid-cols:2 gap:2 grid">
											<FormField label="薬名">
												<Input bind:value={medication.name} placeholder="薬名" />
											</FormField>
											<FormField label="用量">
												<Input bind:value={medication.dosage} placeholder="1錠" />
											</FormField>
											<FormField label="服用頻度">
												<Input bind:value={medication.frequency} placeholder="1日3回" />
											</FormField>
											<FormField label="開始日">
												<Input
													type="date"
													value={medication.startDate.toISOString().split('T')[0]}
													oninput={(e) => {
														const target = e.target as HTMLInputElement;
														medication.startDate = new Date(target.value);
													}}
												/>
											</FormField>
										</div>
										<FormField label="備考">
											<Input bind:value={medication.notes} placeholder="食後服用など" />
										</FormField>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{:else}
					<!-- View Medical Info -->
					<div class="space-y:6">
						<!-- Basic Medical Info -->
						<div class="grid-cols:1 @md:grid-cols:3 gap:4 grid">
							{#if user.medicalInfo.bloodType}
								<div class="text:center p:3 bg:red-50 r:16px">
									<div class="text:2xl font:bold text:red-600">{user.medicalInfo.bloodType}</div>
									<div class="text:sm text:red-700">血液型</div>
								</div>
							{/if}
							{#if user.medicalInfo.height}
								<div class="text:center p:3 bg:blue-50 r:16px">
									<div class="text:2xl font:bold text:blue-600">{user.medicalInfo.height}cm</div>
									<div class="text:sm text:blue-700">身長</div>
								</div>
							{/if}
							{#if user.medicalInfo.weight}
								<div class="text:center p:3 bg:green-50 r:16px">
									<div class="text:2xl font:bold text:green-600">{user.medicalInfo.weight}kg</div>
									<div class="text:sm text:green-700">体重</div>
								</div>
							{/if}
						</div>

						<!-- Allergies -->
						{#if user.medicalInfo.allergies.length > 0}
							<div>
								<h4 class="font:semibold text:gray-900 mb:2 items:center flex">
									<iconify-icon icon="material-symbols:warning" class="w:5 h:5 text:orange-500 mr:2"
									></iconify-icon>
									アレルギー
								</h4>
								<div class="flex:wrap gap:2 flex">
									{#each user.medicalInfo.allergies as allergy}
										<span class="px:2 py:1 bg:orange-100 text:orange-800 text:sm r:9999px">
											{allergy}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Conditions -->
						{#if user.medicalInfo.conditions.length > 0}
							<div>
								<h4 class="font:semibold text:gray-900 mb:2">既往歴・疾患</h4>
								<div class="flex:wrap gap:2 flex">
									{#each user.medicalInfo.conditions as condition}
										<span class="px:2 py:1 bg:blue-100 text:blue-800 text:sm r:9999px">
											{condition}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Medications -->
						{#if user.medicalInfo.medications.length > 0}
							<div>
								<h4 class="font:semibold text:gray-900 mb:3">服薬情報</h4>
								<div class="space-y:3">
									{#each user.medicalInfo.medications as medication}
										<div class="border:1|solid|gray-200 r:16px p:3">
											<div class="items:start justify:between flex">
												<div class="flex:1">
													<h5 class="font:medium text:gray-900">{medication.name}</h5>
													<div class="text:sm text:gray-600 mt:1">
														<span>{medication.dosage}</span>
														<span class="mx:2">•</span>
														<span>{medication.frequency}</span>
													</div>
													<div class="text:xs text:gray-500 mt:1">
														開始日: {formatDate(medication.startDate)}
													</div>
													{#if medication.notes}
														<div class="text:sm text:gray-600 mt:2">
															{medication.notes}
														</div>
													{/if}
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Restrictions -->
						{#if user.medicalInfo.restrictions.length > 0}
							<div>
								<h4 class="font:semibold text:gray-900 mb:2">制限事項</h4>
								<div class="flex:wrap gap:2 flex">
									{#each user.medicalInfo.restrictions as restriction}
										<span class="px:2 py:1 bg:red-100 text:red-800 text:sm r:9999px">
											{restriction}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else if activeTab === 'family'}
			<!-- Family Information -->
			<div class="space-y:6">
				{#if isEditMode}
					<!-- Edit Family Info -->
					<div>
						<div class="items:center justify:between mb:4 flex">
							<h4 class="text:lg font:semibold text:gray-900">家族情報</h4>
							<Button variant="outline" size="sm" onclick={addFamilyMember}>
								<iconify-icon icon="material-symbols:add" class="w:4 h:4 mr:1"></iconify-icon>
								家族を追加
							</Button>
						</div>
						<div class="space-y:4">
							{#each editedUser.familyMembers as member, index}
								<div class="border:1|solid|gray-200 r:16px p:4">
									<div class="items:start justify:between mb:3 flex">
										<h5 class="font:medium text:gray-900">家族 {index + 1}</h5>
										<button
											type="button"
											class="text:red-600 hover:text:red-800"
											onclick={() => removeFamilyMember(member.id)}
											aria-label="家族を削除"
										>
											<iconify-icon icon="material-symbols:delete" class="w:4 h:4"></iconify-icon>
										</button>
									</div>
									<div class="grid-cols:1 @md:grid-cols:2 gap:3 grid">
										<FormField label="氏名" required>
											<Input bind:value={member.name} placeholder="山田 花子" />
										</FormField>
										<FormField label="続柄" required>
											<Input bind:value={member.relationship} placeholder="長女" />
										</FormField>
										<FormField label="電話番号" required>
											<Input bind:value={member.phone} placeholder="090-1234-5678" />
										</FormField>
										<FormField label="メールアドレス">
											<Input bind:value={member.email} placeholder="hanako@example.com" />
										</FormField>
									</div>
									<div class="gap:4 mt:3 flex">
										<label class="items:center flex">
											<input type="checkbox" bind:checked={member.isPrimaryContact} class="mr:2" />
											<span class="text:sm">主要連絡先</span>
										</label>
										<label class="items:center flex">
											<input type="checkbox" bind:checked={member.hasPortalAccess} class="mr:2" />
											<span class="text:sm">ポータルアクセス</span>
										</label>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<!-- View Family Info -->
					<div>
						<h4 class="text:lg font:semibold text:gray-900 mb:4">家族情報</h4>
						{#if user.familyMembers.length > 0}
							<div class="space-y:4">
								{#each user.familyMembers as member}
									<div class="border:1|solid|gray-200 r:16px p:4">
										<div class="items:start justify:between flex">
											<div class="flex:1">
												<div class="items:center gap:2 flex">
													<h5 class="font:medium text:gray-900">{member.name}</h5>
													{#if member.isPrimaryContact}
														<span class="px:2 py:1 bg:blue-100 text:blue-800 text:xs r:9999px">
															主要連絡先
														</span>
													{/if}
													{#if member.hasPortalAccess}
														<span
															class="px:2 py:1 bg:green-100 text:green-800 text:xs r:9999px"
														>
															ポータル利用
														</span>
													{/if}
												</div>
												<p class="text:sm text:gray-600">{member.relationship}</p>
												<div class="text:sm text:gray-600 mt:2">
													<p>{member.phone}</p>
													{#if member.email}
														<p>{member.email}</p>
													{/if}
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text:center py:8 text:gray-500">
								<iconify-icon
									icon="material-symbols:family-restroom"
									class="w:12 h:12 text:gray-300 mb:2"
								></iconify-icon>
								<p>家族情報が登録されていません</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{:else if activeTab === 'notes'}
			<!-- Notes and Records -->
			<div class="space-y:6">
				{#if isEditMode}
					<!-- Edit Notes -->
					<div>
						<div class="items:center justify:between mb:4 flex">
							<h4 class="text:lg font:semibold text:gray-900">記録・メモ</h4>
							<Button variant="outline" size="sm" onclick={addNote}>
								<iconify-icon icon="material-symbols:add" class="w:4 h:4 mr:1"></iconify-icon>
								記録を追加
							</Button>
						</div>
						<div class="space-y:4">
							{#each editedUser.notes as note, index}
								<div class="border:1|solid|gray-200 r:16px p:4">
									<div class="items:start justify:between mb:3 flex">
										<div class="items:center gap:2 flex">
											<h5 class="font:medium text:gray-900">記録 {index + 1}</h5>
											<select
												bind:value={note.category}
												class="text:xs px:2 py:1 border:1|solid|gray-300 rounded"
											>
												<option value="general">一般</option>
												<option value="medical">医療</option>
												<option value="behavioral">行動</option>
												<option value="family">家族</option>
												<option value="care-plan">ケアプラン</option>
											</select>
											<label class="items:center text:xs flex">
												<input type="checkbox" bind:checked={note.isImportant} class="mr:1" />
												重要
											</label>
										</div>
										<button
											type="button"
											class="text:red-600 hover:text:red-800"
											onclick={() => removeNote(note.id)}
											aria-label="記録を削除"
										>
											<iconify-icon icon="material-symbols:delete" class="w:4 h:4"></iconify-icon>
										</button>
									</div>
									<textarea
										bind:value={note.content}
										class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500"
										rows="4"
										placeholder="記録内容を入力してください"
									></textarea>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<!-- View Notes -->
					<div>
						<h4 class="text:lg font:semibold text:gray-900 mb:4">記録・メモ</h4>
						{#if user.notes.length > 0}
							<div class="space-y:4">
								{#each user.notes as note}
									<div class="border:1|solid|gray-200 r:16px p:4">
										<div class="items:start justify:between mb:2 flex">
											<div class="items:center gap:2 flex">
												<span
													class="
													px:2 py:1 text:xs r:9999px
													{note.category === 'medical'
														? 'bg:red-100 text:red-800'
														: note.category === 'behavioral'
															? 'bg:orange-100 text:orange-800'
															: note.category === 'family'
																? 'bg:green-100 text:green-800'
																: note.category === 'care-plan'
																	? 'bg:purple-100 text:purple-800'
																	: 'bg:gray-100 text:gray-800'}
												"
												>
													{note.category === 'general'
														? '一般'
														: note.category === 'medical'
															? '医療'
															: note.category === 'behavioral'
																? '行動'
																: note.category === 'family'
																	? '家族'
																	: note.category === 'care-plan'
																		? 'ケアプラン'
																		: note.category}
												</span>
												{#if note.isImportant}
													<span
														class="px:2 py:1 bg:yellow-100 text:yellow-800 text:xs r:9999px"
													>
														重要
													</span>
												{/if}
											</div>
											<div class="text:xs text:gray-500">
												{formatDate(note.createdAt)} by {note.authorName}
											</div>
										</div>
										<p class="text:sm text:gray-700 whitespace:pre-wrap">{note.content}</p>
									</div>
								{/each}
							</div>
						{:else}
							<div class="text:center py:8 text:gray-500">
								<iconify-icon icon="material-symbols:note" class="w:12 h:12 text:gray-300 mb:2"
								></iconify-icon>
								<p>記録・メモがありません</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
