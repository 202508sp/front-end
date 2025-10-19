/**
 * 通知サービス
 * チャットメッセージやシステム通知を管理
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
}

export interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export class NotificationService {
  private toastNotifications = $state<ToastNotification[]>([]);
  private notificationPermission = $state<NotificationPermission>('default');

  constructor() {
    // ブラウザ通知の許可状態を確認
    if ('Notification' in window) {
      this.notificationPermission = Notification.permission;
    }
  }

  /**
   * ブラウザ通知の許可を要求
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (this.notificationPermission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  /**
   * ブラウザ通知を表示
   */
  async showBrowserNotification(options: NotificationOptions): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (this.notificationPermission !== 'granted') {
      const granted = await this.requestNotificationPermission();
      if (!granted) {
        console.warn('Notification permission not granted');
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.png',
        badge: options.badge,
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        actions: options.actions
      });

      // 通知クリック時の処理
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自動で閉じる（デフォルト5秒）
      setTimeout(() => {
        notification.close();
      }, 5000);

    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  /**
   * チャットメッセージ通知を表示
   */
  async showChatNotification(senderName: string, message: string, chatRoomId: string): Promise<void> {
    await this.showBrowserNotification({
      title: `${senderName}からのメッセージ`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/favicon.png',
      tag: `chat_${chatRoomId}`,
      requireInteraction: false,
      actions: [
        {
          action: 'reply',
          title: '返信',
          icon: '/icons/reply.png'
        },
        {
          action: 'view',
          title: '表示',
          icon: '/icons/view.png'
        }
      ]
    });
  }

  /**
   * トースト通知を表示
   */
  showToast(notification: Omit<ToastNotification, 'id'>): string {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toast: ToastNotification = {
      id,
      duration: 5000, // デフォルト5秒
      ...notification
    };

    this.toastNotifications.push(toast);

    // 自動で削除
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, toast.duration);
    }

    return id;
  }

  /**
   * 成功トースト通知
   */
  showSuccess(title: string, message: string, duration?: number): string {
    return this.showToast({
      type: 'success',
      title,
      message,
      duration
    });
  }

  /**
   * エラートースト通知
   */
  showError(title: string, message: string, duration?: number): string {
    return this.showToast({
      type: 'error',
      title,
      message,
      duration: duration || 8000 // エラーは長めに表示
    });
  }

  /**
   * 警告トースト通知
   */
  showWarning(title: string, message: string, duration?: number): string {
    return this.showToast({
      type: 'warning',
      title,
      message,
      duration
    });
  }

  /**
   * 情報トースト通知
   */
  showInfo(title: string, message: string, duration?: number): string {
    return this.showToast({
      type: 'info',
      title,
      message,
      duration
    });
  }

  /**
   * トースト通知を削除
   */
  removeToast(id: string): void {
    this.toastNotifications = this.toastNotifications.filter(toast => toast.id !== id);
  }

  /**
   * すべてのトースト通知をクリア
   */
  clearAllToasts(): void {
    this.toastNotifications = [];
  }

  /**
   * 現在のトースト通知一覧を取得
   */
  getToastNotifications(): ToastNotification[] {
    return this.toastNotifications;
  }

  /**
   * 通知許可状態を取得
   */
  getNotificationPermission(): NotificationPermission {
    return this.notificationPermission;
  }

  /**
   * ページがアクティブかどうかを確認
   */
  isPageActive(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * ページがフォーカスされているかどうかを確認
   */
  isPageFocused(): boolean {
    return document.hasFocus();
  }

  /**
   * 通知を表示すべきかどうかを判定
   */
  shouldShowNotification(): boolean {
    return !this.isPageActive() || !this.isPageFocused();
  }
}

// シングルトンインスタンス
export const notificationService = new NotificationService();