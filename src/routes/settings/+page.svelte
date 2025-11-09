<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { settingsStore } from '$lib/stores/settings.svelte';
  import { 
    SettingsForm, 
    SettingsNavigation, 
    SettingsResetDialog, 
    UnsavedChangesDialog 
  } from '$lib/components/settings';
  import Button from '$lib/components/ui/Button.svelte';
  import type { SettingsPageState } from '$lib/types/settings';

  // ページ状態
  let pageState = $state<SettingsPageState>({
    activeGroup: undefined,
    showResetDialog: false,
    showUnsavedChangesDialog: false
  });

  // 保存状態
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let saveSuccess = $state(false);

  // 派生状態
  const groups = $derived(settingsStore.groups);
  const currentValues = $derived(settingsStore.currentValues);
  const errors = $derived(settingsStore.errors);
  const isDirty = $derived(settingsStore.isDirty);
  const isLoading = $derived(settingsStore.isLoading);

  // アクティブグループの設定
  $effect(() => {
    if (groups.length > 0 && !pageState.activeGroup) {
      // URLパラメータから取得、なければ最初のグループ
      const urlGroup = $page.url.searchParams.get('group');
      const validGroup = groups.find(g => g.key === urlGroup);
      pageState.activeGroup = validGroup?.key || groups[0].key;
    }
  });

  // アクティブグループのフィルタリング
  const activeGroups = $derived(
    pageState.activeGroup 
      ? groups.filter(g => g.key === pageState.activeGroup)
      : groups
  );

  // 初期化
  onMount(async () => {
    try {
      await settingsStore.initialize();
    } catch (error) {
      console.error('設定の初期化に失敗しました:', error);
    }
  });

  // グループ選択処理
  function handleGroupSelect(groupKey: string) {
    if (isDirty) {
      // 未保存の変更がある場合は確認ダイアログを表示
      pageState.showUnsavedChangesDialog = true;
      return;
    }
    
    selectGroup(groupKey);
  }

  function selectGroup(groupKey: string) {
    pageState.activeGroup = groupKey;
    
    // URLを更新
    const url = new URL($page.url);
    url.searchParams.set('group', groupKey);
    goto(url.toString(), { replaceState: true });
  }

  // フィールド変更処理
  function handleFieldChange(key: string, value: any) {
    settingsStore.updateField(key, value);
    
    // 成功メッセージをクリア
    if (saveSuccess) {
      saveSuccess = false;
    }
  }

  // フィールドバリデーション
  function handleFieldValidate(key: string, value: any): string | null {
    const field = settingsStore.getField(key);
    if (!field) return null;
    
    // バリデーションロジックはストア内で処理
    return null;
  }

  // 設定保存処理
  async function handleSave() {
    if (!isDirty) return;

    isSaving = true;
    saveError = null;
    saveSuccess = false;

    try {
      await settingsStore.save();
      saveSuccess = true;
      
      // 成功メッセージを3秒後に自動で消す
      setTimeout(() => {
        saveSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      saveError = error instanceof Error ? error.message : '設定の保存に失敗しました';
    } finally {
      isSaving = false;
    }
  }

  // 変更破棄処理
  function handleDiscard() {
    settingsStore.discardChanges();
    pageState.showUnsavedChangesDialog = false;
  }

  // リセット処理
  function handleReset() {
    pageState.showResetDialog = true;
  }

  async function handleConfirmReset() {
    try {
      await settingsStore.reset();
      pageState.showResetDialog = false;
      saveSuccess = true;
      
      setTimeout(() => {
        saveSuccess = false;
      }, 3000);
    } catch (error) {
      console.error('設定のリセットに失敗しました:', error);
      saveError = error instanceof Error ? error.message : '設定のリセットに失敗しました';
    }
  }

  // 未保存変更ダイアログの処理
  function handleSaveAndContinue() {
    handleSave().then(() => {
      pageState.showUnsavedChangesDialog = false;
      // 元々選択しようとしていたグループに移動
      // この実装では簡略化
    });
  }

  function handleDiscardAndContinue() {
    handleDiscard();
    // 元々選択しようとしていたグループに移動
    // この実装では簡略化
  }

  // キーボードショートカット
  function handleKeydown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 's':
          event.preventDefault();
          if (isDirty && !isSaving) {
            handleSave();
          }
          break;
        case 'z':
          event.preventDefault();
          if (isDirty) {
            handleDiscard();
          }
          break;
      }
    }
  }

  // ページ離脱時の確認
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (isDirty) {
      event.preventDefault();
      event.returnValue = '未保存の変更があります。このページを離れますか？';
    }
  }

  // ページ離脱時の確認を設定
  $effect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="settings-page min-h:screen bg:care-gray-50" data-testid="settings-page">
  <!-- ページヘッダー -->
  <div class="bg:white border-b:1|solid|care-gray-200">
    <div class="max-w:7xl mx:auto px:4 sm:px:6 lg:px:8">
      <div class="flex items-center justify-between h:16">
        <div>
          <h1 class="text:2xl font:bold text:care-text-primary">設定</h1>
          <p class="text:sm text:care-text-secondary mt:1">
            システムの動作を設定・カスタマイズできます
          </p>
        </div>

        <!-- ヘッダーアクション -->
        <div class="flex items-center gap:3">
          <!-- 保存状態表示 -->
          {#if saveSuccess}
            <div class="flex items-center gap:2 text:care-accent-success-600 text:sm">
              <svg class="w:4 h:4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              設定を保存しました
            </div>
          {:else if saveError}
            <div class="flex items-center gap:2 text:care-accent-error-600 text:sm">
              <svg class="w:4 h:4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              {saveError}
            </div>
          {:else if isDirty}
            <div class="flex items-center gap:2 text:care-accent-warning-600 text:sm">
              <svg class="w:4 h:4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
              </svg>
              未保存の変更があります
            </div>
          {/if}

          <!-- アクションボタン -->
          <div class="flex gap:2">
            <Button
              variant="ghost"
              size="sm"
              disabled={!isDirty || isSaving}
              onclick={handleDiscard}
              data-testid="discard-button"
            >
              変更を破棄
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onclick={handleReset}
              data-testid="reset-button"
            >
              リセット
            </Button>
            
            <Button
              variant="primary"
              size="sm"
              disabled={!isDirty}
              loading={isSaving}
              onclick={handleSave}
              data-testid="save-button"
            >
              {#if isSaving}
                保存中...
              {:else}
                変更を保存
              {/if}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- メインコンテンツ -->
  <div class="max-w:7xl mx:auto px:4 sm:px:6 lg:px:8 py:8">
    <div class="flex gap:8">
      <!-- サイドナビゲーション -->
      <div class="w:80 flex-shrink:0">
        <div class="sticky top:8">
          <SettingsNavigation
            {groups}
            activeGroup={pageState.activeGroup}
            onGroupSelect={handleGroupSelect}
            data-testid="settings-navigation"
          />
        </div>
      </div>

      <!-- 設定フォーム -->
      <div class="flex-1 min-w:0">
        {#if isLoading}
          <div class="flex items-center justify-center h:64">
            <div class="flex items-center gap:3 text:care-text-secondary">
              <svg class="animate:spin w:6 h:6" fill="none" viewBox="0 0 24 24">
                <circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              設定を読み込み中...
            </div>
          </div>
        {:else if groups.length === 0}
          <div class="text-center py:16">
            <div class="text:care-text-secondary">
              設定項目が見つかりません
            </div>
          </div>
        {:else}
          <SettingsForm
            groups={activeGroups}
            values={currentValues}
            {errors}
            disabled={isSaving}
            onFieldChange={handleFieldChange}
            onValidate={handleFieldValidate}
            data-testid="settings-form"
          />
        {/if}
      </div>
    </div>
  </div>

  <!-- キーボードショートカットヘルプ -->
  <div class="fixed bottom:4 right:4 bg:care-gray-800 text:white text:xs px:3 py:2 rounded:md opacity:75">
    <div class="space-y:1">
      <div>Ctrl+S: 保存</div>
      <div>Ctrl+Z: 変更を破棄</div>
    </div>
  </div>
</div>

<!-- ダイアログ -->
<SettingsResetDialog
  isOpen={pageState.showResetDialog}
  isLoading={isSaving}
  onConfirm={handleConfirmReset}
  onCancel={() => pageState.showResetDialog = false}
  data-testid="reset-dialog"
/>

<UnsavedChangesDialog
  isOpen={pageState.showUnsavedChangesDialog}
  onSave={handleSaveAndContinue}
  onDiscard={handleDiscardAndContinue}
  onCancel={() => pageState.showUnsavedChangesDialog = false}
  data-testid="unsaved-changes-dialog"
/>

<style>
  .settings-page {
    min-height: 100vh;
  }
</style>