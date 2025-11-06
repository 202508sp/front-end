<script lang="ts">
  import { authStore } from '../../stores/auth.svelte.js';
  import Button from '../ui/Button.svelte';
  import FormField from '../ui/FormField.svelte';
  import Input from '../ui/Input.svelte';
  import type { LoginCredentials } from '../../types/auth.js';

  interface Props {
    onSuccess?: () => void;
    redirectTo?: string;
  }

  let { onSuccess, redirectTo = '/' }: Props = $props();

  // フォーム状態
  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let showPassword = $state(false);

  // バリデーション
  const isEmailValid = $derived(email.includes('@') && email.length > 0);
  const isPasswordValid = $derived(password.length >= 6);
  const isFormValid = $derived(isEmailValid && isPasswordValid);

  /**
   * ログイン処理
   */
  async function handleSubmit() {
    if (!isFormValid || isSubmitting) return;

    isSubmitting = true;

    try {
      const credentials: LoginCredentials = { email, password };
      await authStore.signIn(credentials);
      
      // 成功時の処理
      if (onSuccess) {
        onSuccess();
      } else {
        // デフォルトのリダイレクト
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error('Login failed:', error);
      // エラーは authStore.error で表示される
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * パスワードリセット
   */
  async function handlePasswordReset() {
    if (!email) {
      alert('メールアドレスを入力してください');
      return;
    }

    try {
      await authStore.sendPasswordReset(email);
      alert('パスワードリセットメールを送信しました');
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  }

  /**
   * エラークリア
   */
  function clearError() {
    authStore.clearError();
  }
</script>

<div class="login-form max-w:400px mx:auto p:24px">
  <div class="text-align:center mb:32px">
    <h1 class="font-size:24px font-weight:600 color:gray-900 mb:8px">
      ログイン
    </h1>
    <p class="color:gray-600">
      介護施設ダッシュボードにアクセス
    </p>
  </div>

  <form onsubmit={handleSubmit} class="space-y:16px">
    <!-- メールアドレス -->
    <FormField label="メールアドレス" required>
      <Input
        type="email"
        bind:value={email}
        placeholder="example@facility.com"
        required
        autocomplete="email"
        oninput={clearError}
      />
    </FormField>

    <!-- パスワード -->
    <FormField label="パスワード" required>
      <div class="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          placeholder="パスワードを入力"
          required
          autocomplete="current-password"
          oninput={clearError}
        />
        <button
          type="button"
          onclick={() => showPassword = !showPassword}
          class="absolute right:8px top:50% transform:translateY(-50%) p:4px color:gray-500 hover:color:gray-700"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
    </FormField>

    <!-- エラー表示 -->
    {#if authStore.error}
      <div class="bg:red-50 border:1px|solid|red-200 border-radius:4px p:12px">
        <p class="color:red-700 font-size:14px">
          {authStore.error}
        </p>
      </div>
    {/if}

    <!-- ログインボタン -->
    <Button
      type="submit"
      variant="primary"
      size="lg"
      disabled={!isFormValid || isSubmitting}
      loading={isSubmitting}
      class="w:full"
    >
      {isSubmitting ? 'ログイン中...' : 'ログイン'}
    </Button>

    <!-- パスワードリセット -->
    <div class="text-align:center">
      <button
        type="button"
        onclick={handlePasswordReset}
        class="color:blue-600 hover:color:blue-800 font-size:14px text-decoration:underline"
      >
        パスワードを忘れた場合
      </button>
    </div>
  </form>

  <!-- デモ用アカウント情報 -->
  {#if import.meta.env.DEV}
    <div class="mt:32px p:16px bg:gray-50 border-radius:4px">
      <h3 class="font-size:14px font-weight:600 mb:8px">デモアカウント</h3>
      <div class="font-size:12px color:gray-600 space-y:4px">
        <p>職員: staff@example.com / password123</p>
        <p>管理者: admin@example.com / password123</p>
        <p>家族: family@example.com / password123</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .login-form {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: white;
  }
</style>