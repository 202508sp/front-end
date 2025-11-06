<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { ChatRoom, ChatMessage, Participant } from '$lib/types/chat.js';
  import MessageList from './MessageList.svelte';
  import MessageInput from './MessageInput.svelte';
  import Button from '$lib/components/ui/Button.svelte';

  interface Props {
    chatRoom: ChatRoom;
    messages: ChatMessage[];
    currentUserId: string;
    isStaffView?: boolean;
    isLoading?: boolean;
    onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
    onLoadMoreMessages?: () => Promise<void>;
    onMarkAsRead?: (messageIds: string[]) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    chatRoom,
    messages = [],
    currentUserId,
    isStaffView = true,
    isLoading = false,
    onSendMessage,
    onLoadMoreMessages,
    onMarkAsRead,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // Get online participants
  const onlineParticipants = $derived(
    chatRoom.participants.filter(p => p.isOnline && p.id !== currentUserId)
  );

  // Get current user participant info
  const currentUser = $derived(
    chatRoom.participants.find(p => p.id === currentUserId)
  );

  // Handle message send
  async function handleSendMessage(content: string, attachments?: File[]) {
    try {
      await onSendMessage(content, attachments);
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast
    }
  }

  // Handle marking messages as read
  function handleMarkAsRead(messageIds: string[]) {
    if (onMarkAsRead) {
      onMarkAsRead(messageIds);
    }
  }
</script>

<div
  class="flex flex-col h:full bg:care-background-primary r:8px shadow:lg overflow:hidden {className}"
  data-testid={testId}
>
  <!-- Chat Header -->
  <div class="flex items-center justify-between p:4 border-b:1|solid|care-gray-200 bg:care-background-secondary">
    <div class="flex items-center space-x:3">
      <div class="flex items-center space-x:2">
        <div class="w:3 h:3 r:9999px bg:care-accent-success-500" title="オンライン"></div>
        <h3 class="font:semibold text:care-text-primary">{chatRoom.name}</h3>
      </div>
      
      {#if onlineParticipants.length > 0}
        <div class="text:sm text:care-text-secondary">
          {onlineParticipants.length}人がオンライン
        </div>
      {/if}
    </div>

    <div class="flex items-center space-x:2">
      <!-- Participants indicator -->
      <div class="flex -space-x:1">
        {#each chatRoom.participants.slice(0, 3) as participant}
          <div
            class="w:8 h:8 r:9999px bg:care-primary-100 border:2|solid|care-background-primary flex items-center justify-center text:xs font:medium text:care-primary-700"
            title={participant.name}
          >
            {participant.name.charAt(0)}
          </div>
        {/each}
        {#if chatRoom.participants.length > 3}
          <div class="w:8 h:8 r:9999px bg:care-gray-100 border:2|solid|care-background-primary flex items-center justify-center text:xs font:medium text:care-gray-600">
            +{chatRoom.participants.length - 3}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Messages Area -->
  <div class="flex-1 overflow:hidden">
    <MessageList
      {messages}
      {currentUserId}
      {isStaffView}
      {isLoading}
      {onLoadMoreMessages}
      onMarkAsRead={handleMarkAsRead}
    />
  </div>

  <!-- Message Input -->
  <div class="border-t:1|solid|care-gray-200 bg:care-background-secondary">
    <MessageInput
      onSendMessage={handleSendMessage}
      disabled={isLoading}
      placeholder="メッセージを入力..."
    />
  </div>
</div>