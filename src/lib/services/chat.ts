/**
 * チャット機能のサービス層
 * Firebase Realtime Databaseとの連携を担当
 */

import { 
  ref, 
  push, 
  set, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  limitToLast,
  serverTimestamp,
  type Database,
  type DatabaseReference,
  type Unsubscribe
} from 'firebase/database';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL,
  type FirebaseStorage
} from 'firebase/storage';
import { database, storage, isFirebaseConfigured, isRealtimeDatabaseConfigured } from '$lib/firebase';
import type { 
  ChatRoom, 
  ChatMessage, 
  Participant, 
  Attachment, 
  ChatNotification,
  TypingIndicator 
} from '$lib/types/chat.js';

export class ChatService {
  private db: Database;
  private storage: FirebaseStorage;
  private listeners: Map<string, Unsubscribe> = new Map();
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = isFirebaseConfigured() && isRealtimeDatabaseConfigured();
    
    if (this.isAvailable && database) {
      this.db = database;
      this.storage = storage;
    } else {
      console.warn('Firebase Realtime Database is not configured. Chat functionality will be disabled.');
      // モックオブジェクトを設定
      this.db = {} as Database;
      this.storage = {} as FirebaseStorage;
    }
  }

  /**
   * Firebase設定状態を確認
   */
  private checkFirebaseAvailable(): boolean {
    if (!this.isAvailable) {
      console.warn('Firebase is not available. Chat operation skipped.');
      return false;
    }
    return true;
  }

  /**
   * チャットルームを作成
   */
  async createChatRoom(userId: string, participants: Participant[]): Promise<string> {
    if (!this.checkFirebaseAvailable()) {
      throw new Error('Firebase is not available');
    }
    
    const chatRoomsRef = ref(this.db, 'chatRooms');
    const newChatRoomRef = push(chatRoomsRef);
    
    const chatRoom: Omit<ChatRoom, 'id'> = {
      userId,
      name: `${participants.find(p => p.type === 'family')?.name || '利用者'}さんとのチャット`,
      participants,
      unreadCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await set(newChatRoomRef, {
      ...chatRoom,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newChatRoomRef.key!;
  }

  /**
   * チャットルーム一覧を取得
   */
  async getChatRooms(userId?: string): Promise<ChatRoom[]> {
    if (!this.checkFirebaseAvailable()) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      const chatRoomsRef = ref(this.db, 'chatRooms');
      const chatRoomsQuery = userId 
        ? query(chatRoomsRef, orderByChild('userId'), limitToLast(50))
        : query(chatRoomsRef, limitToLast(50));

      onValue(chatRoomsQuery, (snapshot) => {
        const chatRooms: ChatRoom[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data) {
            chatRooms.push({
              id: childSnapshot.key!,
              ...data,
              createdAt: new Date(data.createdAt),
              updatedAt: new Date(data.updatedAt),
              lastMessage: data.lastMessage ? {
                ...data.lastMessage,
                timestamp: new Date(data.lastMessage.timestamp)
              } : undefined
            });
          }
        });
        resolve(chatRooms.reverse());
      }, reject);
    });
  }

  /**
   * チャットルームをリアルタイムで監視
   */
  subscribeToChartRoom(chatRoomId: string, callback: (chatRoom: ChatRoom | null) => void): () => void {
    if (!this.checkFirebaseAvailable()) {
      return () => {}; // 空の関数を返す
    }
    
    const chatRoomRef = ref(this.db, `chatRooms/${chatRoomId}`);
    
    const unsubscribe = onValue(chatRoomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatRoom: ChatRoom = {
          id: snapshot.key!,
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt),
          lastMessage: data.lastMessage ? {
            ...data.lastMessage,
            timestamp: new Date(data.lastMessage.timestamp)
          } : undefined
        };
        callback(chatRoom);
      } else {
        callback(null);
      }
    });

    this.listeners.set(`chatRoom_${chatRoomId}`, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(`chatRoom_${chatRoomId}`);
    };
  }

  /**
   * メッセージ一覧を取得
   */
  async getMessages(chatRoomId: string, limit: number = 50): Promise<ChatMessage[]> {
    return new Promise((resolve, reject) => {
      const messagesRef = ref(this.db, `messages/${chatRoomId}`);
      const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(limit));

      onValue(messagesQuery, (snapshot) => {
        const messages: ChatMessage[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data) {
            messages.push({
              id: childSnapshot.key!,
              ...data,
              timestamp: new Date(data.timestamp),
              attachments: data.attachments || [],
              readBy: data.readBy || [],
              editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
              deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined
            });
          }
        });
        resolve(messages);
      }, reject);
    });
  }

  /**
   * メッセージをリアルタイムで監視
   */
  subscribeToMessages(chatRoomId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const messagesRef = ref(this.db, `messages/${chatRoomId}`);
    const messagesQuery = query(messagesRef, orderByChild('timestamp'), limitToLast(100));
    
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data) {
          messages.push({
            id: childSnapshot.key!,
            ...data,
            timestamp: new Date(data.timestamp),
            attachments: data.attachments || [],
            readBy: data.readBy || [],
            editedAt: data.editedAt ? new Date(data.editedAt) : undefined,
            deletedAt: data.deletedAt ? new Date(data.deletedAt) : undefined
          });
        }
      });
      callback(messages);
    });

    this.listeners.set(`messages_${chatRoomId}`, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(`messages_${chatRoomId}`);
    };
  }

  /**
   * メッセージを送信
   */
  async sendMessage(
    chatRoomId: string, 
    senderId: string, 
    senderName: string,
    senderType: 'staff' | 'family',
    content: string, 
    attachments?: File[]
  ): Promise<string> {
    if (!this.checkFirebaseAvailable()) {
      throw new Error('Firebase is not available');
    }
    
    // ファイルをアップロード
    const uploadedAttachments: Attachment[] = [];
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const attachment = await this.uploadFile(chatRoomId, file);
        uploadedAttachments.push(attachment);
      }
    }

    // メッセージを作成
    const messagesRef = ref(this.db, `messages/${chatRoomId}`);
    const newMessageRef = push(messagesRef);
    
    const message: Omit<ChatMessage, 'id'> = {
      chatRoomId,
      senderId,
      senderName,
      senderType,
      content,
      attachments: uploadedAttachments,
      timestamp: new Date(),
      isRead: false,
      readBy: [senderId], // 送信者は既読
      isEdited: false,
      isDeleted: false
    };

    await set(newMessageRef, {
      ...message,
      timestamp: serverTimestamp()
    });

    // チャットルームの最終メッセージを更新
    const chatRoomRef = ref(this.db, `chatRooms/${chatRoomId}`);
    await set(ref(this.db, `chatRooms/${chatRoomId}/lastMessage`), {
      id: newMessageRef.key!,
      content,
      senderId,
      senderName,
      timestamp: serverTimestamp()
    });

    await set(ref(this.db, `chatRooms/${chatRoomId}/updatedAt`), serverTimestamp());

    return newMessageRef.key!;
  }

  /**
   * ファイルをアップロード
   */
  private async uploadFile(chatRoomId: string, file: File): Promise<Attachment> {
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = storageRef(this.storage, `chat/${chatRoomId}/${fileName}`);
    
    const snapshot = await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      id: fileName,
      name: file.name,
      url: downloadURL,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    };
  }

  /**
   * メッセージを既読にする
   */
  async markMessagesAsRead(chatRoomId: string, messageIds: string[], userId: string): Promise<void> {
    const updates: Record<string, any> = {};
    
    for (const messageId of messageIds) {
      updates[`messages/${chatRoomId}/${messageId}/readBy/${userId}`] = true;
    }
    
    await set(ref(this.db), updates);
  }

  /**
   * タイピング状態を送信
   */
  async setTypingStatus(chatRoomId: string, userId: string, userName: string, isTyping: boolean): Promise<void> {
    const typingRef = ref(this.db, `typing/${chatRoomId}/${userId}`);
    
    if (isTyping) {
      const typingIndicator: TypingIndicator = {
        userId,
        userName,
        chatRoomId,
        timestamp: new Date()
      };
      
      await set(typingRef, {
        ...typingIndicator,
        timestamp: serverTimestamp()
      });
    } else {
      await set(typingRef, null);
    }
  }

  /**
   * タイピング状態を監視
   */
  subscribeToTypingStatus(chatRoomId: string, callback: (typingUsers: TypingIndicator[]) => void): () => void {
    const typingRef = ref(this.db, `typing/${chatRoomId}`);
    
    const unsubscribe = onValue(typingRef, (snapshot) => {
      const typingUsers: TypingIndicator[] = [];
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data) {
          typingUsers.push({
            ...data,
            timestamp: new Date(data.timestamp)
          });
        }
      });
      callback(typingUsers);
    });

    this.listeners.set(`typing_${chatRoomId}`, unsubscribe);
    
    return () => {
      unsubscribe();
      this.listeners.delete(`typing_${chatRoomId}`);
    };
  }

  /**
   * 通知を作成
   */
  async createNotification(
    chatRoomId: string, 
    messageId: string, 
    recipientId: string, 
    type: 'new_message' | 'mention' | 'file_shared'
  ): Promise<void> {
    const notificationsRef = ref(this.db, `notifications/${recipientId}`);
    const newNotificationRef = push(notificationsRef);
    
    const notification: Omit<ChatNotification, 'id'> = {
      chatRoomId,
      messageId,
      recipientId,
      type,
      isRead: false,
      createdAt: new Date()
    };

    await set(newNotificationRef, {
      ...notification,
      createdAt: serverTimestamp()
    });
  }

  /**
   * 通知を取得
   */
  async getNotifications(userId: string): Promise<ChatNotification[]> {
    return new Promise((resolve, reject) => {
      const notificationsRef = ref(this.db, `notifications/${userId}`);
      const notificationsQuery = query(notificationsRef, orderByChild('createdAt'), limitToLast(50));

      onValue(notificationsQuery, (snapshot) => {
        const notifications: ChatNotification[] = [];
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val();
          if (data) {
            notifications.push({
              id: childSnapshot.key!,
              ...data,
              createdAt: new Date(data.createdAt)
            });
          }
        });
        resolve(notifications.reverse());
      }, reject);
    });
  }

  /**
   * 通知を既読にする
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    const notificationRef = ref(this.db, `notifications/${userId}/${notificationId}/isRead`);
    await set(notificationRef, true);
  }

  /**
   * すべてのリスナーを解除
   */
  unsubscribeAll(): void {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  /**
   * 特定のリスナーを解除
   */
  unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }
}

// 遅延初期化されるシングルトンインスタンス
let _chatService: ChatService | null = null;

export function getChatService(): ChatService {
  if (!_chatService) {
    _chatService = new ChatService();
  }
  return _chatService;
}

// 後方互換性のためのエクスポート
export const chatService = getChatService();