<!--
  カードセレクターコンポーネント
  新しいカードを追加するためのモーダル
-->
<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { CardTemplate } from '$lib/types/dashboard.js';
	import Icon from '@iconify/svelte';

	interface Props {
		isOpen: boolean;
		templates: CardTemplate[];
		onClose: () => void;
		onSelect: (template: CardTemplate) => void;
	}

	let { isOpen, templates, onClose, onSelect }: Props = $props();

	// カテゴリ別にテンプレートをグループ化
	const groupedTemplates = $derived(() => {
		const groups: Record<string, CardTemplate[]> = {};
		templates.forEach((template) => {
			if (!groups[template.category]) {
				groups[template.category] = [];
			}
			groups[template.category].push(template);
		});
		return groups;
	});

	// カテゴリの表示名
	const categoryNames: Record<string, string> = {
		management: '管理',
		statistics: '統計',
		communication: 'コミュニケーション',
		utilities: 'ユーティリティ'
	};

	// テンプレート選択ハンドラー
	function handleTemplateSelect(template: CardTemplate) {
		onSelect(template);
		onClose();
	}
</script>

{#snippet footerSnippet()}
	<div class="justify:end gap:8px flex">
		<Button variant="secondary" onclick={onClose}>キャンセル</Button>
	</div>
{/snippet}

<Modal {isOpen} {onClose} title="カードを追加" size="lg" footer={footerSnippet}>
	{#snippet children()}
		<div class="card-selector p:20px">
			<div class="mb:16px">
				<p class="text:gray-600 text:sm">ダッシュボードに追加するカードを選択してください。</p>
			</div>

			<div class="categories space-y:24px">
				{#each Object.entries(groupedTemplates) as [category, categoryTemplates]}
					<div class="category">
						<h3
							class="category-title text:lg font:semibold text:gray-800 mb:12px align:center gap:8px flex"
						>
							{#if category === 'management'}
								<Icon
									icon="material-symbols:manage-accounts-outline"
									class="w:20px h:20px text:blue-600"
								/>
							{:else if category === 'statistics'}
								<Icon
									icon="material-symbols:analytics-outline"
									class="w:20px h:20px text:green-600"
								/>
							{:else if category === 'communication'}
								<Icon icon="material-symbols:chat-outline" class="w:20px h:20px text:purple-600" />
							{:else if category === 'utilities'}
								<Icon icon="material-symbols:build-outline" class="w:20px h:20px text:orange-600" />
							{/if}
							{categoryNames[category] || category}
						</h3>

						<div class="template-grid grid-cols:1 md:grid-cols:2 lg:grid-cols:3 gap:12px grid">
							{#each categoryTemplates as template}
								<div
									class="template-card bg:white border:1|solid|gray-200 r:8px p:16px hover:shadow:md hover:border:blue-300 transition:all|0.2s cursor:pointer"
									onclick={() => handleTemplateSelect(template)}
									onkeydown={(e) => e.key === 'Enter' && handleTemplateSelect(template)}
									role="button"
									tabindex="0"
								>
									<div class="template-header align:center gap:12px mb:8px flex">
										<div
											class="template-icon w:40px h:40px bg:gray-100 r:8px align:center justify:center flex"
										>
											<Icon icon={template.icon} class="w:24px h:24px text:gray-600" />
										</div>
										<div class="template-info flex-1">
											<h4 class="template-title font:medium text:gray-800 mb:2px">
												{template.title}
											</h4>
											<div
												class="template-size text:xs text:gray-500 bg:gray-100 px:6px py:2px r:3px inline-block"
											>
												{template.defaultSize}
											</div>
										</div>
									</div>

									<p class="template-description text:sm text:gray-600 leading:relaxed">
										{template.description}
									</p>

									<!-- 設定プレビュー -->
									{#if Object.keys(template.defaultConfig).length > 0}
										<div class="template-config mt:8px pt:8px border-top:1|solid|gray-100">
											<div class="text:xs text:gray-500 mb:4px">デフォルト設定:</div>
											<div class="config-items gap:4px flex flex-wrap">
												{#each Object.entries(template.defaultConfig) as [key, value]}
													<span
														class="config-item text:xs bg:blue-50 text:blue-700 px:4px py:1px r:2px"
													>
														{key}: {value}
													</span>
												{/each}
											</div>
										</div>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			{#if templates.length === 0}
				<div class="empty-state text:center py:40px">
					<Icon
						icon="material-symbols:widgets-outline"
						class="w:48px h:48px text:gray-400 mx:auto mb:16px"
					/>
					<h3 class="text:lg font:medium text:gray-600 mb:8px">利用可能なカードがありません</h3>
					<p class="text:gray-500">カードテンプレートが設定されていません。</p>
				</div>
			{/if}
		</div>
	{/snippet}
</Modal>

<style>
	.template-card:hover {
		transform: translateY(-2px);
	}

	.template-card:focus {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	.template-icon {
		transition: all 0.2s;
	}

	.template-card:hover .template-icon {
		background-color: #eff6ff;
	}

	.config-item {
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.template-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
