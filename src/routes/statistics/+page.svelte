<script lang="ts">
  import { onMount } from 'svelte';
  import { statisticsStore } from '$lib/stores/statistics.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import { staffStore } from '$lib/stores/staff.svelte';
  import { StatChart, DateRangePicker, StatCard } from '$lib/components/statistics';
  import Button from '$lib/components/ui/Button.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import Icon from '@iconify/svelte';
  import type { DateRange, StatPeriod } from '$lib/types/statistics';

  // 表示設定の状態
  let showChartSelector = $state(false);
  let showCardSelector = $state(false);

  // チャートタイプオプション
  const chartTypeOptions = [
    { id: 'users', label: '利用者統計', icon: 'material-symbols:group' },
    { id: 'staff', label: '職員統計', icon: 'material-symbols:badge' },
    { id: 'reports', label: 'レポート統計', icon: 'material-symbols:description' }
  ];

  // 統計カードオプション
  const statCardOptions = [
    { id: 'total-users', label: '総利用者数' },
    { id: 'active-users', label: 'アクティブ利用者' },
    { id: 'total-staff', label: '総職員数' },
    { id: 'occupancy-rate', label: '入居率' },
    { id: 'satisfaction-score', label: '満足度スコア' },
    { id: 'reports-this-month', label: '今月のレポート' }
  ];

  // データ読み込み
  const loadData = async () => {
    try {
      // 各ストアからデータを読み込み
      await userStore.loadUsers();
      await staffStore.loadStaff();
      
      // 仮のレポートデータ（実際の実装では別のストアから取得）
      const mockReports = [
        {
          id: '1',
          userId: '1',
          authorId: '1',
          authorName: '佐藤花子',
          type: 'daily' as const,
          title: '日次レポート',
          content: 'テスト内容',
          sections: [],
          attachments: [],
          date: new Date(),
          status: 'published' as const,
          isPublishedToFamily: true,
          tags: ['日常'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // 統計データを生成
      await statisticsStore.loadStatistics(
        userStore.users,
        staffStore.staff,
        mockReports
      );
    } catch (error) {
      console.error('データの読み込みに失敗しました:', error);
    }
  };

  // 日付範囲変更ハンドラー
  const handleDateRangeChange = (range: DateRange) => {
    statisticsStore.updateDateRange(range);
    loadData(); // データを再読み込み
  };

  // 期間変更ハンドラー
  const handlePeriodChange = (period: StatPeriod) => {
    statisticsStore.updatePeriod(period);
    loadData(); // データを再読み込み
  };

  // チャートタイプ切り替え
  const toggleChartType = (chartType: string) => {
    statisticsStore.toggleChartType(chartType);
  };

  // 統計カード切り替え
  const toggleStatCard = (cardId: string) => {
    statisticsStore.toggleStatCard(cardId);
  };

  // データエクスポート
  const exportData = () => {
    statisticsStore.exportData('csv', ['users', 'staff', 'reports', 'facility']);
  };

  // 新しい統計項目を動的に追加（デモ用）
  const addCustomStatCard = () => {
    const customCard = {
      id: `custom-${Date.now()}`,
      title: 'カスタム統計',
      value: Math.floor(Math.random() * 100),
      unit: '件',
      change: Math.random() * 10 - 5,
      changeType: Math.random() > 0.5 ? 'increase' : 'decrease' as const,
      icon: 'material-symbols:analytics',
      color: '#6366f1',
      description: '動的に追加された統計項目'
    };
    
    // 実際の実装では、これはストアのメソッドとして実装される
    console.log('カスタム統計カードを追加:', customCard);
  };

  onMount(() => {
    loadData();
  });
</script>

<svelte:head>
  <title>統計・分析 - 介護施設ダッシュボード</title>
</svelte:head>

<div class="statistics-page">
  <!-- ページヘッダー -->
  <div class="page-header">
    <div class="header-content">
      <div class="title-section">
        <h1 class="page-title">
          <Icon icon="material-symbols:analytics" class="title-icon" />
          統計・分析
        </h1>
        <p class="page-description">
          施設の運営状況を様々な期間・観点で分析できます
        </p>
      </div>
      
      <div class="header-actions">
        <Button
          variant="outline"
          onclick={() => showChartSelector = !showChartSelector}
        >
          <Icon icon="material-symbols:tune" />
          表示設定
        </Button>
        
        <Button
          variant="outline"
          onclick={exportData}
          disabled={statisticsStore.isLoading}
        >
          <Icon icon="material-symbols:download" />
          エクスポート
        </Button>
        
        <Button
          variant="primary"
          onclick={addCustomStatCard}
        >
          <Icon icon="material-symbols:add" />
          項目追加
        </Button>
      </div>
    </div>
  </div>

  <!-- 日付範囲選択 -->
  <Card class="date-range-card">
    <DateRangePicker
      value={statisticsStore.dateRange}
      period={statisticsStore.currentPeriod}
      onchange={handleDateRangeChange}
      onperiodchange={handlePeriodChange}
    />
  </Card>

  <!-- 表示設定パネル -->
  {#if showChartSelector}
    <Card class="settings-panel">
      <div class="settings-header">
        <h3>表示設定</h3>
        <Button
          variant="ghost"
          size="sm"
          onclick={() => showChartSelector = false}
        >
          <Icon icon="material-symbols:close" />
        </Button>
      </div>
      
      <div class="settings-content">
        <!-- チャート選択 -->
        <div class="setting-group">
          <h4>表示するチャート</h4>
          <div class="checkbox-grid">
            {#each chartTypeOptions as option}
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={statisticsStore.selectedChartTypes.includes(option.id)}
                  onchange={() => toggleChartType(option.id)}
                />
                <Icon icon={option.icon} />
                {option.label}
              </label>
            {/each}
          </div>
        </div>
        
        <!-- 統計カード選択 -->
        <div class="setting-group">
          <h4>表示する統計カード</h4>
          <div class="checkbox-grid">
            {#each statCardOptions as option}
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={statisticsStore.selectedStatCards.includes(option.id)}
                  onchange={() => toggleStatCard(option.id)}
                />
                {option.label}
              </label>
            {/each}
          </div>
        </div>
      </div>
    </Card>
  {/if}

  <!-- ローディング状態 -->
  {#if statisticsStore.isLoading}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>統計データを読み込み中...</p>
    </div>
  {/if}

  <!-- エラー状態 -->
  {#if statisticsStore.error}
    <Card class="error-card">
      <div class="error-content">
        <Icon icon="material-symbols:error" class="error-icon" />
        <div>
          <h3>エラーが発生しました</h3>
          <p>{statisticsStore.error}</p>
          <Button variant="primary" onclick={loadData}>
            再試行
          </Button>
        </div>
      </div>
    </Card>
  {/if}

  <!-- 統計カード -->
  {#if statisticsStore.filteredStatCards && statisticsStore.filteredStatCards.length > 0}
    <div class="stat-cards-grid">
      {#each statisticsStore.filteredStatCards as card}
        <StatCard {card} />
      {/each}
    </div>
  {/if}

  <!-- チャート表示 -->
  {#if statisticsStore.data && !statisticsStore.isLoading}
    <div class="charts-grid">
      <!-- 利用者統計チャート -->
      {#if statisticsStore.selectedChartTypes.includes('users')}
        <Card class="chart-card">
          <div class="chart-header">
            <h3>
              <Icon icon="material-symbols:group" />
              利用者統計
            </h3>
            <p>要介護度別の利用者分布</p>
          </div>
          <div class="chart-container">
            <StatChart
              type="doughnut"
              data={statisticsStore.userChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        </Card>
      {/if}

      <!-- 職員統計チャート -->
      {#if statisticsStore.selectedChartTypes.includes('staff')}
        <Card class="chart-card">
          <div class="chart-header">
            <h3>
              <Icon icon="material-symbols:badge" />
              職員統計
            </h3>
            <p>役職別の職員分布</p>
          </div>
          <div class="chart-container">
            <StatChart
              type="bar"
              data={statisticsStore.staffChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      {/if}

      <!-- レポート統計チャート -->
      {#if statisticsStore.selectedChartTypes.includes('reports')}
        <Card class="chart-card">
          <div class="chart-header">
            <h3>
              <Icon icon="material-symbols:description" />
              レポート統計
            </h3>
            <p>レポートタイプ別の分布</p>
          </div>
          <div class="chart-container">
            <StatChart
              type="pie"
              data={statisticsStore.reportsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right'
                  }
                }
              }}
            />
          </div>
        </Card>
      {/if}
    </div>
  {/if}

  <!-- データが無い場合 -->
  {#if !statisticsStore.data && !statisticsStore.isLoading && !statisticsStore.error}
    <Card class="empty-state">
      <div class="empty-content">
        <Icon icon="material-symbols:analytics" class="empty-icon" />
        <h3>統計データがありません</h3>
        <p>データを読み込むには、上記の「再試行」ボタンをクリックしてください。</p>
        <Button variant="primary" onclick={loadData}>
          データを読み込む
        </Button>
      </div>
    </Card>
  {/if}
</div>

<style>
  .statistics-page {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* ページヘッダー */
  .page-header {
    margin-bottom: 8px;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }

  .title-section {
    flex: 1;
  }

  .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;
  }

  .title-icon {
    width: 32px;
    height: 32px;
    color: #3b82f6;
  }

  .page-description {
    font-size: 16px;
    color: #6b7280;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 12px;
    flex-shrink: 0;
  }

  /* 日付範囲カード */
  .date-range-card {
    background: white;
  }

  /* 設定パネル */
  .settings-panel {
    background: #f9fafb;
    border: 2px dashed #d1d5db;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .settings-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .settings-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .setting-group h4 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px 0;
  }

  .checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .checkbox-item:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  .checkbox-item input[type="checkbox"] {
    margin: 0;
  }

  /* 統計カードグリッド */
  .stat-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }

  /* チャートグリッド */
  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
  }

  .chart-card {
    background: white;
    min-height: 400px;
  }

  .chart-header {
    margin-bottom: 20px;
  }

  .chart-header h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
  }

  .chart-header p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }

  .chart-container {
    height: 300px;
    position: relative;
  }

  /* ローディング */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* エラー */
  .error-card {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .error-content {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .error-icon {
    width: 24px;
    height: 24px;
    color: #ef4444;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .error-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #dc2626;
    margin: 0 0 4px 0;
  }

  .error-content p {
    font-size: 14px;
    color: #991b1b;
    margin: 0 0 12px 0;
  }

  /* 空の状態 */
  .empty-state {
    background: #f9fafb;
  }

  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    width: 64px;
    height: 64px;
    color: #9ca3af;
    margin-bottom: 16px;
  }

  .empty-content h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .empty-content p {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 20px 0;
    max-width: 400px;
  }

  /* レスポンシブ */
  @media (max-width: 768px) {
    .statistics-page {
      padding: 16px;
      gap: 16px;
    }

    .header-content {
      flex-direction: column;
      align-items: stretch;
      gap: 16px;
    }

    .header-actions {
      justify-content: flex-start;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 24px;
    }

    .stat-cards-grid {
      grid-template-columns: 1fr;
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }

    .checkbox-grid {
      grid-template-columns: 1fr;
    }
  }
</style>