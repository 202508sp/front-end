<script lang="ts">
	import { onMount } from 'svelte';
	import { familyLogin } from '$lib/store';
	import { familyStore } from '$lib/stores/family.svelte.js';
	import FamilyDashboard from '$lib/components/family/FamilyDashboard.svelte';
	import FamilyReportViewer from '$lib/components/family/FamilyReportViewer.svelte';
	import SimplifiedInterface from '$lib/components/family/SimplifiedInterface.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '@iconify/svelte';
	import { signInWithPopup } from 'firebase/auth';
	import { auth, provider } from '$lib/firebase/index.js';

	let isLoggedIn = $state(false);
	let currentTab = $state<'dashboard' | 'reports' | 'chat'>('dashboard');
	
	// URL パラメータからタブを取得
	$effect(() => {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			const tab = urlParams.get('tab');
			if (tab === 'reports' || tab === 'chat') {
				currentTab = tab;
			}
		}
	});
    
    const login = () => {
        if (typeof window === 'undefined') return;
        signInWithPopup(auth, provider)
            .then(async (result) => {
                familyLogin.set(result.user);
                window.localStorage.setItem('familyLogin', JSON.stringify(result.user));
                
                // 家族ストアにログイン
                await familyStore.login('family_001');
                isLoggedIn = true;
            })
            .catch((error) => {
                console.error(error);
            });
    }

	const logout = () => {
		if (typeof window === 'undefined') return;
		familyStore.logout();
		familyLogin.set(null);
		window.localStorage.removeItem('familyLogin');
		isLoggedIn = false;
	};

	// タブ切り替え
	const switchTab = (tab: 'dashboard' | 'reports' | 'chat') => {
		currentTab = tab;
		// URL を更新
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('tab', tab);
			window.history.replaceState({}, '', url.toString());
		}
	};

	// レポート関連のハンドラー
	const handleViewReport = (reportId: string) => {
		console.log('View report:', reportId);
		// レポート詳細表示の実装
	};

	const handleViewAllReports = () => {
		switchTab('reports');
	};

	const handleOpenChat = () => {
		switchTab('chat');
	};

	const handleMarkNotificationRead = (notificationId: string) => {
		familyStore.markNotificationAsRead(notificationId);
	};

	const handleReportSearch = (filter: any) => {
		familyStore.searchReports(filter);
	};

	const handleLoadMoreReports = () => {
		familyStore.loadMoreReports();
	};

	// 簡易インターフェース用のハンドラー
	const handleCallStaff = () => {
		console.log('Call staff');
		// スタッフ呼び出し機能の実装
	};

	const handleViewPhotos = () => {
		console.log('View photos');
		// 写真閲覧機能の実装
	};

	const handlePlayMusic = () => {
		console.log('Play music');
		// 音楽再生機能の実装
	};

	onMount(async () => {
		if (typeof window === 'undefined') return;
		
		familyStore.initialize();
		
		const savedLogin = window.localStorage.getItem('familyLogin');
		if (savedLogin) {
			try {
				familyLogin.set(JSON.parse(savedLogin));
				await familyStore.login('family_001');
				isLoggedIn = true;
			} catch (error) {
				console.error('Failed to restore login:', error);
				window.localStorage.removeItem('familyLogin');
			}
		}
	});
</script>

{#if !isLoggedIn}
	<div class="login-screen">
		<div class="login-card">
            <div class="login-header">
				<Icon icon="material-symbols:family-home" width="48" height="48" />
				<h1>家族ポータル</h1>
				<p>ご家族の様子を確認できます</p>
			</div>
            <button
                onclick={login}
                class="login-button"
            >
                <Icon icon="logos:google-icon" width="24" height="24" />
                <span>Google でログインする</span>
            </button>
		</div>
	</div>
{:else}
	<!-- ヘッダー -->
	<header class="family-header">
		<div class="header-content">
			<div class="header-left">
				<Icon icon="material-symbols:family-home" width="32" height="32" />
				<h1>家族ポータル</h1>
			</div>
			
			<div class="header-right">
				<Button
					variant="ghost"
					size="sm"
					onclick={() => familyStore.toggleSimplifiedMode()}
				>
					<Icon 
						icon={familyStore.isSimplifiedMode ? 'material-symbols:view-compact' : 'material-symbols:accessibility'} 
						width="20" 
						height="20" 
					/>
				</Button>
				
				<Button
					variant="ghost"
					size="sm"
					onclick={logout}
				>
					<Icon icon="material-symbols:logout" width="20" height="20" />
					ログアウト
				</Button>
			</div>
		</div>
		
		{#if !familyStore.isSimplifiedMode}
			<nav class="tab-navigation">
				<button
					class="tab-button {currentTab === 'dashboard' ? 'active' : ''}"
					onclick={() => switchTab('dashboard')}
				>
					<Icon icon="material-symbols:dashboard" width="20" height="20" />
					ダッシュボード
				</button>
				<button
					class="tab-button {currentTab === 'reports' ? 'active' : ''}"
					onclick={() => switchTab('reports')}
				>
					<Icon icon="material-symbols:description" width="20" height="20" />
					レポート
					{#if familyStore.dashboardData?.recentReports.length}
						<span class="tab-badge">{familyStore.dashboardData.recentReports.length}</span>
					{/if}
				</button>
				<button
					class="tab-button {currentTab === 'chat' ? 'active' : ''}"
					onclick={() => switchTab('chat')}
				>
					<Icon icon="material-symbols:chat" width="20" height="20" />
					チャット
					{#if familyStore.unreadMessageCount > 0}
						<span class="tab-badge">{familyStore.unreadMessageCount}</span>
					{/if}
				</button>
			</nav>
		{/if}
	</header>

	<!-- メインコンテンツ -->
	<main class="family-main">
		{#if familyStore.isSimplifiedMode}
			<!-- 簡易インターフェース -->
			{#if familyStore.relatedUser}
				<SimplifiedInterface
					user={{
						id: familyStore.relatedUser.id,
						name: familyStore.relatedUser.name,
						profileImage: familyStore.relatedUser.profileImage,
						careLevel: familyStore.relatedUser.careLevel,
						admissionDate: familyStore.relatedUser.admissionDate
					}}
					todayActivities={['朝食', 'レクリエーション', '散歩', '夕食']}
					notifications={familyStore.notifications}
					onCallStaff={handleCallStaff}
					onViewPhotos={handleViewPhotos}
					onPlayMusic={handlePlayMusic}
				/>
			{/if}
		{:else}
			<!-- 通常インターフェース -->
			{#if currentTab === 'dashboard'}
				{#if familyStore.dashboardData}
					<FamilyDashboard
						data={familyStore.dashboardData}
						onViewReport={handleViewReport}
						onViewAllReports={handleViewAllReports}
						onOpenChat={handleOpenChat}
						onMarkNotificationRead={handleMarkNotificationRead}
					/>
				{:else if familyStore.isLoading}
					<div class="loading-state">
						<Icon icon="material-symbols:progress-activity" width="48" height="48" class="loading-icon" />
						<p>データを読み込み中...</p>
					</div>
				{/if}
			{:else if currentTab === 'reports'}
				<FamilyReportViewer
					reports={familyStore.reports}
					isLoading={familyStore.reportLoading}
					onSearch={handleReportSearch}
					onLoadMore={handleLoadMoreReports}
					hasMore={familyStore.hasMoreReports}
				/>
			{:else if currentTab === 'chat'}
				<div class="chat-placeholder">
					<Icon icon="material-symbols:chat" width="64" height="64" />
					<h2>チャット機能</h2>
					<p>チャット機能は開発中です</p>
				</div>
			{/if}
		{/if}
	</main>

	<!-- エラー表示 -->
	{#if familyStore.error}
		<div class="error-toast">
			<Icon icon="material-symbols:error" width="20" height="20" />
			<span>{familyStore.error}</span>
			<button onclick={() => familyStore.error = null}>
				<Icon icon="material-symbols:close" width="16" height="16" />
			</button>
		</div>
	{/if}
{/if}

<style>
  .login-screen {
    width: 100%;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f9fafb;
  }

  .login-card {
    width: 400px;
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 32px;
    text-align: center;
  }

  .login-header {
    margin-bottom: 32px;
  }

  .login-header h1 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  .login-header p {
    font-size: 14px;
    color: #6b7280;
  }

  .login-button {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    border: 1px solid #d1d5db;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 200ms;
    background-color: white;
  }

  .login-button:hover {
    border-color: #60a5fa;
    background-color: #eff6ff;
  }

  .login-button span {
    font-size: 16px;
    color: #374151;
  }

  .family-header {
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-left h1 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-navigation {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    gap: 8px;
    border-top: 1px solid #f3f4f6;
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 200ms;
    position: relative;
    border-bottom: 2px solid transparent;
  }

  .tab-button:hover {
    background-color: #f9fafb;
  }

  .tab-button.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
    background-color: #eff6ff;
  }

  .tab-badge {
    background-color: #ef4444;
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 50%;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .family-main {
    min-height: calc(100vh - 120px);
    background-color: #f9fafb;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 0;
    color: #6b7280;
  }

  .loading-state p {
    font-size: 16px;
  }

  .chat-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 0;
    color: #6b7280;
    text-align: center;
  }

  .chat-placeholder h2 {
    font-size: 20px;
    font-weight: 600;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  .error-toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background-color: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 100;
  }

  .error-toast button {
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 4px;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .header-content {
      padding: 12px 16px;
    }

    .header-left h1 {
      font-size: 18px;
    }

    .tab-navigation {
      padding: 0 16px;
      overflow-x: auto;
    }

    .tab-button {
      padding: 10px 12px;
      flex-shrink: 0;
    }

    .login-card {
      width: 90%;
      max-width: 400px;
      padding: 24px;
    }

    .error-toast {
      bottom: 16px;
      right: 16px;
      left: 16px;
    }
  }

  /* アクセシビリティ対応 */
  @media (prefers-reduced-motion: reduce) {
    .login-button,
    .tab-button {
      transition: none;
    }
  }

  @media (prefers-contrast: high) {
    .family-header {
      border-bottom: 2px solid #374151;
    }

    .tab-button.active {
      border-bottom: 3px solid #1e40af;
    }

    .login-card {
      border: 2px solid #374151;
    }
  }
</style>