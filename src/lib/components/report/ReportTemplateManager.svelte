<script lang="ts">
	import type { ReportTemplate, ReportSection, ReportType } from '$lib/types/report';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import FormField from '$lib/components/ui/FormField.svelte';
	import { reportStore } from '$lib/stores/report.svelte';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onTemplateSelect?: (template: ReportTemplate) => void;
	}

	let { isOpen, onClose, onTemplateSelect }: Props = $props();

	// 状態
	let selectedTemplate = $state<ReportTemplate | null>(null);
	let isEditing = $state(false);
	let isCreating = $state(false);

	// フォーム状態
	let templateForm = $state({
		name: '',
		type: 'daily' as ReportType,
		sections: [] as ReportSection[],
		isDefault: false
	});

	let sectionForm = $state({
		title: '',
		type: 'text' as 'text' | 'checklist' | 'rating' | 'file' | 'signature',
		isRequired: false,
		config: {}
	});

	let showSectionForm = $state(false);
	let editingSectionIndex = $state<number | null>(null);

	// 初期化
	$effect(() => {
		if (isOpen) {
			reportStore.loadTemplates();
		}
	});

	function startCreateTemplate() {
		templateForm = {
			name: '',
			type: 'daily',
			sections: [],
			isDefault: false
		};
		isCreating = true;
		isEditing = false;
		selectedTemplate = null;
	}

	function startEditTemplate(template: ReportTemplate) {
		templateForm = {
			name: template.name,
			type: template.type,
			sections: [...template.sections],
			isDefault: template.isDefault
		};
		selectedTemplate = template;
		isEditing = true;
		isCreating = false;
	}

	function cancelEdit() {
		isEditing = false;
		isCreating = false;
		selectedTemplate = null;
		showSectionForm = false;
		editingSectionIndex = null;
	}

	function startAddSection() {
		sectionForm = {
			title: '',
			type: 'text',
			isRequired: false,
			config: {}
		};
		showSectionForm = true;
		editingSectionIndex = null;
	}

	function startEditSection(index: number) {
		const section = templateForm.sections[index];
		sectionForm = {
			title: section.title,
			type: section.type,
			isRequired: section.isRequired,
			config: { ...section.config }
		};
		showSectionForm = true;
		editingSectionIndex = index;
	}

	function saveSection() {
		if (!sectionForm.title.trim()) return;

		const section: ReportSection = {
			id:
				editingSectionIndex !== null
					? templateForm.sections[editingSectionIndex].id
					: `section-${Date.now()}`,
			title: sectionForm.title,
			type: sectionForm.type,
			isRequired: sectionForm.isRequired,
			order:
				editingSectionIndex !== null
					? templateForm.sections[editingSectionIndex].order
					: templateForm.sections.length + 1,
			config: { ...sectionForm.config }
		};

		if (editingSectionIndex !== null) {
			templateForm.sections[editingSectionIndex] = section;
		} else {
			templateForm.sections.push(section);
		}

		showSectionForm = false;
		editingSectionIndex = null;
	}

	function removeSection(index: number) {
		templateForm.sections.splice(index, 1);
		// 順序を再調整
		templateForm.sections.forEach((section, i) => {
			section.order = i + 1;
		});
	}

	function moveSectionUp(index: number) {
		if (index === 0) return;
		const temp = templateForm.sections[index];
		templateForm.sections[index] = templateForm.sections[index - 1];
		templateForm.sections[index - 1] = temp;

		// 順序を更新
		templateForm.sections[index].order = index + 1;
		templateForm.sections[index - 1].order = index;
	}

	function moveSectionDown(index: number) {
		if (index === templateForm.sections.length - 1) return;
		const temp = templateForm.sections[index];
		templateForm.sections[index] = templateForm.sections[index + 1];
		templateForm.sections[index + 1] = temp;

		// 順序を更新
		templateForm.sections[index].order = index + 1;
		templateForm.sections[index + 1].order = index + 2;
	}

	async function saveTemplate() {
		if (!templateForm.name.trim()) return;

		try {
			const templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
				name: templateForm.name,
				type: templateForm.type,
				sections: templateForm.sections,
				isDefault: templateForm.isDefault,
				createdBy: 'current-staff-id' // TODO: 現在のスタッフIDを取得
			};

			if (isEditing && selectedTemplate) {
				// TODO: テンプレート更新API実装
				console.log('Update template:', selectedTemplate.id, templateData);
			} else {
				// TODO: テンプレート作成API実装
				console.log('Create template:', templateData);
			}

			// テンプレート一覧を再読み込み
			await reportStore.loadTemplates();
			cancelEdit();
		} catch (error) {
			console.error('Template save error:', error);
		}
	}

	async function deleteTemplate(template: ReportTemplate) {
		if (!confirm(`テンプレート「${template.name}」を削除しますか？`)) return;

		try {
			// TODO: テンプレート削除API実装
			console.log('Delete template:', template.id);

			// テンプレート一覧を再読み込み
			await reportStore.loadTemplates();
		} catch (error) {
			console.error('Template delete error:', error);
		}
	}

	function selectTemplate(template: ReportTemplate) {
		onTemplateSelect?.(template);
		onClose();
	}

	const reportTypeOptions = [
		{ value: 'daily', label: '日次レポート' },
		{ value: 'medical', label: '医療レポート' },
		{ value: 'incident', label: 'インシデントレポート' },
		{ value: 'progress', label: '経過レポート' },
		{ value: 'family-communication', label: '家族連絡' },
		{ value: 'monthly-summary', label: '月次サマリー' }
	];

	const sectionTypeOptions = [
		{ value: 'text', label: 'テキスト入力' },
		{ value: 'checklist', label: 'チェックリスト' },
		{ value: 'rating', label: '評価・採点' },
		{ value: 'file', label: 'ファイル添付' },
		{ value: 'signature', label: '署名' }
	];
</script>

<Modal {isOpen} {onClose} title="レポートテンプレート管理" size="lg">
	<div class="h:600px flex">
		<!-- テンプレート一覧 -->
		<div class="w:300px border-r:1px|solid|gray-200 flex:col flex">
			<div class="p:16px border-b:1px|solid|gray-200">
				<Button onclick={startCreateTemplate} class="w:full">
					<Icon icon="material-symbols:add" class="w:16px h:16px mr:4px" />
					新規テンプレート
				</Button>
			</div>

			<div class="flex:1 overflow:auto">
				{#if reportStore.isLoading}
					<div class="p:16px text:center">
						<Icon icon="material-symbols:refresh" class="w:20px h:20px animate:spin" />
						<p class="mt:8px font:14px color:gray-600">読み込み中...</p>
					</div>
				{:else if reportStore.templates.length === 0}
					<div class="p:16px text:center">
						<Icon icon="material-symbols:description" class="w:32px h:32px color:gray-400 mb:8px" />
						<p class="font:14px color:gray-600">テンプレートがありません</p>
					</div>
				{:else}
					<div class="divide-y:1px|solid|gray-100">
						{#each reportStore.templates as template}
							<div
								class="p:12px hover:bg:gray-50 cursor:pointer {selectedTemplate?.id === template.id
									? 'bg:blue-50'
									: ''}"
								role="button"
								tabindex="0"
								onclick={() => (selectedTemplate = template)}
								onkeydown={(e) => e.key === 'Enter' && (selectedTemplate = template)}
							>
								<div class="items:center justify:between mb:4px flex">
									<h3 class="font:14px font:medium">{template.name}</h3>
									{#if template.isDefault}
										<span class="px:6px py:2px bg:green-100 color:green-800 r:12px font:10px">
											デフォルト
										</span>
									{/if}
								</div>
								<p class="font:12px color:gray-600 mb:2px">
									{reportTypeOptions.find((opt) => opt.value === template.type)?.label}
								</p>
								<p class="font:12px color:gray-500">
									{template.sections.length} セクション
								</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- テンプレート詳細・編集 -->
		<div class="flex:1 flex:col flex">
			{#if isCreating || isEditing}
				<!-- テンプレート編集フォーム -->
				<div class="p:16px border-b:1px|solid|gray-200">
					<h2 class="font:18px font:bold mb:16px">
						{isCreating ? 'テンプレート作成' : 'テンプレート編集'}
					</h2>

					<div class="grid-cols:2 gap:12px mb:16px grid">
						<FormField label="テンプレート名" required>
							<input
								type="text"
								bind:value={templateForm.name}
								class="w:full p:8px border:1px|solid|gray-300 r:4px"
								placeholder="テンプレート名を入力"
							/>
						</FormField>

						<FormField label="レポート種別" required>
							<select
								bind:value={templateForm.type}
								class="w:full p:8px border:1px|solid|gray-300 r:4px"
							>
								{#each reportTypeOptions as option}
									<option value={option.value}>{option.label}</option>
								{/each}
							</select>
						</FormField>
					</div>

					<FormField label="デフォルトテンプレート">
						<label class="items:center gap:8px flex">
							<input type="checkbox" bind:checked={templateForm.isDefault} class="w:16px h:16px" />
							<span class="font:14px">このテンプレートをデフォルトとして使用する</span>
						</label>
					</FormField>
				</div>

				<!-- セクション管理 -->
				<div class="flex:1 overflow:auto p:16px">
					<div class="items:center justify:between mb:16px flex">
						<h3 class="font:16px font:bold">セクション設定</h3>
						<Button variant="secondary" onclick={startAddSection}>
							<Icon icon="material-symbols:add" class="w:16px h:16px mr:4px" />
							セクション追加
						</Button>
					</div>

					{#if templateForm.sections.length === 0}
						<div class="text:center py:32px">
							<Icon icon="material-symbols:list" class="w:32px h:32px color:gray-400 mb:8px" />
							<p class="font:14px color:gray-600">セクションを追加してください</p>
						</div>
					{:else}
						<div class="space-y:8px">
							{#each templateForm.sections as section, index}
								<div class="p:12px border:1px|solid|gray-200 r:8px">
									<div class="items:center justify:between mb:8px flex">
										<div class="items:center gap:8px flex">
											<span
												class="w:24px h:24px bg:blue-100 color:blue-800 r:50% items:center justify:center font:12px font:bold flex"
											>
												{index + 1}
											</span>
											<h4 class="font:14px font:medium">{section.title}</h4>
											{#if section.isRequired}
												<span class="px:6px py:2px bg:red-100 color:red-800 r:12px font:10px">
													必須
												</span>
											{/if}
										</div>

										<div class="items:center gap:4px flex">
											<button
												onclick={() => moveSectionUp(index)}
												disabled={index === 0}
												class="p:4px hover:bg:gray-100 r:4px disabled:opacity:50"
												title="上に移動"
											>
												<Icon icon="material-symbols:keyboard-arrow-up" class="w:16px h:16px" />
											</button>

											<button
												onclick={() => moveSectionDown(index)}
												disabled={index === templateForm.sections.length - 1}
												class="p:4px hover:bg:gray-100 r:4px disabled:opacity:50"
												title="下に移動"
											>
												<Icon icon="material-symbols:keyboard-arrow-down" class="w:16px h:16px" />
											</button>

											<button
												onclick={() => startEditSection(index)}
												class="p:4px hover:bg:blue-100 r:4px"
												title="編集"
											>
												<Icon icon="material-symbols:edit" class="w:16px h:16px color:blue-600" />
											</button>

											<button
												onclick={() => removeSection(index)}
												class="p:4px hover:bg:red-100 r:4px"
												title="削除"
											>
												<Icon icon="material-symbols:delete" class="w:16px h:16px color:red-600" />
											</button>
										</div>
									</div>

									<p class="font:12px color:gray-600">
										種別: {sectionTypeOptions.find((opt) => opt.value === section.type)?.label}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- アクションボタン -->
				<div class="p:16px border-t:1px|solid|gray-200 justify:end gap:12px flex">
					<Button variant="secondary" onclick={cancelEdit}>キャンセル</Button>
					<Button onclick={saveTemplate} disabled={!templateForm.name.trim()}>
						{isCreating ? '作成' : '更新'}
					</Button>
				</div>
			{:else if selectedTemplate}
				<!-- テンプレート詳細表示 -->
				<div class="p:16px border-b:1px|solid|gray-200">
					<div class="items:center justify:between mb:12px flex">
						<h2 class="font:18px font:bold">{selectedTemplate.name}</h2>
						<div class="gap:8px flex">
							<Button
								variant="secondary"
								onclick={() => selectedTemplate && selectTemplate(selectedTemplate)}
							>
								このテンプレートを使用
							</Button>
							<Button
								variant="secondary"
								onclick={() => selectedTemplate && startEditTemplate(selectedTemplate)}
							>
								<Icon icon="material-symbols:edit" class="w:16px h:16px mr:4px" />
								編集
							</Button>
							<Button
								variant="secondary"
								onclick={() => deleteTemplate(selectedTemplate!)}
								class="color:red-600 hover:bg:red-50"
							>
								<Icon icon="material-symbols:delete" class="w:16px h:16px mr:4px" />
								削除
							</Button>
						</div>
					</div>

					<div class="items:center gap:16px flex">
						<span class="px:8px py:4px bg:gray-100 color:gray-700 r:12px font:12px">
							{reportTypeOptions.find((opt) => opt.value === selectedTemplate.type)?.label}
						</span>
						{#if selectedTemplate.isDefault}
							<span class="px:8px py:4px bg:green-100 color:green-800 r:12px font:12px">
								デフォルトテンプレート
							</span>
						{/if}
					</div>
				</div>

				<div class="flex:1 overflow:auto p:16px">
					<h3 class="font:16px font:bold mb:12px">セクション構成</h3>

					{#if selectedTemplate.sections.length === 0}
						<p class="color:gray-600">セクションが設定されていません</p>
					{:else}
						<div class="space-y:8px">
							{#each selectedTemplate.sections as section}
								<div class="p:12px border:1px|solid|gray-200 r:8px">
									<div class="items:center gap:8px mb:4px flex">
										<span
											class="w:24px h:24px bg:blue-100 color:blue-800 r:50% items:center justify:center font:12px font:bold flex"
										>
											{section.order}
										</span>
										<h4 class="font:14px font:medium">{section.title}</h4>
										{#if section.isRequired}
											<span class="px:6px py:2px bg:red-100 color:red-800 r:12px font:10px">
												必須
											</span>
										{/if}
									</div>
									<p class="font:12px color:gray-600 ml:32px">
										種別: {sectionTypeOptions.find((opt) => opt.value === section.type)?.label}
									</p>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<!-- 初期状態 -->
				<div class="flex:1 items:center justify:center flex">
					<div class="text:center">
						<Icon
							icon="material-symbols:description"
							class="w:48px h:48px color:gray-400 mb:12px"
						/>
						<p class="font:16px color:gray-600 mb:8px">テンプレートを選択してください</p>
						<p class="font:14px color:gray-500">
							左側のリストからテンプレートを選択するか、新規作成してください
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- セクション編集モーダル -->
	{#if showSectionForm}
		<Modal
			isOpen={true}
			onClose={() => (showSectionForm = false)}
			title={editingSectionIndex !== null ? 'セクション編集' : 'セクション追加'}
		>
			<div class="p:24px space-y:16px">
				<FormField label="セクション名" required>
					<input
						type="text"
						bind:value={sectionForm.title}
						class="w:full p:8px border:1px|solid|gray-300 r:4px"
						placeholder="セクション名を入力"
					/>
				</FormField>

				<FormField label="入力種別" required>
					<select
						bind:value={sectionForm.type}
						class="w:full p:8px border:1px|solid|gray-300 r:4px"
					>
						{#each sectionTypeOptions as option}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</FormField>

				<FormField label="必須項目">
					<label class="items:center gap:8px flex">
						<input type="checkbox" bind:checked={sectionForm.isRequired} class="w:16px h:16px" />
						<span class="font:14px">このセクションを必須にする</span>
					</label>
				</FormField>

				{#if sectionForm.type === 'text'}
					<FormField label="プレースホルダー">
						<input
							type="text"
							bind:value={sectionForm.config.placeholder}
							class="w:full p:8px border:1px|solid|gray-300 r:4px"
							placeholder="入力欄のプレースホルダーテキスト"
						/>
					</FormField>
				{/if}
			</div>

			<div class="justify:end gap:12px p:24px border-t:1px|solid|gray-200 flex">
				<Button variant="secondary" onclick={() => (showSectionForm = false)}>キャンセル</Button>
				<Button onclick={saveSection} disabled={!sectionForm.title.trim()}>
					{editingSectionIndex !== null ? '更新' : '追加'}
				</Button>
			</div>
		</Modal>
	{/if}
</Modal>
