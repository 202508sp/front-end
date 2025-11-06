<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../../stores/auth.svelte.js';
  import { checkRouteAccess } from '../../utils/auth.js';
  import type { RouteGuardConfig } from '../../types/auth.js';
  import type { Snippet } from 'svelte';

  interface Props {
    config: RouteGuardConfig;
    children: Snippet;
    fallback?: Snippet;
    loading?: Snippet;
  }

  let { config, children, fallback, loading }: Props = $props();

  // アクセス権限チェック結果
  const accessCheck = $derived(() => {
    if (authStore.isLoading) return null;
    return checkRouteAccess(config);
  });

  // リダイレクト処理
  onMount(() => {
    $effect(() => {
      const check = accessCheck();
      
      if (check && !check.hasPermission) {
        // リダイレクト先を決定
        const redirectTo = config.redirectTo || '/login';
        
        // 現在のURLを保存（ログイン後に戻るため）
        if (redirectTo === '/login') {
          const currentUrl = window.location.pathname + window.location.search;
          const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentUrl)}`;
          window.location.href = loginUrl;
        } else {
          window.location.href = redirectTo;
        }
      }
    });
  });
</script>

{#if authStore.isLoading}
  {#if loading}
    {@render loading()}
  {:else}
    <div class="flex align-items:center justify-content:center min-h:200px">
      <div class="text-align:center">
        <div class="w:32px h:32px border:2px|solid|blue-600 border-top:2px|solid|transparent border-radius:50% animate:spin mx:auto mb:8px"></div>
        <p class="color:gray-600">認証状態を確認中...</p>
      </div>
    </div>
  {/if}
{:else if accessCheck()?.hasPermission}
  {@render children()}
{:else if fallback}
  {@render fallback()}
{:else}
  <div class="flex align-items:center justify-content:center min-h:200px">
    <div class="text-align:center max-w:400px p:24px">
      <div class="w:64px h:64px bg:red-100 border-radius:50% flex align-items:center justify-content:center mx:auto mb:16px">
        <svg class="w:32px h:32px color:red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
      <h2 class="font-size:20px font-weight:600 color:gray-900 mb:8px">
        アクセスが拒否されました
      </h2>
      <p class="color:gray-600 mb:16px">
        {accessCheck()?.reason || 'このページにアクセスする権限がありません'}
      </p>
      <button
        onclick={() => window.history.back()}
        class="px:16px py:8px bg:blue-600 color:white border-radius:6px hover:bg:blue-700 transition:background-color|0.2s"
      >
        戻る
      </button>
    </div>
  </div>
{/if}