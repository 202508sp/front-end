<script lang="ts">
  import type { FamilyDashboardData, FamilyNotification } from '$lib/types/family.js';
  import type { Report } from '$lib/types/report.js';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '@iconify/svelte';
  import { formatDate, formatRelativeTime } from '$lib/utils/date.js';

  interface Props {
    data: FamilyDashboardData;
    onViewReport?: (reportId: string) => void;
    onViewAllReports?: () => void;
    onOpenChat?: () => void;
    onMarkNotificationRead?: (notificationId: string) => void;
  }

  let {
    data,
    onViewReport = () => {},
    onViewAllReports = () => {},
    onOpenChat = () => {},
    onMarkNotificationRead = () => {}
  }: Props = $props();

  const getReportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'daily': '日常レポート',
      'medical': '医療レポート',
      'incident': 'インシデントレポート',
      'progress': '経過レポート',
      'family-communication': '家族連絡'
    };
    return labels[type] || type;
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'report': 'material-symbols:description',
      'message': 'material-symbols:chat',
      'event': 'material-symbols:event',
      'system': 'material-symbols:info'
    };
    return icons[type] || 'material-symbols:notifications';
  };

  const handleNotificationClick = (notification: FamilyNotification) => {
    if (!notification.isRead) {
      onMarkNotificationRead(notification.id);
    }
    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
  };
</script>

<div class="family-dashboard">
  <!-- ヘッダー -->
  <div class="dashboard-header">
    <div class="user-info">
      <div class="user-avatar">
        {#if data.user.profileImage}
          <img src={data.user.profileImage} alt={data.user.name} />
        {:else}
          <Icon icon="material-symbols:person" width="48" height="48" />
        {/if}
      </div>
      <div class="user-details">
        <h1>{data.user.name}さん</h1>
        <p class="user-meta">
          要介護度: {data.user.careLevel} | 
          入所日: {formatDate(data.user.admissionDate)}
        </p>
      </div>
    </div>
    
    <div class="quick-actions">
      <Button
        variant="outline"
        size="sm"
        onclick={onOpenChat}
        class="chat-button"
      >
        <Icon icon="material-symbols:chat" width="16" height="16" />
        チャット
        {#if data.unreadMessages > 0}
          <span class="unread-badge">{data.unreadMessages}</span>
        {/if}
      </Button>
    </div>
  </div>

  <!-- メインコンテンツ -->
  <div class="dashboard-content">
    <!-- 最新レポート -->
    <Card class="reports-section">
      <div class="section-header">
        <h2>
          <Icon icon="material-symbols:description" width="20" height="20" />
          最新レポート
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onclick={onViewAllReports}
        >
          すべて見る
        </Button>
      </div>
      
      <div class="reports-list">
        {#each data.recentReports.slice(0, 3) as report}
          <div 
            class="report-item"
            role="button"
            tabindex="0"
            onclick={() => onViewReport(report.id)}
            onkeydown={(e) => e.key === 'Enter' && onViewReport(report.id)}
          >
            <div class="report-header">
              <span class="report-type">{getReportTypeLabel(report.type)}</span>
              <span class="report-date">{formatDate(report.date)}</span>
            </div>
            <h3 class="report-title">{report.title}</h3>
            <p class="report-preview">
              {report.content.length > 100 
                ? report.content.substring(0, 100) + '...' 
                : report.content}
            </p>
            {#if report.tags.length > 0}
              <div class="report-tags">
                {#each report.tags.slice(0, 3) as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
        
        {#if data.recentReports.length === 0}
          <div class="empty-state">
            <Icon icon="material-symbols:description-outline" width="48" height="48" />
            <p>まだレポートがありません</p>
          </div>
        {/if}
      </div>
    </Card>

    <!-- 通知 -->
    <Card class="notifications-section">
      <div class="section-header">
        <h2>
          <Icon icon="material-symbols:notifications" width="20" height="20" />
          お知らせ
        </h2>
      </div>
      
      <div class="notifications-list">
        {#each data.notifications.slice(0, 5) as notification}
          <div 
            class="notification-item {notification.isRead ? 'read' : 'unread'}"
            role="button"
            tabindex="0"
            onclick={() => handleNotificationClick(notification)}
            onkeydown={(e) => e.key === 'Enter' && handleNotificationClick(notification)}
          >
            <div class="notification-icon">
              <Icon icon={getNotificationIcon(notification.type)} width="20" height="20" />
            </div>
            <div class="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span class="notification-time">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
            {#if !notification.isRead}
              <div class="unread-indicator"></div>
            {/if}
          </div>
        {/each}
        
        {#if data.notifications.length === 0}
          <div class="empty-state">
            <Icon icon="material-symbols:notifications-outline" width="48" height="48" />
            <p>新しいお知らせはありません</p>
          </div>
        {/if}
      </div>
    </Card>

    <!-- 予定・イベント -->
    <Card class="events-section">
      <div class="section-header">
        <h2>
          <Icon icon="material-symbols:event" width="20" height="20" />
          今後の予定
        </h2>
      </div>
      
      <div class="events-list">
        {#each data.upcomingEvents.slice(0, 3) as event}
          <div class="event-item {event.isImportant ? 'important' : ''}">
            <div class="event-date">
              <span class="date">{event.date.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}</span>
              <span class="time">{event.date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>
            <div class="event-content">
              <h4>{event.title}</h4>
              {#if event.description}
                <p>{event.description}</p>
              {/if}
              <span class="event-type">{event.type}</span>
            </div>
            {#if event.isImportant}
              <Icon icon="material-symbols:priority-high" width="16" height="16" class="important-icon" />
            {/if}
          </div>
        {/each}
        
        {#if data.upcomingEvents.length === 0}
          <div class="empty-state">
            <Icon icon="material-symbols:event-outline" width="48" height="48" />
            <p>予定されているイベントはありません</p>
          </div>
        {/if}
      </div>
    </Card>
  </div>
</div>

<style>
  .family-dashboard {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .user-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-details h1 {
    font-size: 24px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .user-meta {
    font-size: 14px;
    color: #6b7280;
  }

  .quick-actions {
    display: flex;
    gap: 12px;
  }

  .unread-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background-color: #ef4444;
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 50%;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dashboard-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  @media (min-width: 1024px) {
    .dashboard-content {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1280px) {
    .dashboard-content {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .report-item {
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 200ms;
  }

  .report-item:hover {
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .report-type {
    font-size: 12px;
    font-weight: 500;
    color: #2563eb;
    background-color: #eff6ff;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .report-date {
    font-size: 12px;
    color: #6b7280;
  }

  .report-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .report-preview {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .report-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 11px;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 200ms;
    position: relative;
  }

  .notification-item:hover {
    background-color: #f9fafb;
  }

  .notification-item.unread {
    background-color: #eff6ff;
  }

  .notification-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    background-color: #f3f4f6;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .notification-content p {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .notification-time {
    font-size: 11px;
    color: #6b7280;
  }

  .unread-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 8px;
    height: 8px;
    background-color: #3b82f6;
    border-radius: 50%;
  }

  .events-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .event-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    position: relative;
  }

  .event-item.important {
    border-color: #fed7aa;
    background-color: #fff7ed;
  }

  .event-date {
    flex-shrink: 0;
    text-align: center;
  }

  .event-date .date {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #111827;
  }

  .event-date .time {
    display: block;
    font-size: 12px;
    color: #6b7280;
  }

  .event-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
  }

  .event-content p {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .event-type {
    font-size: 11px;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .empty-state {
    text-align: center;
    padding: 32px 0;
    color: #6b7280;
  }

  .empty-state p {
    margin-top: 8px;
    font-size: 14px;
  }

  @media (min-width: 1024px) {
    .reports-section {
      grid-column: span 2;
    }
  }
</style>