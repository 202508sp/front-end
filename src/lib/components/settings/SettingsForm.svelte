<script lang="ts">
  import { settingsStore, type SettingItem } from '$lib/stores/settings.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Icon from '@iconify/svelte';

  interface Props {
    selectedCategory?: string;
    onSave?: () => void;
    onReset?: () => void;
  }

  let { selectedCategory = 'general', onSave, onReset }: Props = $props();

  // 選択されたカテゴリの設定項目を取得
  const categoryItems = $derived(settingsStore.getItemsByCategory(selectedCategory));

  // カテゴリ情報を取得
  const categoryInfo = $derived(settingsStore.settingCategories.find(cat => cat.key === selectedCategory));

  // 設定値の変更ハンドラ
  function handleValueChange(item: SettingItem, value: any) {
    settingsStore.setValue(item.key, value);
  }

  // 保存ハンドラ
  async function handleSave() {
    try {
      await settingsStore.saveSettings();
      onSave?.();
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
    }
  }

  // リセットハンドラ
  function handleReset() {
    settingsStore.resetCategory(selectedCategory);
    onReset?.();
  }

  // カラーピッカーの値変更ハンドラ
  function handleColorChange(item: SettingItem, event: Event) {
    const target = event.target as HTMLInputElement;
    handleValueChange(item, target.value);
  }

  // 数値入力の値変更ハンドラ
  function handleNumberChange(item: SettingItem, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    if (!isNaN(value)) {
      handleValueChange(item, value);
    }
  }
</script>

<div class="settings-form">
  <!-- カテゴリヘッダー -->
  {#if categoryInfo}
    <div class="category-header mb:24px">
      <div class="flex align-items:center gap:12px mb:8px">
        <Icon icon={categoryInfo.icon} class="font-size:24px color:primary" />
        <h2 class="font-size:20px font-weight:600 color:text">{categoryInfo.label}</h2>
      </div>
      {#if categoryInfo.description}
        <p class="color:secondary font-size:14px">{categoryInfo.description}</p>
      {/if}
    </div>
  {/if}

  <!-- 設定項目 -->
  <div class="settings-items">
    {#each categoryItems as item: SettingItem (item.key)}
      <Card class="mb:16px">
        <div class="setting-item p:20px">
          <div class="setting-header mb:12px">
            <h3 class="font-size:16px font-weight:500 color:text mb:4px">
              {item.label}
            </h3>
            {#if item.description}
              <p class="font-size:14px color:secondary line-height:1.4">
                {item.description}
              </p>
            {/if}
            {#if item.requiresRestart}
              <div class="restart-notice mt:8px">
                <Icon icon="material-symbols:info" class="font-size:16px color:warning" />
                <span class="font-size:12px color:warning ml:4px">
                  この設定を変更するには再起動が必要です
                </span>
              </div>
            {/if}
          </div>

          <div class="setting-control">
            {#if item.type === 'toggle'}
              <Toggle
                checked={settingsStore.getValue(item.key) ?? item.defaultValue}
                onchange={(checked) => handleValueChange(item, checked)}
                label=""
              />
            
            {:else if item.type === 'select' && item.options}
              <FormField label="" error="">
                <select
                  class="select w:100% p:8px border:1px|solid|#e2e8f0 border-radius:6px"
                  value={settingsStore.getValue(item.key) ?? item.defaultValue}
                  onchange={(e) => handleValueChange(item, (e.currentTarget as HTMLSelectElement).value)}
                >
                  {#each item.options as option}
                    <option value={option.value}>{option.label}</option>
                  {/each}
                </select>
              </FormField>
            
            {:else if item.type === 'text'}
              <FormField label="" error="">
                <Input
                  type="text"
                  value={settingsStore.getValue(item.key) ?? item.defaultValue}
                  oninput={(e) => handleValueChange(item, (e.currentTarget as HTMLInputElement).value)}
                  placeholder={item.label}
                />
              </FormField>
            
            {:else if item.type === 'number'}
              <FormField label="" error="">
                <Input
                  type="number"
                  value={settingsStore.getValue(item.key) ?? item.defaultValue}
                  oninput={(e) => handleNumberChange(item, e)}
                  placeholder={item.label}
                />
              </FormField>
            
            {:else if item.type === 'color'}
              <div class="color-picker flex align-items:center gap:12px">
                <input
                  type="color"
                  class="color-input w:48px h:32px border:1px|solid|#e2e8f0 border-radius:6px cursor:pointer"
                  value={settingsStore.getValue(item.key) ?? item.defaultValue}
                  onchange={(e) => handleColorChange(item, e)}
                />
                <Input
                  type="text"
                  value={settingsStore.getValue(item.key) ?? item.defaultValue}
                  oninput={(e) => handleValueChange(item, (e.currentTarget as HTMLInputElement).value)}
                  placeholder="#000000"
                  class="flex:1"
                />
              </div>
            {/if}
          </div>
        </div>
      </Card>
    {/each}
  </div>

  <!-- アクションボタン -->
  <div class="actions flex gap:12px justify-content:flex-end mt:24px">
    <Button
      variant="secondary"
      onclick={handleReset}
      disabled={settingsStore.isSaving}
    >
      <Icon icon="material-symbols:refresh" class="mr:8px" />
      リセット
    </Button>
    
    <Button
      variant="primary"
      onclick={handleSave}
      disabled={!settingsStore.isDirty || settingsStore.isSaving}
      loading={settingsStore.isSaving}
    >
      <Icon icon="material-symbols:save" class="mr:8px" />
      保存
    </Button>
  </div>

  <!-- エラー表示 -->
  {#if settingsStore.error}
    <div class="error-message mt:16px p:12px bg:error-light border-radius:6px">
      <div class="flex align-items:center gap:8px">
        <Icon icon="material-symbols:error" class="color:error" />
        <span class="color:error font-size:14px">{settingsStore.error}</span>
      </div>
    </div>
  {/if}

  <!-- 保存成功メッセージ -->
  {#if settingsStore.lastSaved && !settingsStore.isDirty}
    <div class="success-message mt:16px p:12px bg:success-light border-radius:6px">
      <div class="flex align-items:center gap:8px">
        <Icon icon="material-symbols:check-circle" class="color:success" />
        <span class="color:success font-size:14px">
          設定を保存しました ({settingsStore.lastSaved.toLocaleTimeString()})
        </span>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-form {
    max-width: 800px;
  }

  .category-header {
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 16px;
  }

  .setting-item {
    border-bottom: 1px solid #f1f5f9;
  }

  .setting-item:last-child {
    border-bottom: none;
  }

  .setting-header {
    flex: 1;
  }

  .setting-control {
    min-width: 200px;
  }

  .restart-notice {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    background-color: #fef3c7;
    border-radius: 4px;
    border: 1px solid #f59e0b;
  }

  .color-picker {
    max-width: 300px;
  }

  .color-input {
    appearance: none;
    -webkit-appearance: none;
    border: none;
    outline: none;
  }

  .color-input::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-input::-webkit-color-swatch {
    border: none;
    border-radius: 4px;
  }

  .select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
    background-position: right 8px center;
    background-repeat: no-repeat;
    background-size: 16px 12px;
    padding-right: 32px;
  }

  .error-message {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
  }

  .success-message {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  @media (max-width: 768px) {
    .setting-item {
      flex-direction: column;
      gap: 12px;
    }

    .setting-control {
      min-width: unset;
    }

    .actions {
      flex-direction: column;
    }

    .color-picker {
      max-width: unset;
    }
  }
</style>