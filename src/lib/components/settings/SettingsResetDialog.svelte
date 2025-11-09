<script lang="ts">
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    isOpen: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    'data-testid'?: string;
  }

  let {
    isOpen,
    isLoading = false,
    onConfirm,
    onCancel,
    'data-testid': testId
  }: Props = $props();

  function handleConfirm() {
    onConfirm();
  }

  function handleCancel() {
    onCancel();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && !isLoading) {
      handleCancel();
    }
  }
</script>

<Modal
  {isOpen}
  title="設定をリセット"
  size="md"
  closable={!isLoading}
  onClose={handleCancel}
  data-testid={testId}
>
  <div class="settings-reset-dialog" role="dialog" tabindex="-1" onkeydown={handleKeydown}>
    <!-- 警告アイコンとメッセージ -->
    <div class="flex items-start gap:4 mb:6">
      <div class="w:12 h:12 bg:care-accent-warning-100 rounded:full flex items-center justify-center flex-shrink:0">
        <svg class="w:6 h:6 text:care-accent-warning-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      </div>
      
      <div class="flex-1">
        <h3 class="text:lg font:semibold text:care-text-primary mb:2">
          すべての設定をリセットしますか？
        </h3>
        <div class="text:sm text:care-text-secondary space-y:2">
          <p>
            この操作により、すべての設定がデフォルト値に戻ります。
          </p>
          <p class="font:medium text:care-accent-warning-700">
            この操作は取り消すことができません。
          </p>
        </div>
      </div>
    </div>

    <!-- リセットされる項目の説明 -->
    <div class="bg:care-gray-50 rounded:lg p:4 mb:6">
      <h4 class="font:medium text:care-text-primary mb:3">リセットされる設定項目：</h4>
      <ul class="text:sm text:care-text-secondary space-y:1">
        <li class="flex items-center gap:2">
          <div class="w:1.5 h:1.5 bg:care-gray-400 rounded:full"></div>
          一般設定（施設情報、言語、タイムゾーンなど）
        </li>
        <li class="flex items-center gap:2">
          <div class="w:1.5 h:1.5 bg:care-gray-400 rounded:full"></div>
          ダッシュボード設定（カスタマイズ許可、更新間隔など）
        </li>
        <li class="flex items-center gap:2">
          <div class="w:1.5 h:1.5 bg:care-gray-400 rounded:full"></div>
          利用者管理設定（写真アップロード、家族アクセスなど）
        </li>
        <li class="flex items-center gap:2">
          <div class="w:1.5 h:1.5 bg:care-gray-400 rounded:full"></div>
          通知設定（メール、プッシュ、アプリ内通知）
        </li>
        <li class="flex items-center gap:2">
          <div class="w:1.5 h:1.5 bg:care-gray-400 rounded:full"></div>
          セキュリティ設定（セッション、認証、パスワードなど）
        </li>
      </ul>
    </div>

    <!-- 確認チェックボックス -->
    <div class="mb:6">
      <label class="flex items-start gap:3 cursor-pointer">
        <input
          type="checkbox"
          class="mt:1 w:4 h:4 text:care-accent-error-600 border:care-gray-300 rounded focus:ring:care-accent-error-500"
          disabled={isLoading}
          data-testid="confirm-reset-checkbox"
        />
        <span class="text:sm text:care-text-secondary">
          上記の内容を理解し、すべての設定をリセットすることに同意します
        </span>
      </label>
    </div>

    <!-- アクションボタン -->
    <div class="flex justify-end gap:3">
      <Button
        variant="ghost"
        disabled={isLoading}
        onclick={handleCancel}
        data-testid="cancel-reset-button"
      >
        キャンセル
      </Button>
      
      <Button
        variant="danger"
        loading={isLoading}
        disabled={isLoading}
        onclick={handleConfirm}
        data-testid="confirm-reset-button"
      >
        {#if isLoading}
          リセット中...
        {:else}
          設定をリセット
        {/if}
      </Button>
    </div>
  </div>
</Modal>

<style>
  .settings-reset-dialog {
    padding: 0;
  }

  /* チェックボックスのカスタムスタイル */
  input[type="checkbox"]:checked {
    background-color: #dc2626;
    border-color: #dc2626;
  }

  input[type="checkbox"]:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }
</style>