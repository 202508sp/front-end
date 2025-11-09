<script lang="ts">
  import type { SettingGroup } from '$lib/types/settings';

  interface Props {
    groups: SettingGroup[];
    activeGroup?: string;
    onGroupSelect: (groupKey: string) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    groups,
    activeGroup,
    onGroupSelect,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // ソートされたグループ
  const sortedGroups = $derived(
    groups.sort((a, b) => (a.order || 0) - (b.order || 0))
  );

  function handleGroupClick(groupKey: string) {
    onGroupSelect(groupKey);
  }

  function handleKeydown(event: KeyboardEvent, groupKey: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleGroupClick(groupKey);
    }
  }
</script>

<nav class="settings-navigation {className}" data-testid={testId}>
  <div class="settings-nav-header mb:4">
    <h2 class="text:lg font:semibold text:care-text-primary">設定項目</h2>
  </div>

  <ul class="settings-nav-list space-y:1" role="tablist">
    {#each sortedGroups as group (group.key)}
      {@const isActive = activeGroup === group.key}
      
      <li role="none">
        <button
          type="button"
          class="settings-nav-item w:full text-left px:3 py:2.5 rounded:md transition-colors duration:200 focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:ring-offset:1 {isActive 
            ? 'bg:care-primary-100 text:care-primary-900 border-l:3|solid|care-primary-600' 
            : 'text:care-text-secondary hover:bg:care-gray-50 hover:text:care-text-primary'
          }"
          role="tab"
          aria-selected={isActive}
          aria-controls="settings-panel-{group.key}"
          data-testid="nav-item-{group.key}"
          onclick={() => handleGroupClick(group.key)}
          onkeydown={(e) => handleKeydown(e, group.key)}
        >
          <div class="flex items-center gap:3">
            {#if group.icon}
              <div class="w:5 h:5 flex-shrink:0">
                <svg fill="currentColor" viewBox="0 0 24 24" class="w:full h:full">
                  <!-- アイコンは実際の実装では適切なアイコンライブラリを使用 -->
                  {#if group.icon === 'settings'}
                    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                  {:else if group.icon === 'dashboard'}
                    <path d="M3,13h8V3H3V13z M3,21h8v-6H3V21z M13,21h8V11h-8V21z M13,3v6h8V3H13z"/>
                  {:else if group.icon === 'people'}
                    <path d="M16,4c0-1.11,0.89-2,2-2s2,0.89,2,2s-0.89,2-2,2S16,5.11,16,4z M20,22v-6h2.5l-2.54-7.63A3.01,3.01,0,0,0,17.24,7H16.76 A3.01,3.01,0,0,0,14.04,8.37L11.5,16H14v6H20z M12.5,11.5c0.83,0,1.5-0.67,1.5-1.5s-0.67-1.5-1.5-1.5S11,9.17,11,10 S11.67,11.5,12.5,11.5z M5.5,6C6.33,6,7,5.33,7,4.5S6.33,3,5.5,3S4,3.67,4,4.5S4.67,6,5.5,6z M7.5,22v-7H9V9.5 C9,8.12,7.88,7,6.5,7S4,8.12,4,9.5V15h1.5v7H7.5z"/>
                  {:else if group.icon === 'notifications'}
                    <path d="M12,22c1.1,0,2-0.9,2-2h-4C10,21.1,10.9,22,12,22z M18,16v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-0.83-0.67-1.5-1.5-1.5 s-1.5,0.67-1.5,1.5v0.68C7.63,5.36,6,7.92,6,11v5l-2,2v1h16v-1L18,16z"/>
                  {:else if group.icon === 'security'}
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10,17L6,13L7.41,11.59L10,14.17 L16.59,7.58L18,9L10,17Z"/>
                  {:else}
                    <circle cx="12" cy="12" r="10"/>
                  {/if}
                </svg>
              </div>
            {/if}
            
            <div class="flex-1 min-w:0">
              <div class="font:medium text:sm truncate">
                {group.label}
              </div>
              {#if group.description}
                <div class="text:xs text:care-text-secondary truncate mt:0.5">
                  {group.description}
                </div>
              {/if}
            </div>
          </div>
        </button>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .settings-navigation {
    min-width: 240px;
    max-width: 280px;
  }

  .settings-nav-header {
    padding: 0 0.75rem;
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
  }

  .settings-nav-item {
    position: relative;
  }

  .settings-nav-item:hover {
    transform: translateX(2px);
  }

  .settings-nav-item[aria-selected="true"] {
    font-weight: 600;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .settings-navigation {
      min-width: 100%;
      max-width: 100%;
    }
  }
</style>