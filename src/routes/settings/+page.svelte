<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import SettingsLayout from '$lib/components/settings/SettingsLayout.svelte';
  import { settingsStore } from '$lib/stores/settings.svelte';

  // URLパラメータから初期カテゴリを取得
  let initialCategory = $state('general');

  onMount(() => {
    // URLクエリパラメータからカテゴリを取得
    const categoryParam = $page.url.searchParams.get('category');
    if (categoryParam) {
      const validCategories = settingsStore.settingCategories.map(cat => cat.key);
      if (validCategories.includes(categoryParam)) {
        initialCategory = categoryParam;
      }
    }

    // 設定を初期化（必要に応じて）
    if (!settingsStore.lastSaved) {
      // 初回アクセス時の処理
      console.log('設定ページに初回アクセスしました');
    }
  });

  // カテゴリ変更時にURLを更新
  function updateURL(category: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    goto(url.toString(), { replaceState: true, noScroll: true });
  }

  // ページタイトルを設定
  $effect(() => {
    document.title = '設定 - 介護施設ダッシュボード';
  });
</script>

<svelte:head>
  <title>設定 - 介護施設ダッシュボード</title>
  <meta name="description" content="システムの設定を管理します。テーマ、通知、アクセシビリティなどの設定を変更できます。" />
</svelte:head>

<main class="settings-page">
  <SettingsLayout {initialCategory} />
</main>

<style>
  .settings-page {
    min-height: 100vh;
    background-color: #f8fafc;
  }

  :global(body) {
    background-color: #f8fafc;
  }

  /* アクセシビリティ対応のCSS */
  :global(.large-text) {
    font-size: 1.125em;
  }

  :global(.large-text h1) {
    font-size: 2.25rem;
  }

  :global(.large-text h2) {
    font-size: 1.875rem;
  }

  :global(.large-text h3) {
    font-size: 1.5rem;
  }

  :global(.large-text p, .large-text span, .large-text div) {
    font-size: 1.125rem;
    line-height: 1.6;
  }

  :global(.large-text button) {
    font-size: 1.125rem;
    padding: 12px 20px;
  }

  :global(.high-contrast) {
    --color-primary: #000000;
    --color-secondary: #333333;
    --color-text: #000000;
    --color-background: #ffffff;
    --color-surface: #f5f5f5;
  }

  :global(.high-contrast) button {
    border: 2px solid #000000;
  }

  :global(.high-contrast) input,
  :global(.high-contrast) select,
  :global(.high-contrast) textarea {
    border: 2px solid #000000;
    background-color: #ffffff;
    color: #000000;
  }

  :global(.reduced-motion) * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  :global(.reduced-motion) *:hover,
  :global(.reduced-motion) *:focus {
    transition: none !important;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .settings-page {
      padding: 0;
    }
  }

  /* プリント対応 */
  @media print {
    .settings-page {
      background-color: white;
    }

    :global(.settings-navigation),
    :global(.header-actions),
    :global(.quick-actions) {
      display: none;
    }
  }

  /* ダークモード対応（将来的な拡張用） */
  @media (prefers-color-scheme: dark) {
    .settings-page {
      background-color: #1e293b;
    }

    :global(.dark-mode) {
      --color-primary: #3b82f6;
      --color-secondary: #64748b;
      --color-text: #f1f5f9;
      --color-background: #0f172a;
      --color-surface: #1e293b;
    }
  }

  /* フォーカス表示の改善 */
  :global(*:focus) {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  :global(button:focus),
  :global(input:focus),
  :global(select:focus),
  :global(textarea:focus) {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  /* スクリーンリーダー用の隠しテキスト */
  :global(.sr-only) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>