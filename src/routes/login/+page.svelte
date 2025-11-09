<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '../../lib/stores/auth.svelte.js';
  import LoginForm from '../../lib/components/auth/LoginForm.svelte';

  // 既にログイン済みの場合はリダイレクト
  onMount(() => {
    if (authStore.isAuthenticated) {
      window.location.href = '/';
    }
  });

  // ログイン成功時の処理
  function handleLoginSuccess() {
    // URLパラメータから戻り先を取得
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect') || '/';
    window.location.href = redirectTo;
  }
</script>

<svelte:head>
  <title>ログイン - 介護施設ダッシュボード</title>
</svelte:head>

<div class="login-page min-h:100vh bg:gray-50 flex align-items:center justify-content:center p:16px">
  <div class="w:full max-w:400px">
    <!-- ロゴ/ブランディング -->
    <div class="text-align:center mb:32px">
      <div class="w:64px h:64px bg:blue-600 border-radius:12px mx:auto mb:16px flex align-items:center justify-content:center">
        <svg class="w:32px h:32px color:white" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
        </svg>
      </div>
      <h1 class="font-size:28px font-weight:700 color:gray-900 mb:8px">
        介護施設ダッシュボード
      </h1>
      <p class="color:gray-600 font-size:16px">
        職員・家族向け統合管理システム
      </p>
    </div>

    <!-- ログインフォーム -->
    <LoginForm onSuccess={handleLoginSuccess} />

    <!-- フッター -->
    <div class="text-align:center mt:32px">
      <p class="color:gray-500 font-size:12px">
        © 2024 介護施設ダッシュボード. All rights reserved.
      </p>
    </div>
  </div>
</div>

<style>
  .login-page {
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.1) 0%, transparent 50%);
  }
</style>