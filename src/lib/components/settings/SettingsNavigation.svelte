<script lang="ts">
  import { settingsStore } from '$lib/stores/settings.svelte';
  import Icon from '@iconify/svelte';

  interface Props {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
  }

  let { selectedCategory, onCategoryChange }: Props = $props();

  const categories = settingsStore.settingCategories;

  function handleCategoryClick(categoryKey: string) {
    onCategoryChange(categoryKey);
  }
</script>

<nav class="settings-navigation">
  <div class="navigation-header mb:20px">
    <h2 class="font-size:18px font-weight:600 color:text">設定</h2>
  </div>

  <ul class="category-list">
    {#each categories as category (category.key)}
      <li class="category-item">
        <button
          class="category-button w:100% p:12px border-radius:8px text-align:left transition:all|0.2s"
          class:active={selectedCategory === category.key}
          onclick={() => handleCategoryClick(category.key)}
          type="button"
        >
          <div class="flex align-items:center gap:12px">
            <Icon 
              icon={category.icon} 
              class={`font-size:20px ${selectedCategory === category.key ? 'color:primary' : 'color:secondary'}`}
            />
            <div class="category-info flex:1">
              <div 
                class={`category-name font-size:14px font-weight:500 ${selectedCategory === category.key ? 'color:primary' : 'color:text'}`}
              >
                {category.label}
              </div>
              {#if category.description}
                <div class="category-description font-size:12px color:secondary mt:2px">
                  {category.description}
                </div>
              {/if}
            </div>
            {#if settingsStore.isDirty}
              <div class="dirty-indicator w:8px h:8px bg:warning border-radius:50%"></div>
            {/if}
          </div>
        </button>
      </li>
    {/each}
  </ul>

  <!-- 設定の状態表示 -->
  <div class="settings-status mt:24px p:16px bg:surface border-radius:8px">
    <div class="status-item flex align-items:center justify-content:space-between mb:8px">
      <span class="font-size:12px color:secondary">変更状態</span>
      <span class="font-size:12px font-weight:500" class:color:warning={settingsStore.isDirty} class:color:success={!settingsStore.isDirty}>
        {settingsStore.isDirty ? '未保存' : '保存済み'}
      </span>
    </div>
    
    {#if settingsStore.lastSaved}
      <div class="status-item flex align-items:center justify-content:space-between">
        <span class="font-size:12px color:secondary">最終保存</span>
        <span class="font-size:12px color:text">
          {settingsStore.lastSaved.toLocaleTimeString()}
        </span>
      </div>
    {/if}
  </div>

  <!-- クイックアクション -->
  <div class="quick-actions mt:16px">
    <button
      class="quick-action-button w:100% p:10px border:1px|solid|#e2e8f0 border-radius:6px bg:white hover:bg:gray-50 transition:all|0.2s mb:8px"
      onclick={() => {
        const data = settingsStore.exportSettings();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'settings-export.json';
        a.click();
        URL.revokeObjectURL(url);
      }}
      type="button"
    >
      <div class="flex align-items:center gap:8px">
        <Icon icon="material-symbols:download" class="font-size:16px color:secondary" />
        <span class="font-size:13px color:text">設定をエクスポート</span>
      </div>
    </button>

    <input
      type="file"
      accept=".json"
      class="hidden"
      id="import-settings"
      onchange={(e) => {
        const file = e.currentTarget.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) {
              const success = settingsStore.importSettings(content);
              if (success) {
                alert('設定をインポートしました');
              } else {
                alert('設定のインポートに失敗しました');
              }
            }
          };
          reader.readAsText(file);
        }
      }}
    />
    
    <button
      class="quick-action-button w:100% p:10px border:1px|solid|#e2e8f0 border-radius:6px bg:white hover:bg:gray-50 transition:all|0.2s"
      onclick={() => document.getElementById('import-settings')?.click()}
      type="button"
    >
      <div class="flex align-items:center gap:8px">
        <Icon icon="material-symbols:upload" class="font-size:16px color:secondary" />
        <span class="font-size:13px color:text">設定をインポート</span>
      </div>
    </button>
  </div>
</nav>

<style>
  .settings-navigation {
    width: 280px;
    height: fit-content;
    position: sticky;
    top: 20px;
  }

  .category-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .category-item {
    margin-bottom: 4px;
  }

  .category-button {
    border: none;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .category-button:hover {
    background-color: #f8fafc;
  }

  .category-button.active {
    background-color: #eff6ff;
    border: 1px solid #dbeafe;
  }

  .category-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .dirty-indicator {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .quick-action-button:hover {
    border-color: #cbd5e1;
  }

  .quick-action-button:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .hidden {
    display: none;
  }

  @media (max-width: 768px) {
    .settings-navigation {
      width: 100%;
      position: static;
      margin-bottom: 24px;
    }

    .category-list {
      display: flex;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 8px;
    }

    .category-item {
      flex-shrink: 0;
      margin-bottom: 0;
    }

    .category-button {
      white-space: nowrap;
      min-width: 120px;
    }

    .category-description {
      display: none;
    }

    .settings-status,
    .quick-actions {
      display: none;
    }
  }
</style>