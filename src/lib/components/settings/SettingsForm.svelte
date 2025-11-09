<script lang="ts">
  import type { SettingGroup, SettingField, SettingsFormProps } from '$lib/types/settings';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props extends SettingsFormProps {
    class?: string;
    'data-testid'?: string;
  }

  let {
    groups,
    values,
    errors = {},
    disabled = false,
    onFieldChange,
    onValidate,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // フィールド値の更新処理
  function handleFieldChange(field: SettingField, newValue: any) {
    // 型変換
    let convertedValue = newValue;
    
    switch (field.type) {
      case 'number':
        convertedValue = newValue === '' ? null : Number(newValue);
        break;
      case 'boolean':
        convertedValue = Boolean(newValue);
        break;
      default:
        convertedValue = newValue;
    }

    // バリデーション（オプション）
    if (onValidate) {
      const error = onValidate(field.key, convertedValue);
      if (error) {
        return; // エラーがある場合は更新しない
      }
    }

    onFieldChange(field.key, convertedValue);
  }

  // フィールド値の取得
  function getFieldValue(field: SettingField) {
    return values[field.key] ?? field.defaultValue;
  }

  // フィールドエラーの取得
  function getFieldError(field: SettingField) {
    return errors[field.key];
  }

  // フィールドの無効状態の取得
  function isFieldDisabled(field: SettingField) {
    return disabled || field.disabled;
  }
</script>

<div class="settings-form {className}" data-testid={testId}>
  {#each groups as group (group.key)}
    <div class="settings-group mb:8" data-testid="settings-group-{group.key}">
      <!-- グループヘッダー -->
      <div class="settings-group-header mb:6">
        <div class="flex items-center gap:3 mb:2">
          {#if group.icon}
            <div class="w:6 h:6 text:care-primary-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <!-- アイコンは実際の実装では適切なアイコンライブラリを使用 -->
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </div>
          {/if}
          <h3 class="text:lg font:semibold text:care-text-primary">
            {group.label}
          </h3>
        </div>
        {#if group.description}
          <p class="text:sm text:care-text-secondary">
            {group.description}
          </p>
        {/if}
      </div>

      <!-- フィールド一覧 -->
      <div class="settings-fields space-y:4">
        {#each group.fields.sort((a, b) => (a.order || 0) - (b.order || 0)) as field (field.key)}
          {@const fieldValue = getFieldValue(field)}
          {@const fieldError = getFieldError(field)}
          {@const isDisabled = isFieldDisabled(field)}
          
          <FormField
            label={field.label}
            description={field.description}
            error={fieldError}
            required={field.required}
            disabled={isDisabled}
            data-testid="form-field-{field.key}"
          >
            {#if field.type === 'select'}
              <select
                class="w:full px:3 py:2 border:1|solid|care-gray-300 rounded:md focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:border:care-primary-500 disabled:opacity:50 disabled:cursor-not-allowed"
                value={fieldValue}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                onchange={(e) => {
                  const target = e.target as HTMLSelectElement;
                  handleFieldChange(field, target.value);
                }}
              >
                {#if field.options}
                  {#each field.options as option (option.value)}
                    <option 
                      value={option.value} 
                      disabled={option.disabled}
                    >
                      {option.label}
                    </option>
                  {/each}
                {/if}
              </select>
            {:else if field.type === 'boolean'}
              <Toggle
                checked={Boolean(fieldValue)}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                onchange={(checked) => handleFieldChange(field, checked)}
              />
            {:else if field.type === 'number'}
              <Input
                type="number"
                value={fieldValue ?? ''}
                min={field.validation?.min}
                max={field.validation?.max}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleFieldChange(field, target.value);
                }}
              />
            {:else if field.type === 'color'}
              <input
                type="color"
                class="w:full h:10 border:1|solid|care-gray-300 rounded:md focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:border:care-primary-500 disabled:opacity:50 disabled:cursor-not-allowed"
                value={fieldValue || '#000000'}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleFieldChange(field, target.value);
                }}
              />
            {:else if field.type === 'date'}
              <Input
                type="date"
                value={fieldValue ? new Date(fieldValue).toISOString().split('T')[0] : ''}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleFieldChange(field, target.value ? new Date(target.value) : null);
                }}
              />
            {:else if field.type === 'time'}
              <input
                type="time"
                class="w:full px:3 py:2 border:1|solid|care-gray-300 rounded:md focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:border:care-primary-500 disabled:opacity:50 disabled:cursor-not-allowed"
                value={fieldValue || ''}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleFieldChange(field, target.value);
                }}
              />
            {:else}
              <Input
                type="text"
                value={fieldValue || ''}
                placeholder={field.description}
                disabled={isDisabled}
                data-testid="setting-{field.key}"
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  handleFieldChange(field, target.value);
                }}
              />
            {/if}
          </FormField>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .settings-form {
    max-width: 800px;
  }

  .settings-group {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
  }

  .settings-group-header {
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
  }

  .settings-fields {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .settings-form {
      max-width: 100%;
    }
    
    .settings-group {
      padding: 1rem;
    }
  }
</style>