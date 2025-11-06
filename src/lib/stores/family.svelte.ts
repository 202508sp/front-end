/**
 * 家族ポータル用状態管理
 */

import type { 
  FamilyUser, 
  FamilyDashboardData, 
  FamilyNotification, 
  ReportSearchFilter 
} from '$lib/types/family.js';
import type { Report } from '$lib/types/report.js';
import type { User } from '$lib/types/user.js';
import type { ChatRoom } from '$lib/types/chat.js';

class FamilyStore {
  // 基本状態
  currentFamilyUser = $state<FamilyUser | null>(null);
  relatedUser = $state<User | null>(null);
  isAuthenticated = $state(false);
  isLoading = $state(false);
  error = $state<string | null>(null);

  // ダッシュボードデータ
  dashboardData = $state<FamilyDashboardData | null>(null);
  
  // レポート関連
  reports = $state<Report[]>([]);
  reportFilter = $state<ReportSearchFilter>({});
  reportLoading = $state(false);
  hasMoreReports = $state(false);
  
  // 通知
  notifications = $state<FamilyNotification[]>([]);
  unreadNotificationCount = $derived(
    this.notifications.filter(n => !n.isRead).length
  );

  // チャット
  chatRooms = $state<ChatRoom[]>([]);
  unreadMessageCount = $derived(
    this.chatRooms.reduce((total, room) => total + room.unreadCount, 0)
  );

  // 表示モード（通常 or 簡易インターフェース）
  isSimplifiedMode = $state(false);

  /**
   * 家族ユーザーでログイン
   */
  async login(familyUserId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      // TODO: Firebase認証連携
      console.log('Family user login:', familyUserId);
      
      // 仮のデータ
      this.currentFamilyUser = {
        id: familyUserId,
        name: '田中 花子',
        email: 'hanako@example.com',
        relationship: '娘',
        userId: 'user_001',
        hasPortalAccess: true,
        permissions: ['view_reports', 'view_chat', 'receive_notifications'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.relatedUser = {
        id: 'user_001',
        name: '田中 太郎',
        nameKana: 'たなか たろう',
        birthDate: new Date('1940-05-15'),
        gender: 'male',
        address: {
          postalCode: '123-4567',
          prefecture: '東京都',
          city: '渋谷区',
          street: '1-1-1'
        },
        emergencyContact: {
          name: '田中 花子',
          relationship: '娘',
          phone: '090-1234-5678',
          email: 'hanako@example.com'
        },
        medicalInfo: {
          allergies: ['卵', '小麦'],
          medications: [],
          conditions: ['高血圧', '糖尿病'],
          restrictions: ['塩分制限']
        },
        careLevel: 3,
        familyMembers: [
          {
            id: 'family_001',
            name: '田中 花子',
            relationship: '娘',
            phone: '090-1234-5678',
            email: 'hanako@example.com',
            isPrimaryContact: true,
            hasPortalAccess: true
          }
        ],
        notes: [],
        profileImage: undefined,
        admissionDate: new Date('2023-04-01'),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.isAuthenticated = true;
      
      // ダッシュボードデータを読み込み
      await this.loadDashboardData();
      
    } catch (error) {
      console.error('Family login failed:', error);
      this.error = 'ログインに失敗しました';
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * ログアウト
   */
  logout(): void {
    this.currentFamilyUser = null;
    this.relatedUser = null;
    this.isAuthenticated = false;
    this.dashboardData = null;
    this.reports = [];
    this.notifications = [];
    this.chatRooms = [];
    this.error = null;
  }

  /**
   * ダッシュボードデータを読み込み
   */
  async loadDashboardData(): Promise<void> {
    if (!this.currentFamilyUser || !this.relatedUser) return;

    this.isLoading = true;
    try {
      // TODO: Firebase連携実装
      console.log('Loading dashboard data for family user:', this.currentFamilyUser.id);
      
      // 仮のデータ
      const recentReports: Report[] = [
        {
          id: 'report_001',
          userId: this.relatedUser.id,
          authorId: 'staff_001',
          authorName: '看護師 山田',
          type: 'daily',
          title: '本日の様子',
          content: '今日は朝から元気で、朝食もしっかり召し上がりました。午後はレクリエーションに参加され、他の利用者様と楽しく過ごされていました。',
          sections: [],
          attachments: [],
          date: new Date(),
          status: 'published',
          isPublishedToFamily: true,
          tags: ['日常', '食事', 'レクリエーション'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'report_002',
          userId: this.relatedUser.id,
          authorId: 'staff_002',
          authorName: '介護士 佐藤',
          type: 'medical',
          title: '血圧測定結果',
          content: '本日の血圧測定結果をお知らせします。朝：130/80、夕：125/78と安定しています。',
          sections: [],
          attachments: [],
          date: new Date(Date.now() - 86400000), // 1日前
          status: 'published',
          isPublishedToFamily: true,
          tags: ['医療', '血圧'],
          createdAt: new Date(Date.now() - 86400000),
          updatedAt: new Date(Date.now() - 86400000)
        }
      ];

      const notifications: FamilyNotification[] = [
        {
          id: 'notif_001',
          title: '新しいレポートが投稿されました',
          message: '本日の様子についてのレポートが投稿されました。',
          type: 'report',
          isRead: false,
          createdAt: new Date(),
          actionUrl: '/family-portal?tab=reports'
        },
        {
          id: 'notif_002',
          title: '面会予定のお知らせ',
          message: '明日14:00からの面会予定をお忘れなく。',
          type: 'event',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000), // 1時間前
        }
      ];

      this.dashboardData = {
        user: this.relatedUser,
        recentReports,
        unreadMessages: 2,
        upcomingEvents: [
          {
            id: 'event_001',
            title: '面会予定',
            description: 'ご家族との面会',
            date: new Date(Date.now() + 86400000), // 明日
            type: 'visit',
            isImportant: true
          },
          {
            id: 'event_002',
            title: '健康診断',
            description: '定期健康診断',
            date: new Date(Date.now() + 604800000), // 1週間後
            type: 'medical',
            isImportant: false
          }
        ],
        notifications
      };

      this.notifications = notifications;
      this.reports = recentReports;

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      this.error = 'データの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * レポートを検索
   */
  async searchReports(filter: ReportSearchFilter): Promise<void> {
    if (!this.currentFamilyUser) return;

    this.reportLoading = true;
    this.reportFilter = filter;

    try {
      // TODO: Firebase連携実装
      console.log('Searching reports with filter:', filter);
      
      // 仮の検索結果
      let filteredReports = [...this.reports];
      
      if (filter.searchTerm) {
        filteredReports = filteredReports.filter(report => 
          report.title.includes(filter.searchTerm!) || 
          report.content.includes(filter.searchTerm!)
        );
      }
      
      if (filter.type && filter.type.length > 0) {
        filteredReports = filteredReports.filter(report => 
          filter.type!.includes(report.type)
        );
      }
      
      if (filter.dateRange) {
        filteredReports = filteredReports.filter(report => 
          report.date >= filter.dateRange!.start && 
          report.date <= filter.dateRange!.end
        );
      }

      this.reports = filteredReports;
      this.hasMoreReports = false; // 仮の実装

    } catch (error) {
      console.error('Failed to search reports:', error);
      this.error = 'レポートの検索に失敗しました';
    } finally {
      this.reportLoading = false;
    }
  }

  /**
   * さらにレポートを読み込み
   */
  async loadMoreReports(): Promise<void> {
    if (!this.hasMoreReports || this.reportLoading) return;

    this.reportLoading = true;
    try {
      // TODO: Firebase連携実装
      console.log('Loading more reports...');
      
      // 仮の実装（追加データなし）
      this.hasMoreReports = false;

    } catch (error) {
      console.error('Failed to load more reports:', error);
      this.error = 'レポートの読み込みに失敗しました';
    } finally {
      this.reportLoading = false;
    }
  }

  /**
   * 通知を既読にする
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      // TODO: Firebase連携実装
      console.log('Marking notification as read:', notificationId);
      
      // ローカル状態を更新
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * 簡易モードの切り替え
   */
  toggleSimplifiedMode(): void {
    this.isSimplifiedMode = !this.isSimplifiedMode;
    
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('familyPortalSimplifiedMode', String(this.isSimplifiedMode));
    }
  }

  /**
   * 初期化
   */
  initialize(): void {
    // ローカルストレージから設定を復元
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('familyPortalSimplifiedMode');
      if (savedMode !== null) {
        this.isSimplifiedMode = savedMode === 'true';
      }
    }
  }
}

// シングルトンインスタンス
export const familyStore = new FamilyStore();