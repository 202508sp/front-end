<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';
  import SettingsNavigation from './SettingsNavigation.svelte';
  import SettingsForm from './SettingsForm.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '@iconify/svelte';

  interface Props {
    initialCategory?: string;
  }

  let { initialCategory = 'general' }: Props = $props();

  // 選択されたカテゴリ
  let selectedCategory = $state(initialCategory);

  // リセット確認モーダル
  let showResetModal = $state(false);
  let resetType: 'category' | 'all' = $state('category');

  // カテゴリ変更ハンドラ
  function handleCategoryChange(category: string) {
    // 未保存の変更がある場合は確認
    if (settingsStore.isDirty) {
      const shouldContinue = confirm('未保存の変更があります。破棄して続行しますか？');
      if (!shouldContinue) {
        return;
      }
    }
    
    selectedCategory = category;
  }

  // 保存成功ハンドラ
  function handleSaveSuccess() {
    // 成功メッセージは SettingsForm 内で表示される
    console.log('設定が保存されました');
  }

  // リセット確認ハンドラ
  function handleResetRequest() {
    resetType = 'category';
    showResetModal = true;
  }

  // 全設定リセット確認ハンドラ
  function handleResetAllRequest() {
    resetType = 'all';
    showResetModal = true;
  }

  // リセット実行ハンドラ
  function handleResetConfirm() {
    if (resetType === 'all') {
      settingsStore.resetSettings();
    } else {
      settingsStore.resetCategory(selectedCategory);
    }
    showResetModal = false;
  }

  // リセットキャンセルハンドラ
  function handleResetCancel() {
    showResetModal = false;
  }

  // ページ離脱時の確認
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (settingsStore.isDirty) {
      event.preventDefault();
      event.returnValue = '未保存の変更があります。ページを離れますか？';
    }
  }

  // 選択されたカテゴリの情報を取得
  const selectedCategoryInfo = $derived(
    settingsStore.settingCategories.find(cat => cat.key === selectedCategory)
  );
</script>

<svelte:window onbeforeunload={handleBeforeUnload} />

<div class="settings-layout">
  <!-- ヘッダー -->
  <div class="settings-header mb:32px">
    <div class="flex align-items:center justify-content:space-between">
      <div>
        <h1 class="font-size:28px font-weight:700 color:text mb:8px">設定</h1>
        <p class="color:secondary font-size:16px">
          システムの動作や外観をカスタマイズできます
        </p>
      </div>
      
      <!-- ヘッダーアクション -->
      <div class="header-actions flex gap:12px">
        <Button
          variant="secondary"
          size="sm"
          onclick={handleResetAllRequest}
          disabled={settingsStore.isSaving}
        >
          <Icon icon="material-symbols:restore" class="mr:8px" />
          全てリセット
        </Button>
        
        {#if settingsStore.isDirty}
          <Button
            variant="primary"
            size="sm"
            onclick={() => settingsStore.saveSettings()}
            loading={settingsStore.isSaving}
          >
            <Icon icon="material-symbols:save" class="mr:8px" />
            変更を保存
          </Button>
        {/if}
      </div>
    </div>
  </div>

  <!-- メインコンテンツ -->
  <div class="settings-content">
    <div class="settings-grid">
      <!-- ナビゲーション -->
      <div class="settings-nav">
        <SettingsNavigation
          {selectedCategory}
          onCategoryChange={handleCategoryChange}
        />
      </div>

      <!-- 設定フォーム -->
      <div class="settings-main">
        <div class="settings-form-container">
          <!-- カテゴリタイトル（モバイル用） -->
          <div class="mobile-category-title mb:24px">
            {#if selectedCategoryInfo}
              <div class="flex align-items:center gap:12px">
                <Icon icon={selectedCategoryInfo.icon} class="font-size:24px color:primary" />
                <h2 class="font-size:20px font-weight:600 color:text">{selectedCategoryInfo.label}</h2>
              </div>
            {/if}
          </div>

          <SettingsForm
            {selectedCategory}
            onSave={handleSaveSuccess}
            onReset={handleResetRequest}
          />
        </div>
      </div>
    </div>
  </div>

  <!-- リセット確認モーダル -->
  {#if showResetModal}
    <Modal
      title={resetType === 'all' ? '全設定をリセット' : 'カテゴリをリセット'}
      size="md"
      onClose={handleResetCancel}
      isOpen={true}
    >
      <div class="reset-modal-content">
        <div class="flex align-items:start gap:16px mb:24px">
          <Icon icon="material-symbols:warning" class="font-size:24px color:warning flex-shrink:0 mt:2px" />
          <div>
            <p class="font-size:16px color:text mb:8px">
              {#if resetType === 'all'}
                全ての設定をデフォルト値にリセットします。
              {:else}
                「{selectedCategoryInfo?.label}」カテゴリの設定をデフォルト値にリセットします。
              {/if}
            </p>
            <p class="font-size:14px color:secondary">
              この操作は元に戻すことができません。続行しますか？
            </p>
          </div>
        </div>

        <div class="flex gap:12px justify-content:flex-end">
          <Button
            variant="secondary"
            onclick={handleResetCancel}
          >
            キャンセル
          </Button>
          <Button
            variant="danger"
            onclick={handleResetConfirm}
          >
            <Icon icon="material-symbols:restore" class="mr:8px" />
            リセット
          </Button>
        </div>
      </div>
    </Modal>
  {/if}
</div>

<style>
  .settings-layout {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
  }

  .settings-content {
    min-height: calc(100vh - 200px);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 32px;
    align-items: start;
  }

  .settings-form-container {
    background: white;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
  }

  .mobile-category-title {
    display: none;
  }

  .reset-modal-content {
    padding: 8px;
  }

  @media (max-width: 768px) {
    .settings-layout {
      padding: 16px;
    }

    .settings-grid {
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .settings-form-container {
      padding: 20px;
      border-radius: 8px;
    }

    .mobile-category-title {
      display: block;
    }

    .header-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .settings-header {
      margin-bottom: 24px;
    }

    .settings-header .flex {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
  }

  @media (max-width: 480px) {
    .settings-layout {
      padding: 12px;
    }

    .settings-form-container {
      padding: 16px;
    }

    .header-actions {
      gap: 8px;
    }
  }
</style>