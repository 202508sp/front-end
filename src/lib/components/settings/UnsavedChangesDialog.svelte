<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    isOpen: boolean;
    onSave: () => void;
    onDiscard: () => void;
    onCancel: () => void;
    'data-testid'?: string;
  }

  let {
    isOpen,
    onSave,
    onDiscard,
    onCancel,
    'data-testid': testId
  }: Props = $props();

  function handleSave() {
    onSave();
  }

  function handleDiscard() {
    onDiscard();
  }

  function handleCancel() {
    onCancel();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleCancel();
    }
  }
</script>

<Modal
  {isOpen}
  title="未保存の変更があります"
  size="md"
  closable={true}
  onClose={handleCancel}
  data-testid={testId}
>
  <div class="unsaved-changes-dialog" role="dialog" tabindex="-1" onkeydown={handleKeydown}>
    <!-- 情報アイコンとメッセージ -->
    <div class="flex items-start gap:4 mb:6">
      <div class="w:12 h:12 bg:care-accent-warning-100 rounded:full flex items-center justify-center flex-shrink:0">
        <svg class="w:6 h:6 text:care-accent-warning-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      
      <div class="flex-1">
        <h3 class="text:lg font:semibold text:care-text-primary mb:2">
          設定に未保存の変更があります
        </h3>
        <div class="text:sm text:care-text-secondary space-y:2">
          <p>
            変更した設定が保存されていません。このまま続行すると変更内容が失われます。
          </p>
          <p>
            どのように処理しますか？
          </p>
        </div>
      </div>
    </div>

    <!-- 選択肢の説明 -->
    <div class="bg:care-gray-50 rounded:lg p:4 mb:6">
      <div class="space-y:3">
        <div class="flex items-start gap:3">
          <div class="w:6 h:6 text:care-primary-600 mt:0.5">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
            </svg>
          </div>
          <div>
            <div class="font:medium text:care-text-primary">変更を保存</div>
            <div class="text:xs text:care-text-secondary">現在の変更内容を保存してから続行します</div>
          </div>
        </div>
        
        <div class="flex items-start gap:3">
          <div class="w:6 h:6 text:care-accent-error-600 mt:0.5">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </div>
          <div>
            <div class="font:medium text:care-text-primary">変更を破棄</div>
            <div class="text:xs text:care-text-secondary">変更内容を破棄して元の設定に戻します</div>
          </div>
        </div>
        
        <div class="flex items-start gap:3">
          <div class="w:6 h:6 text:care-gray-600 mt:0.5">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/>
            </svg>
          </div>
          <div>
            <div class="font:medium text:care-text-primary">キャンセル</div>
            <div class="text:xs text:care-text-secondary">このダイアログを閉じて設定画面に戻ります</div>
          </div>
        </div>
      </div>
    </div>

    <!-- アクションボタン -->
    <div class="flex justify-end gap:3">
      <Button
        variant="ghost"
        onclick={handleCancel}
        data-testid="cancel-changes-button"
      >
        キャンセル
      </Button>
      
      <Button
        variant="outline"
        onclick={handleDiscard}
        data-testid="discard-changes-button"
      >
        変更を破棄
      </Button>
      
      <Button
        variant="primary"
        onclick={handleSave}
        data-testid="save-changes-button"
      >
        変更を保存
      </Button>
    </div>
  </div>
</Modal>

<style>
  .unsaved-changes-dialog {
    padding: 0;
  }
</style>