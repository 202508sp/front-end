<script lang="ts">
  import { authStore } from '../../stores/auth.svelte.js';
  import Button from '../ui/Button.svelte';
  import Modal from '../ui/Modal.svelte';

  // ユーザーメニューの表示状態
  let showUserMenu = $state(false);
  let showLogoutConfirm = $state(false);

  /**
   * ログアウト処理
   */
  async function handleLogout() {
    try {
      await authStore.signOut();
      showLogoutConfirm = false;
      showUserMenu = false;
      // ログインページにリダイレクト
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  /**
   * メニュー外クリックで閉じる
   */
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.user-menu')) {
      showUserMenu = false;
    }
  }

  // セッション情報
  const sessionInfo = $derived(authStore.getSessionInfo());
</script>

<svelte:document onclick={handleClickOutside} />

<div class="user-menu relative">
  <!-- ユーザーアバター/ボタン -->
  <button
    onclick={() => showUserMenu = !showUserMenu}
    class="user-avatar flex align-items:center gap:8px p:8px border-radius:6px hover:bg:gray-100 transition:background-color|0.2s"
  >
    {#if authStore.user?.photoURL}
      <img
        src={authStore.user.photoURL}
        alt="ユーザーアバター"
        class="w:32px h:32px border-radius:50% object-fit:cover"
      />
    {:else}
      <div class="w:32px h:32px border-radius:50% bg:blue-500 flex align-items:center justify-content:center color:white font-weight:600">
        {authStore.user?.displayName?.[0] || authStore.user?.email?.[0] || 'U'}
      </div>
    {/if}
    
    <div class="text-align:left">
      <div class="font-size:14px font-weight:500 color:gray-900">
        {authStore.user?.displayName || 'ユーザー'}
      </div>
      <div class="font-size:12px color:gray-500">
        {#if authStore.isStaff}
          {authStore.user?.staffInfo?.role} - {authStore.user?.staffInfo?.department}
        {:else if authStore.isFamily}
          家族アカウント
        {:else}
          ゲスト
        {/if}
      </div>
    </div>
    
    <svg class="w:16px h:16px color:gray-400" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>

  <!-- ドロップダウンメニュー -->
  {#if showUserMenu}
    <div class="user-dropdown absolute top:100% right:0 mt:4px w:280px bg:white border:1px|solid|gray-200 border-radius:8px box-shadow:0|4px|6px|-1px|rgba(0,0,0,0.1) z-index:50">
      <!-- ユーザー情報 -->
      <div class="p:16px border-bottom:1px|solid|gray-100">
        <div class="font-size:16px font-weight:600 color:gray-900 mb:4px">
          {authStore.user?.displayName || 'ユーザー'}
        </div>
        <div class="font-size:14px color:gray-600 mb:2px">
          {authStore.user?.email}
        </div>
        {#if authStore.isStaff}
          <div class="font-size:12px color:gray-500">
            職員ID: {authStore.user?.staffInfo?.id}
          </div>
        {/if}
      </div>

      <!-- セッション情報 -->
      {#if sessionInfo}
        <div class="p:12px border-bottom:1px|solid|gray-100">
          <div class="font-size:12px color:gray-500 mb:4px">セッション情報</div>
          <div class="font-size:11px color:gray-400 space-y:1px">
            <div>ログイン: {sessionInfo.loginTime.toLocaleString()}</div>
            <div>最終活動: {sessionInfo.lastActivity.toLocaleString()}</div>
            <div>有効期限: {sessionInfo.expiresAt.toLocaleString()}</div>
          </div>
        </div>
      {/if}

      <!-- 権限情報 -->
      {#if authStore.isStaff && authStore.userPermissions.length > 0}
        <div class="p:12px border-bottom:1px|solid|gray-100">
          <div class="font-size:12px color:gray-500 mb:4px">権限</div>
          <div class="flex flex-wrap gap:4px">
            {#each authStore.userPermissions.slice(0, 4) as permission}
              <span class="px:6px py:2px bg:blue-100 color:blue-700 font-size:10px border-radius:4px">
                {permission}
              </span>
            {/each}
            {#if authStore.userPermissions.length > 4}
              <span class="px:6px py:2px bg:gray-100 color:gray-600 font-size:10px border-radius:4px">
                +{authStore.userPermissions.length - 4}
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <!-- メニューアクション -->
      <div class="p:8px">
        <button
          onclick={() => {
            showUserMenu = false;
            // プロフィール設定ページへ（実装予定）
            console.log('プロフィール設定');
          }}
          class="w:full text-align:left p:8px hover:bg:gray-50 border-radius:4px font-size:14px color:gray-700"
        >
          プロフィール設定
        </button>
        
        {#if authStore.isAdmin()}
          <button
            onclick={() => {
              showUserMenu = false;
              // 管理者設定ページへ
              window.location.href = '/settings';
            }}
            class="w:full text-align:left p:8px hover:bg:gray-50 border-radius:4px font-size:14px color:gray-700"
          >
            システム設定
          </button>
        {/if}

        <hr class="my:8px border:gray-100">
        
        <button
          onclick={() => {
            showUserMenu = false;
            showLogoutConfirm = true;
          }}
          class="w:full text-align:left p:8px hover:bg:red-50 border-radius:4px font-size:14px color:red-600"
        >
          ログアウト
        </button>
      </div>
    </div>
  {/if}
</div>

<!-- ログアウト確認モーダル -->
<Modal bind:isOpen={showLogoutConfirm} title="ログアウト確認" onClose={() => showLogoutConfirm = false}>
  <div class="p:16px">
    <p class="mb:16px color:gray-700">
      ログアウトしますか？<br>
      未保存の変更がある場合は失われる可能性があります。
    </p>
    
    <div class="flex gap:8px justify-content:flex-end">
      <Button
        variant="secondary"
        onclick={() => showLogoutConfirm = false}
      >
        キャンセル
      </Button>
      <Button
        variant="danger"
        onclick={handleLogout}
      >
        ログアウト
      </Button>
    </div>
  </div>
</Modal>

<style>
  .user-dropdown {
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>