<script lang="ts">
  import type { ChatMessage } from '$lib/types/chat.js';
  import { onMount } from 'svelte';
  import { formatDistanceToNow } from 'date-fns';
  import { ja } from 'date-fns/locale';

  interface Props {
    messages: ChatMessage[];
    currentUserId: string;
    isStaffView?: boolean;
    isLoading?: boolean;
    onLoadMoreMessages?: () => Promise<void>;
    onMarkAsRead?: (messageIds: string[]) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    messages = [],
    currentUserId,
    isStaffView = true,
    isLoading = false,
    onLoadMoreMessages,
    onMarkAsRead,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  let messagesContainer: HTMLDivElement;
  let isAtBottom = $state(true);
  let unreadMessageIds = $state<string[]>([]);

  // Virtual scrolling state
  let containerHeight = $state(0);
  let scrollTop = $state(0);
  const itemHeight = 80; // Approximate height per message
  const overscan = 5; // Number of items to render outside visible area

  // Calculate visible range for virtual scrolling
  const visibleRange = $derived(() => {
    if (containerHeight === 0) return { start: 0, end: messages.length };
    
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(messages.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  });

  // Get visible messages for virtual scrolling
  const visibleMessages = $derived(() => {
    const range = visibleRange();
    return messages.slice(range.start, range.end).map((message, index) => ({
      ...message,
      virtualIndex: range.start + index
    }));
  });

  // Group messages by date
  const groupedMessages = $derived(() => {
    const visibleMsgs = visibleMessages();
    const groups: { date: string; messages: typeof visibleMsgs }[] = [];
    let currentDate = '';
    let currentGroup: typeof visibleMsgs = [];

    for (const message of visibleMsgs) {
      const messageDate = new Date(message.timestamp).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  });

  // Check if message is from current user
  function isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === currentUserId;
  }

  // Format message timestamp
  function formatMessageTime(timestamp: Date): string {
    return formatDistanceToNow(new Date(timestamp), { 
      addSuffix: true, 
      locale: ja 
    });
  }

  // Format date header
  function formatDateHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Handle scroll events
  function handleScroll(event: Event) {
    const target = event.target as HTMLDivElement;
    scrollTop = target.scrollTop;
    
    // Check if at bottom
    const threshold = 50;
    isAtBottom = target.scrollHeight - target.scrollTop - target.clientHeight < threshold;

    // Load more messages when scrolled to top
    if (target.scrollTop < 100 && onLoadMoreMessages && !isLoading) {
      onLoadMoreMessages();
    }

    // Mark visible unread messages as read
    if (onMarkAsRead && unreadMessageIds.length > 0) {
      const visibleUnreadIds = unreadMessageIds.filter(id => 
        visibleMessages().some((msg: any) => msg.id === id)
      );
      
      if (visibleUnreadIds.length > 0) {
        onMarkAsRead(visibleUnreadIds);
        unreadMessageIds = unreadMessageIds.filter(id => !visibleUnreadIds.includes(id));
      }
    }
  }

  // Scroll to bottom
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Handle new messages
  $effect(() => {
    // Track unread messages
    const newUnreadIds = messages
      .filter(msg => !msg.isRead && msg.senderId !== currentUserId)
      .map(msg => msg.id);
    
    unreadMessageIds = newUnreadIds;

    // Auto-scroll to bottom for new messages if already at bottom
    if (isAtBottom) {
      setTimeout(scrollToBottom, 100);
    }
  });

  onMount(() => {
    scrollToBottom();
    
    // Set up resize observer for container height
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerHeight = entry.contentRect.height;
      }
    });

    if (messagesContainer) {
      resizeObserver.observe(messagesContainer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  });
</script>

<div
  bind:this={messagesContainer}
  class="flex-1 overflow-y:auto p:4 space-y:4 {className}"
  data-testid={testId}
  onscroll={handleScroll}
  style="height: 100%;"
>
  {#if isLoading && messages.length === 0}
    <div class="flex ai:center jc:center h:full">
      <div class="animate:spin w:8 h:8 border:2|solid|care-primary-600 border-t:transparent r:9999px"></div>
    </div>
  {:else if messages.length === 0}
    <div class="flex ai:center jc:center h:full text:care-text-secondary">
      <div class="text-center">
        <svg class="w:12 h:12 mx:auto mb:4 text:care-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p>まだメッセージがありません</p>
        <p class="text:sm mt:1">最初のメッセージを送信してください</p>
      </div>
    </div>
  {:else}
    <!-- Virtual scrolling spacer for items above visible range -->
    {#if visibleRange().start > 0}
      <div style="height: {visibleRange().start * itemHeight}px;"></div>
    {/if}

    <!-- Load more indicator -->
    {#if isLoading && messages.length > 0}
      <div class="flex jc:center py:2">
        <div class="animate:spin w:6 h:6 border:2|solid|care-primary-600 border-t:transparent r:9999px"></div>
      </div>
    {/if}

    <!-- Message groups -->
    {#each groupedMessages() as group}
      <!-- Date header -->
      <div class="flex jc:center my:4">
        <div class="bg:care-gray-100 text:care-text-secondary text:sm px:3 py:1 r:9999px">
          {formatDateHeader(group.date)}
        </div>
      </div>

      <!-- Messages in group -->
      {#each group.messages as message}
        <div
          class="flex {isOwnMessage(message) ? 'jc:end' : 'justify-start'}"
          style="transform: translateY({message.virtualIndex * itemHeight - visibleRange().start * itemHeight}px);"
        >
          <div class="max-w:70% {isOwnMessage(message) ? 'order-2' : 'order-1'}">
            <!-- Message bubble -->
            <div
              class="r:6px px:4 py:2 {isOwnMessage(message) 
                ? 'bg:care-primary-600 text:care-text-inverse' 
                : 'bg:care-background-secondary text:care-text-primary'
              } {message.isDeleted ? 'opacity:50 italic' : ''}"
            >
              {#if !isOwnMessage(message)}
                <div class="text:xs font:medium mb:1 text:care-text-secondary">
                  {message.senderName}
                  {#if message.senderType === 'staff'}
                    <span class="bg:care-accent-info-100 text:care-accent-info-700 px:1.5 py:0.5 r:16px text:xs ml:1">
                      職員
                    </span>
                  {:else if message.senderType === 'family'}
                    <span class="bg:care-accent-warning-100 text:care-accent-warning-700 px:1.5 py:0.5 r:16px text:xs ml:1">
                      家族
                    </span>
                  {/if}
                </div>
              {/if}

              {#if message.isDeleted}
                <span class="text:care-text-disabled">このメッセージは削除されました</span>
              {:else}
                <div class="whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                <!-- Attachments -->
                {#if message.attachments.length > 0}
                  <div class="mt:2 space-y:1">
                    {#each message.attachments as attachment}
                      <div class="flex ai:center space-x:2 p:2 bg:black/10 r:24px">
                        <svg class="w:4 h:4 flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text:sm underline hover:no-underline truncate"
                        >
                          {attachment.name}
                        </a>
                        <span class="text:xs opacity:70">
                          ({Math.round(attachment.size / 1024)}KB)
                        </span>
                      </div>
                    {/each}
                  </div>
                {/if}
              {/if}
            </div>

            <!-- Message metadata -->
            <div class="flex ai:center space-x:2 mt:1 {isOwnMessage(message) ? 'jc:end' : 'justify-start'}">
              <span class="text:xs text:care-text-secondary">
                {formatMessageTime(message.timestamp)}
              </span>
              
              {#if message.isEdited}
                <span class="text:xs text:care-text-secondary">(編集済み)</span>
              {/if}

              {#if isOwnMessage(message)}
                <div class="flex ai:center space-x:1">
                  {#if message.readBy.length > 1}
                    <svg class="w:3 h:3 text:care-accent-success-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <span class="text:xs text:care-accent-success-600">既読</span>
                  {:else}
                    <svg class="w:3 h:3 text:care-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/each}

    <!-- Virtual scrolling spacer for items below visible range -->
    {#if visibleRange().end < messages.length}
      <div style="height: {(messages.length - visibleRange().end) * itemHeight}px;"></div>
    {/if}
  {/if}

  <!-- Scroll to bottom button -->
  {#if !isAtBottom && messages.length > 0}
    <button
      class="fixed bottom:20 right:20 bg:care-primary-600 text:care-text-inverse p:3 r:9999px shadow:lg hover:bg:care-primary-700 transition-colors z:10"
      onclick={scrollToBottom}
      aria-label="最新メッセージに移動"
    >
      <svg class="w:5 h:5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  {/if}
</div>