<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chatStore } from '$lib/stores/chat.svelte.js';
  import { notificationService } from '$lib/services/notification.js';
  import ChatWindow from '$lib/components/chat/ChatWindow.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import type { ChatRoom, Participant } from '$lib/types/chat.js';

  // デモ用のユーザー情報
  let currentUserId = 'staff_001';
  let currentUserName = '田中 太郎';
  let currentUserType: 'staff' | 'family' = 'staff';

  // UI状態
  let isCreateRoomModalOpen = $state(false);
  let selectedChatRoom = $state<ChatRoom | null>(null);
  let newRoomUserId = $state('');
  let newRoomUserName = $state('');

  // チャットストアの状態を取得
  const chatRooms = $derived(chatStore.chatRooms);
  const currentChatRoom = $derived(chatStore.currentChatRoom);
  const messages = $derived(chatStore.currentChatMessages);
  const isLoading = $derived(chatStore.isLoading);
  const error = $derived(chatStore.error);
  const unreadCount = $derived(chatStore.totalUnreadMessagesCount);

  // チャットルーム作成
  async function createChatRoom() {
    if (!newRoomUserId.trim() || !newRoomUserName.trim()) {
      notificationService.showError('エラー', 'ユーザーIDと名前を入力してください');
      return;
    }

    const participants: Participant[] = [
      {
        id: currentUserId,
        name: currentUserName,
        type: 'staff',
        isOnline: true,
        lastSeenAt: new Date()
      },
      {
        id: 'family_' + newRoomUserId,
        name: newRoomUserName,
        type: 'family',
        isOnline: false,
        lastSeenAt: new Date()
      }
    ];

    const chatRoomId = await chatStore.createChatRoom(newRoomUserId, participants);
    
    if (chatRoomId) {
      notificationService.showSuccess('成功', 'チャットルームを作成しました');
      isCreateRoomModalOpen = false;
      newRoomUserId = '';
      newRoomUserName = '';
      
      // 作成したチャットルームを選択
      await chatStore.selectChatRoom(chatRoomId);
    }
  }

  // チャットルーム選択
  async function selectChatRoom(chatRoom: ChatRoom) {
    selectedChatRoom = chatRoom;
    await chatStore.selectChatRoom(chatRoom.id);
  }

  // メッセージ送信
  async function handleSendMessage(content: string, attachments?: File[]) {
    await chatStore.sendMessage(content, attachments);
  }

  // より多くのメッセージを読み込み
  async function handleLoadMoreMessages() {
    await chatStore.loadMoreMessages();
  }

  // メッセージを既読にする
  function handleMarkAsRead(messageIds: string[]) {
    chatStore.markMessagesAsRead(messageIds);
  }

  // エラー表示
  $effect(() => {
    if (error) {
      notificationService.showError('エラー', error);
      chatStore.clearError();
    }
  });

  // 初期化
  onMount(async () => {
    try {
      await chatStore.initialize(currentUserId, currentUserName, currentUserType);
      
      // 通知許可を要求
      await notificationService.requestNotificationPermission();
      
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      notificationService.showError('初期化エラー', 'チャット機能の初期化に失敗しました');
    }
  });

  // クリーンアップ
  onDestroy(() => {
    chatStore.destroy();
  });
</script>

<svelte:head>
  <title>チャット機能 - 介護施設ダッシュボード</title>
</svelte:head>

<div class="h:screen flex bg:care-background-primary">
  <!-- サイドバー: チャットルーム一覧 -->
  <div class="w:80 bg:care-background-secondary border-r:1|solid|care-gray-200 flex flex:column">
    <!-- ヘッダー -->
    <div class="p:4 border-b:1|solid|care-gray-200">
      <div class="flex ai:center jc:space-betwrrn mb:4">
        <h1 class="text:lg font:semibold text:care-text-primary">チャット</h1>
        <Button
          variant="primary"
          size="sm"
          onclick={() => isCreateRoomModalOpen = true}
          data-testid="create-chat-room-button"
        >
          <svg class="w:4 h:4 mr:1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          新規作成
        </Button>
      </div>
      
      {#if unreadCount > 0}
        <div class="bg:care-accent-error-100 text:care-accent-error-700 px:2 py:1 r:16px text:sm">
          未読メッセージ: {unreadCount}件
        </div>
      {/if}
    </div>

    <!-- チャットルーム一覧 -->
    <div class="flex-1 overflow-y:auto">
      {#if isLoading}
        <div class="flex ai:center jc:center p:8">
          <div class="animate:spin w:6 h:6 border:2|solid|care-primary-600 border-t:transparent r:9999px"></div>
        </div>
      {:else if chatRooms.length === 0}
        <div class="p:4 text:center text:care-text-secondary">
          <svg class="w:12 h:12 mx:auto mb:2 text:care-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p class="text:sm">チャットルームがありません</p>
          <p class="text:xs mt:1">新規作成ボタンから作成してください</p>
        </div>
      {:else}
        <div class="space-y:1 p:2">
          {#each chatRooms as chatRoom}
            <button
              class="w:full text-left p:3 r:24px hover:bg:care-primary-50 transition-colors {currentChatRoom?.id === chatRoom.id ? 'bg:care-primary-100 border:1|solid|care-primary-300' : ''}"
              onclick={() => selectChatRoom(chatRoom)}
              data-testid="chat-room-item"
            >
              <div class="flex ai:center jc:space-betwrrn mb:1">
                <h3 class="font:medium text:care-text-primary truncate">{chatRoom.name}</h3>
                {#if chatRoom.unreadCount > 0}
                  <span class="bg:care-accent-error-500 text:care-text-inverse text:xs px:1.5 py:0.5 r:9999px min-w:5 text-center">
                    {chatRoom.unreadCount}
                  </span>
                {/if}
              </div>
              
              {#if chatRoom.lastMessage}
                <p class="text:sm text:care-text-secondary truncate">
                  {chatRoom.lastMessage.senderName}: {chatRoom.lastMessage.content}
                </p>
                <p class="text:xs text:care-text-secondary mt:1">
                  {new Date(chatRoom.lastMessage.timestamp).toLocaleString('ja-JP')}
                </p>
              {:else}
                <p class="text:sm text:care-text-secondary italic">メッセージがありません</p>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- メインエリア: チャットウィンドウ -->
  <div class="flex-1 flex flex:column">
    {#if currentChatRoom}
      <ChatWindow
        chatRoom={currentChatRoom}
        {messages}
        {currentUserId}
        isStaffView={currentUserType === 'staff'}
        isLoading={chatStore.isLoadingMessages}
        onSendMessage={handleSendMessage}
        onLoadMoreMessages={handleLoadMoreMessages}
        onMarkAsRead={handleMarkAsRead}
        class="h:full"
        data-testid="chat-window"
      />
    {:else}
      <div class="flex-1 flex ai:center jc:center bg:care-background-primary">
        <div class="text-center">
          <svg class="w:16 h:16 mx:auto mb:4 text:care-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 class="text:xl font:semibold text:care-text-primary mb:2">チャットを選択してください</h2>
          <p class="text:care-text-secondary">左側のリストからチャットルームを選択するか、新規作成してください</p>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- チャットルーム作成モーダル -->
<Modal
  bind:isOpen={isCreateRoomModalOpen}
  title="新しいチャットルーム"
  size="md"
  onClose={() => isCreateRoomModalOpen = false}
  data-testid="create-chat-room-modal"
>
  <div class="space-y:4">
    <div>
      <label for="user-id" class="block text:sm font:medium text:care-text-primary mb:1">
        利用者ID
      </label>
      <input
        id="user-id"
        type="text"
        bind:value={newRoomUserId}
        placeholder="例: user_001"
        class="w:full px:3 py:2 border:care-gray-300 r:24px focus:border:care-primary-500 focus:ring:care-primary-500"
        data-testid="new-room-user-id"
      />
    </div>
    
    <div>
      <label for="user-name" class="block text:sm font:medium text:care-text-primary mb:1">
        利用者名
      </label>
      <input
        id="user-name"
        type="text"
        bind:value={newRoomUserName}
        placeholder="例: 山田 花子"
        class="w:full px:3 py:2 border:care-gray-300 r:24px focus:border:care-primary-500 focus:ring:care-primary-500"
        data-testid="new-room-user-name"
      />
    </div>
  </div>

  {#snippet footer()}
    <div class="flex jc:end space-x:3">
      <Button
        variant="outline"
        onclick={() => isCreateRoomModalOpen = false}
        data-testid="cancel-create-room"
      >
        キャンセル
      </Button>
      <Button
        variant="primary"
        onclick={createChatRoom}
        disabled={!newRoomUserId.trim() || !newRoomUserName.trim()}
        data-testid="confirm-create-room"
      >
        作成
      </Button>
    </div>
  {/snippet}
</Modal>