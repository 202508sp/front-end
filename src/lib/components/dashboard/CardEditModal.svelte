<!--
  カード編集モーダルコンポーネント
  ダッシュボードカードの設定を編集するためのモーダル
-->
<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import type { DashboardCard, CardConfig, CardSize } from '$lib/types/dashboard.js';
  import Icon from '@iconify/svelte';

  interface Props {
    isOpen: boolean;
    card: DashboardCard | null;
    onClose: () => void;
    onSave: (cardId: string, updates: Partial<DashboardCard>) => void;
  }

  let { isOpen, card, onClose, onSave }: Props = $props();

  // 編集用の状態
  let editTitle = $state('');
  let editSize = $state<CardSize>('medium');
  let editConfig = $state<CardConfig>({});
  let editIsVisible = $state(true);

  // カードが変更されたときに編集状態を初期化
  $effect(() => {
    if (card) {
      editTitle = card.title;
      editSize = card.size;
      editConfig = { ...card.config };
      editIsVisible = card.isVisible;
    }
  });

  // サイズオプション
  const sizeOptions = [
    { value: 'small', label: '小 (120x120)' },
    { value: 'medium', label: '中 (240x120)' },
    { value: 'large', label: '大 (240x240)' }
  ] as const;

  // カードタイプ別の設定項目
  const getConfigFields = (cardType: string) => {
    switch (cardType) {
      case 'user-list':
        return [
          { key: 'maxItems', label: '最大表示件数', type: 'number', min: 1, max: 50 },
          { key: 'sortBy', label: 'ソート順', type: 'select', options: [
            { value: 'name', label: '名前順' },
            { value: 'age', label: '年齢順' },
            { value: 'careLevel', label: '要介護度順' }
          ]}
        ];
      case 'statistics':
        return [
          { key: 'statType', label: '統計タイプ', type: 'select', options: [
            { value: 'user-count', label: '利用者数' },
            { value: 'staff-count', label: '職員数' },
            { value: 'daily-reports', label: '日次レポート' },
            { value: 'monthly-summary', label: '月次サマリー' }
          ]},
          { key: 'dateRange', label: '期間', type: 'select', options: [
            { value: 'today', label: '今日' },
            { value: 'week', label: '今週' },
            { value: 'month', label: '今月' },
            { value: 'custom', label: 'カスタム' }
          ]}
        ];
      case 'notifications':
        return [
          { key: 'maxItems', label: '最大表示件数', type: 'number', min: 1, max: 20 },
          { key: 'showUrgentOnly', label: '緊急通知のみ表示', type: 'boolean' }
        ];
      case 'schedule':
        return [
          { key: 'maxItems', label: '最大表示件数', type: 'number', min: 1, max: 10 },
          { key: 'showToday', label: '今日の予定のみ', type: 'boolean' }
        ];
      case 'quick-actions':
        return [
          { key: 'showLabels', label: 'ラベル表示', type: 'boolean' },
          { key: 'buttonSize', label: 'ボタンサイズ', type: 'select', options: [
            { value: 'small', label: '小' },
            { value: 'medium', label: '中' },
            { value: 'large', label: '大' }
          ]}
        ];
      default:
        return [];
    }
  };

  // 保存処理
  function handleSave() {
    if (!card) return;

    const updates: Partial<DashboardCard> = {
      title: editTitle,
      size: editSize,
      config: editConfig,
      isVisible: editIsVisible,
      updatedAt: new Date()
    };

    onSave(card.id, updates);
    onClose();
  }

  // 設定値の更新
  function updateConfig(key: string, value: any) {
    editConfig = { ...editConfig, [key]: value };
  }

  // リセット処理
  function handleReset() {
    if (card) {
      editTitle = card.title;
      editSize = card.size;
      editConfig = { ...card.config };
      editIsVisible = card.isVisible;
    }
  }
</script>

{#snippet footerSnippet()}
  <div class="justify:between gap:8px flex">
    <Button variant="outline" onclick={handleReset}>
      <Icon icon="material-symbols:refresh" class="w:16px h:16px mr:6px" />
      リセット
    </Button>
    <div class="gap:8px flex">
      <Button variant="secondary" onclick={onClose}>キャンセル</Button>
      <Button variant="primary" onclick={handleSave}>
        <Icon icon="material-symbols:save" class="w:16px h:16px mr:6px" />
        保存
      </Button>
    </div>
  </div>
{/snippet}

<Modal {isOpen} {onClose} title="カード設定" size="md" footer={footerSnippet}>
  {#snippet children()}
    {#if card}
      <div class="card-edit-form space-y:20px p:20px">
        <!-- カード情報 -->
        <div class="card-info bg:gray-50 r:8px p:16px">
          <div class="align:center gap:12px mb:12px flex">
            <Icon icon={card.icon} class="w:24px h:24px text:gray-600" />
            <div>
              <h3 class="font:medium text:gray-800">カードタイプ: {card.type}</h3>
              <p class="text:sm text:gray-600">作成日: {card.createdAt.toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </div>

        <!-- 基本設定 -->
        <div class="basic-settings">
          <h4 class="text:lg font:medium text:gray-800 mb:12px">基本設定</h4>
          
          <div class="space-y:16px">
            <!-- タイトル -->
            <FormField label="カードタイトル" required>
              <Input
                bind:value={editTitle}
                placeholder="カードのタイトルを入力"
                maxlength={50}
              />
            </FormField>

            <!-- サイズ -->
            <FormField label="カードサイズ">
              <div class="size-options grid-cols:3 gap:8px grid">
                {#each sizeOptions as option}
                  <label class="size-option cursor:pointer">
                    <input
                      type="radio"
                      bind:group={editSize}
                      value={option.value}
                      class="sr-only"
                    />
                    <div class="size-card border:2|solid|gray-200 r:6px p:12px text:center transition:all|0.2s {editSize === option.value ? 'border:blue-500 bg:blue-50' : 'hover:border:gray-300'}">
                      <div class="text:sm font:medium text:gray-800">{option.label}</div>
                    </div>
                  </label>
                {/each}
              </div>
            </FormField>

            <!-- 表示設定 -->
            <FormField label="表示設定">
              <Toggle
                bind:checked={editIsVisible}
                label="ダッシュボードに表示する"
                description="オフにするとカードが非表示になります"
              />
            </FormField>
          </div>
        </div>

        <!-- カードタイプ別設定 -->
        {#if getConfigFields(card.type).length > 0}
          <div class="type-settings">
            <h4 class="text:lg font:medium text:gray-800 mb:12px">詳細設定</h4>
            
            <div class="space-y:16px">
              {#each getConfigFields(card.type) as field}
                <FormField label={field.label}>
                  {#if field.type === 'number'}
                    <Input
                      type="number"
                      value={editConfig[field.key] || ''}
                      min={field.min}
                      max={field.max}
                      onchange={(e) => updateConfig(field.key, parseInt(e.currentTarget.value) || field.min)}
                    />
                  {:else if field.type === 'select' && field.options}
                    <select
                      class="w:full p:8px border:1|solid|gray-300 r:4px focus:border:blue-500 focus:outline:none"
                      value={editConfig[field.key] || ''}
                      onchange={(e) => updateConfig(field.key, e.currentTarget.value)}
                    >
                      {#each field.options as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  {:else if field.type === 'boolean'}
                    <Toggle
                      checked={editConfig[field.key] || false}
                      onchange={(checked) => updateConfig(field.key, checked)}
                      label=""
                    />
                  {/if}
                </FormField>
              {/each}
            </div>
          </div>
        {/if}

        <!-- プレビュー -->
        <div class="preview-section">
          <h4 class="text:lg font:medium text:gray-800 mb:12px">プレビュー</h4>
          <div class="preview-container bg:gray-50 r:8px p:16px">
            <div class="preview-card bg:white border:1|solid|gray-200 r:8px p:12px {editSize === 'small' ? 'w:120px h:120px' : editSize === 'medium' ? 'w:240px h:120px' : 'w:240px h:240px'}">
              <div class="align:center gap:8px mb:8px flex">
                <Icon icon={card.icon} class="w:16px h:16px text:gray-600" />
                <span class="text:sm font:medium text:gray-800 truncate">{editTitle}</span>
              </div>
              <div class="text:xs text:gray-500">
                サイズ: {sizeOptions.find(opt => opt.value === editSize)?.label}
              </div>
              {#if !editIsVisible}
                <div class="text:xs text:red-500 mt:4px">※ 非表示設定</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    {/if}
  {/snippet}
</Modal>

<style>
  .size-option input:checked + .size-card {
    border-color: #3b82f6;
    background-color: #eff6ff;
  }

  .preview-card {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 8px center;
    background-repeat: no-repeat;
    background-size: 16px;
    padding-right: 32px;
  }
</style>