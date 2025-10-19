/**
 * チャット機能の状態管理
 * Svelte 5 Runeを使用したリアルタイムチャット状態管理
 */

import type { 
  ChatRoom, 
  ChatMessage, 
  ChatNotification, 
  TypingIndicator,
  Participant 
} from '$lib/types/chat.js';
import { chatService } from '$lib/services/chat.js';

export class ChatStore {
  // 基本状態
  chatRooms = $state<ChatRoom[]>([]);
  currentChatRoom = $state<ChatRoom | null>(null);
  messages = $state<ChatMessage[]>([]);
  notifications = $state<ChatNotification[]>([]);
  typingUsers = $state<TypingIndicator[]>([]);
  
  // UI状態
  isLoading = $state(false);
  isLoadingMessages = $state(false);
  isSendingMessage = $state(false);
  error = $state<string | null>(null);
  
  // ユーザー情報
  currentUserId = $state<string>('');
  currentUserName = $state<string>('');
  currentUserType = $state<'staff' | 'family'>('staff');

  // 派生状態
  unreadNotificationsCount = $derived(
    this.notifications.filter(n => !n.isRead).length
  );

  totalUnreadMessagesCount = $derived(
    this.chatRooms.reduce((total, room) => total + room.unreadCount, 0)
  );

  currentChatMessages = $derived(
    this.currentChatRoom ? this.messages : []
  );

  activeTypingUsers = $derived(
    this.typingUsers.filter(user => 
      user.userId !== this.currentUserId &&
      Date.now() - user.timestamp.getTime() < 3000 // 3秒以内
    )
  );

  // プライベート状態
  private unsubscribeFunctions: (() => void)[] = [];

  /**
   * 初期化
   */
  async initialize(userId: string, userName: string, userType: 'staff' | 'family' = 'staff') {
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.currentUserType = userType;
    
    await this.loadChatRooms();
    await this.loadNotifications();
  }

  /**
   * チャットルーム一覧を読み込み
   */
  async loadChatRooms() {
    try {
      this.isLoading = true;
      this.error = null;
      
      this.chatRooms = await chatService.getChatRooms(
        this.currentUserType === 'family' ? this.currentUserId : undefined
      );
    } catch (error) {
      console.error('Failed to load chat rooms:', error);
      this.error = 'チャットルームの読み込みに失敗しました';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * チャットルームを作成
   */
  async createChatRoom(userId: string, participants: Participant[]): Promise<string | null> {
    try {
      this.isLoading = true;
      this.error = null;
      
      const chatRoomId = await chatService.createChatRoom(userId, participants);
      await this.loadChatRooms(); // リストを更新
      
      return chatRoomId;
    } catch (error) {
      console.error('Failed to create chat room:', error);
      this.error = 'チャットルームの作成に失敗しました';
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * チャットルームを選択
   */
  async selectChatRoom(chatRoomId: string) {
    try {
      this.isLoadingMessages = true;
      this.error = null;
      
      // 現在のチャットルームの監視を停止
      this.unsubscribeCurrentChat();
      
      // 新しいチャットルームを設定
      const chatRoom = this.chatRooms.find(room => room.id === chatRoomId);
      if (!chatRoom) {
        throw new Error('Chat room not found');
      }
      
      this.currentChatRoom = chatRoom;
      this.messages = [];
      
      // メッセージを監視開始
      const unsubscribeMessages = chatService.subscribeToMessages(chatRoomId, (messages) => {
        this.messages = messages;
        this.isLoadingMessages = false;
        
        // 未読メッセージを既読にする
        const unreadMessages = messages.filter(msg => 
          !msg.readBy.includes(this.currentUserId) && 
          msg.senderId !== this.currentUserId
        );
        
        if (unreadMessages.length > 0) {
          this.markMessagesAsRead(unreadMessages.map(msg => msg.id));
        }
      });
      
      // タイピング状態を監視開始
      const unsubscribeTyping = chatService.subscribeToTypingStatus(chatRoomId, (typingUsers) => {
        this.typingUsers = typingUsers;
      });
      
      // チャットルーム情報を監視開始
      const unsubscribeChatRoom = chatService.subscribeToChartRoom(chatRoomId, (chatRoom) => {
        if (chatRoom) {
          this.currentChatRoom = chatRoom;
          // チャットルーム一覧も更新
          const index = this.chatRooms.findIndex(room => room.id === chatRoom.id);
          if (index !== -1) {
            this.chatRooms[index] = chatRoom;
          }
        }
      });
      
      this.unsubscribeFunctions.push(unsubscribeMessages, unsubscribeTyping, unsubscribeChatRoom);
      
    } catch (error) {
      console.error('Failed to select chat room:', error);
      this.error = 'チャットルームの選択に失敗しました';
      this.isLoadingMessages = false;
    }
  }

  /**
   * メッセージを送信
   */
  async sendMessage(content: string, attachments?: File[]) {
    if (!this.currentChatRoom || !content.trim() && !attachments?.length) {
      return;
    }

    try {
      this.isSendingMessage = true;
      this.error = null;
      
      await chatService.sendMessage(
        this.currentChatRoom.id,
        this.currentUserId,
        this.currentUserName,
        this.currentUserType,
        content,
        attachments
      );
      
      // タイピング状態をクリア
      await this.setTypingStatus(false);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      this.error = 'メッセージの送信に失敗しました';
      throw error;
    } finally {
      this.isSendingMessage = false;
    }
  }

  /**
   * メッセージを既読にする
   */
  async markMessagesAsRead(messageIds: string[]) {
    if (!this.currentChatRoom || messageIds.length === 0) {
      return;
    }

    try {
      await chatService.markMessagesAsRead(
        this.currentChatRoom.id,
        messageIds,
        this.currentUserId
      );
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }

  /**
   * タイピング状態を設定
   */
  async setTypingStatus(isTyping: boolean) {
    if (!this.currentChatRoom) {
      return;
    }

    try {
      await chatService.setTypingStatus(
        this.currentChatRoom.id,
        this.currentUserId,
        this.currentUserName,
        isTyping
      );
    } catch (error) {
      console.error('Failed to set typing status:', error);
    }
  }

  /**
   * 通知を読み込み
   */
  async loadNotifications() {
    try {
      this.notifications = await chatService.getNotifications(this.currentUserId);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  /**
   * 通知を既読にする
   */
  async markNotificationAsRead(notificationId: string) {
    try {
      await chatService.markNotificationAsRead(this.currentUserId, notificationId);
      
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
   * より多くのメッセージを読み込み
   */
  async loadMoreMessages() {
    if (!this.currentChatRoom || this.isLoadingMessages) {
      return;
    }

    try {
      this.isLoadingMessages = true;
      
      // 現在のメッセージ数より多くのメッセージを取得
      const moreMessages = await chatService.getMessages(
        this.currentChatRoom.id, 
        this.messages.length + 50
      );
      
      this.messages = moreMessages;
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      this.isLoadingMessages = false;
    }
  }

  /**
   * エラーをクリア
   */
  clearError() {
    this.error = null;
  }

  /**
   * 現在のチャットの監視を停止
   */
  private unsubscribeCurrentChat() {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions = [];
  }

  /**
   * すべての監視を停止
   */
  destroy() {
    this.unsubscribeCurrentChat();
    chatService.unsubscribeAll();
  }

  /**
   * チャットルームを検索
   */
  searchChatRooms(query: string): ChatRoom[] {
    if (!query.trim()) {
      return this.chatRooms;
    }

    const lowerQuery = query.toLowerCase();
    return this.chatRooms.filter(room => 
      room.name.toLowerCase().includes(lowerQuery) ||
      room.participants.some(p => p.name.toLowerCase().includes(lowerQuery)) ||
      room.lastMessage?.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 未読メッセージがあるチャットルームを取得
   */
  getUnreadChatRooms(): ChatRoom[] {
    return this.chatRooms.filter(room => room.unreadCount > 0);
  }

  /**
   * 特定のユーザーとのチャットルームを検索
   */
  findChatRoomByUserId(userId: string): ChatRoom | undefined {
    return this.chatRooms.find(room => room.userId === userId);
  }
}

// シングルトンインスタンス
export const chatStore = new ChatStore();