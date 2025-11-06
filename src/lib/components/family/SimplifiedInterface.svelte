<script lang="ts">
  import type { SimplifiedUser, FamilyNotification } from '$lib/types/family.js';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '@iconify/svelte';
  import { formatDate } from '$lib/utils/date.js';
  import { onMount } from 'svelte';

  interface Props {
    user: SimplifiedUser;
    todayActivities?: string[];
    notifications?: FamilyNotification[];
    onCallStaff?: () => void;
    onViewPhotos?: () => void;
    onPlayMusic?: () => void;
  }

  let {
    user,
    todayActivities = [],
    notifications = [],
    onCallStaff = () => {},
    onViewPhotos = () => {},
    onPlayMusic = () => {}
  }: Props = $props();

  let currentTime = $state(new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  }));

  // 現在の時刻に基づく挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  // 今日の日付を分かりやすく表示
  const getTodayString = () => {
    const today = new Date();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const weekday = weekdays[today.getDay()];
    
    return `${month}月${date}日（${weekday}曜日）`;
  };

  // 重要な通知のみ表示
  const importantNotifications = $derived(
    notifications.filter(n => n.type === 'event' || n.type === 'system').slice(0, 2)
  );

  // 時計の更新
  onMount(() => {
    const interval = setInterval(() => {
      currentTime = new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="simplified-interface">
  <!-- ヘッダー -->
  <div class="header">
    <div class="user-greeting">
      <div class="user-avatar">
        {#if user.profileImage}
          <img src={user.profileImage} alt={user.name} />
        {:else}
          <Icon icon="material-symbols:person" width="64" height="64" />
        {/if}
      </div>
      <div class="greeting-text">
        <h1>{user.name}さん</h1>
        <p class="greeting">{getGreeting()}</p>
        <p class="date">{getTodayString()}</p>
      </div>
    </div>
  </div>

  <!-- メインコンテンツ -->
  <div class="main-content">
    <!-- 今日の予定 -->
    <Card class="today-activities">
      <div class="section-header">
        <Icon icon="material-symbols:today" width="32" height="32" />
        <h2>今日の予定</h2>
      </div>
      
      {#if todayActivities.length > 0}
        <div class="activities-list">
          {#each todayActivities as activity}
            <div class="activity-item">
              <Icon icon="material-symbols:check-circle-outline" width="24" height="24" />
              <span>{activity}</span>
            </div>
          {/each}
        </div>
      {:else}
        <div class="empty-activities">
          <Icon icon="material-symbols:event-available" width="48" height="48" />
          <p>今日は特別な予定はありません</p>
          <p>ゆっくりお過ごしください</p>
        </div>
      {/if}
    </Card>

    <!-- お知らせ -->
    {#if importantNotifications.length > 0}
      <Card class="notifications">
        <div class="section-header">
          <Icon icon="material-symbols:notifications" width="32" height="32" />
          <h2>お知らせ</h2>
        </div>
        
        <div class="notifications-list">
          {#each importantNotifications as notification}
            <div class="notification-item">
              <Icon icon="material-symbols:info" width="24" height="24" />
              <div class="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    <!-- アクションボタン -->
    <div class="action-buttons">
      <Card class="action-card">
        <Button
          size="lg"
          onclick={onCallStaff}
          class="action-button call-staff"
        >
          <Icon icon="material-symbols:support-agent" width="32" height="32" />
          <span>スタッフを呼ぶ</span>
        </Button>
      </Card>

      <Card class="action-card">
        <Button
          size="lg"
          variant="outline"
          onclick={onViewPhotos}
          class="action-button"
        >
          <Icon icon="material-symbols:photo-library" width="32" height="32" />
          <span>写真を見る</span>
        </Button>
      </Card>

      <Card class="action-card">
        <Button
          size="lg"
          variant="outline"
          onclick={onPlayMusic}
          class="action-button"
        >
          <Icon icon="material-symbols:music-note" width="32" height="32" />
          <span>音楽を聞く</span>
        </Button>
      </Card>
    </div>

    <!-- 時計表示 -->
    <Card class="clock-display">
      <div class="clock">
        <div class="time">
          {currentTime}
        </div>
        <div class="weather-info">
          <Icon icon="material-symbols:wb-sunny" width="24" height="24" />
          <span>晴れ 22°C</span>
        </div>
      </div>
    </Card>
  </div>
</div>

<style>
  .simplified-interface {
    max-width: 800px;
    margin: 0 auto;
    padding: 24px;
    min-height: 100vh;
    background-color: #f9fafb;
  }

  .header {
    margin-bottom: 32px;
  }

  .user-greeting {
    display: flex;
    align-items: center;
    gap: 24px;
    background-color: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .greeting-text h1 {
    font-size: 28px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .greeting {
    font-size: 20px;
    color: #2563eb;
    margin-bottom: 4px;
  }

  .date {
    font-size: 16px;
    color: #6b7280;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .section-header h2 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
  }

  .today-activities {
    padding: 24px;
  }

  .activities-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background-color: #dbeafe;
    border-radius: 8px;
  }

  .activity-item span {
    font-size: 16px;
    color: #374151;
  }

  .empty-activities {
    text-align: center;
    padding: 32px 0;
    color: #6b7280;
  }

  .empty-activities p {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .notifications {
    padding: 24px;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background-color: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 8px;
  }

  .notification-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .notification-content p {
    font-size: 14px;
    color: #374151;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .action-card {
    padding: 16px;
  }

  .action-button {
    width: 100%;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 16px;
  }

  .call-staff {
    background-color: #ef4444;
    color: white;
  }

  .call-staff:hover {
    background-color: #dc2626;
  }

  .clock-display {
    padding: 24px;
    text-align: center;
  }

  .clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .time {
    font-size: 48px;
    font-weight: 300;
    color: #111827;
    font-family: monospace;
  }

  .weather-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    color: #6b7280;
  }

  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .simplified-interface {
      padding: 16px;
    }

    .user-greeting {
      flex-direction: column;
      text-align: center;
      gap: 16px;
      padding: 20px;
    }

    .greeting-text h1 {
      font-size: 24px;
    }

    .greeting {
      font-size: 18px;
    }

    .time {
      font-size: 36px;
    }

    .action-buttons {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .action-button {
      height: 70px;
      font-size: 14px;
    }
  }

  @media (min-width: 768px) {
    .action-buttons {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  /* 高コントラスト対応 */
  @media (prefers-contrast: high) {
    .user-greeting {
      border: 2px solid #374151;
    }

    .activity-item {
      border: 1px solid #3b82f6;
    }

    .notification-item {
      border: 2px solid #d97706;
    }
  }

  /* アニメーション無効化対応 */
  @media (prefers-reduced-motion: reduce) {
    .action-button {
      transition: none;
    }
  }
</style>