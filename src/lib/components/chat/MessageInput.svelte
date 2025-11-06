<script lang="ts">
  import Button from '$lib/components/ui/Button.svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    onSendMessage: (content: string, attachments?: File[]) => Promise<void>;
    disabled?: boolean;
    placeholder?: string;
    maxLength?: number;
    allowAttachments?: boolean;
    maxAttachments?: number;
    maxAttachmentSize?: number; // in bytes
    class?: string;
    'data-testid'?: string;
  }

  let {
    onSendMessage,
    disabled = false,
    placeholder = 'メッセージを入力...',
    maxLength = 1000,
    allowAttachments = true,
    maxAttachments = 5,
    maxAttachmentSize = 10 * 1024 * 1024, // 10MB
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    focus: void;
    blur: void;
    typing: { isTyping: boolean };
  }>();

  let messageContent = $state('');
  let attachments = $state<File[]>([]);
  let isSubmitting = $state(false);
  let fileInput = $state<HTMLInputElement>();
  let textArea = $state<HTMLTextAreaElement>();
  let typingTimer: ReturnType<typeof setTimeout>;

  // Character count
  const remainingChars = $derived(maxLength - messageContent.length);
  const isOverLimit = $derived(remainingChars < 0);

  // Check if can send message
  const canSend = $derived(
    !disabled && 
    !isSubmitting && 
    !isOverLimit && 
    (messageContent.trim().length > 0 || attachments.length > 0)
  );

  // Handle message input
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    messageContent = target.value;

    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';

    // Handle typing indicator
    dispatch('typing', { isTyping: messageContent.trim().length > 0 });
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      dispatch('typing', { isTyping: false });
    }, 1000);
  }

  // Handle key press
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  // Handle file selection
  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxAttachmentSize) {
        alert(`ファイル "${file.name}" は最大サイズ（${Math.round(maxAttachmentSize / 1024 / 1024)}MB）を超えています。`);
        return false;
      }
      return true;
    });

    // Check total attachment limit
    const totalAttachments = attachments.length + validFiles.length;
    if (totalAttachments > maxAttachments) {
      alert(`添付ファイルは最大${maxAttachments}個までです。`);
      return;
    }

    attachments = [...attachments, ...validFiles];
    
    // Reset file input
    target.value = '';
  }

  // Remove attachment
  function removeAttachment(index: number) {
    attachments = attachments.filter((_, i) => i !== index);
  }

  // Handle send message
  async function handleSend() {
    if (!canSend) return;

    const content = messageContent.trim();
    if (!content && attachments.length === 0) return;

    isSubmitting = true;
    
    try {
      await onSendMessage(content, attachments.length > 0 ? attachments : undefined);
      
      // Clear input
      messageContent = '';
      attachments = [];
      
      // Reset textarea height
      if (textArea) {
        textArea.style.height = 'auto';
      }
      
      // Clear typing indicator
      dispatch('typing', { isTyping: false });
      clearTimeout(typingTimer);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error message
    } finally {
      isSubmitting = false;
    }
  }

  // Handle focus events
  function handleFocus() {
    dispatch('focus');
  }

  function handleBlur() {
    dispatch('blur');
    dispatch('typing', { isTyping: false });
    clearTimeout(typingTimer);
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
</script>

<div class="p:4 {className}" data-testid={testId}>
  <!-- Attachments preview -->
  {#if attachments.length > 0}
    <div class="mb:3 space-y:2">
      <div class="text:sm font:medium text:care-text-secondary">添付ファイル ({attachments.length})</div>
      <div class="flex flex-wrap gap:2">
        {#each attachments as file, index}
          <div class="flex items-center space-x:2 bg:care-background-secondary r:24px px:3 py:2 text:sm">
            <svg class="w:4 h:4 text:care-text-secondary flex-shrink:0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span class="truncate max-w:32">{file.name}</span>
            <span class="text:care-text-secondary">({formatFileSize(file.size)})</span>
            <button
              type="button"
              class="text:care-accent-error-500 hover:text:care-accent-error-700 ml:1"
              onclick={() => removeAttachment(index)}
              aria-label="ファイルを削除"
            >
              <svg class="w:4 h:4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Input area -->
  <div class="flex items-end space-x:3">
    <!-- File attachment button -->
    {#if allowAttachments}
      <button
        type="button"
        class="flex-shrink:0 p:2 text:care-text-secondary hover:text:care-primary-600 hover:bg:care-primary-50 r:24px transition-colors {disabled ? 'opacity:50 cursor-not-allowed' : ''}"
        onclick={() => fileInput?.click()}
        {disabled}
        title="ファイルを添付"
        aria-label="ファイルを添付"
      >
        <svg class="w:5 h:5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>

      <!-- Hidden file input -->
      <input
        bind:this={fileInput}
        type="file"
        multiple
        class="hidden"
        onchange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
    {/if}

    <!-- Message input -->
    <div class="flex-1 relative">
      <textarea
        bind:this={textArea}
        bind:value={messageContent}
        {placeholder}
        {disabled}
        class="w:full resize:none r:24px border:care-gray-300 focus:border:care-primary-500 focus:ring:care-primary-500 px:4 py:2.5 text:base transition-colors {isOverLimit ? 'border:care-accent-error-500 focus:border:care-accent-error-500 focus:ring:care-accent-error-500' : ''} {disabled ? 'bg:care-gray-50 cursor-not-allowed' : ''}"
        style="min-height: 44px; max-height: 120px;"
        oninput={handleInput}
        onkeypress={handleKeyPress}
        onfocus={handleFocus}
        onblur={handleBlur}
        rows="1"
      ></textarea>

      <!-- Character count -->
      {#if maxLength}
        <div class="absolute bottom:1 right:2 text:xs {isOverLimit ? 'text:care-accent-error-500' : 'text:care-text-secondary'}">
          {remainingChars}
        </div>
      {/if}
    </div>

    <!-- Send button -->
    <Button
      variant="primary"
      size="md"
      disabled={!canSend}
      loading={isSubmitting}
      onclick={handleSend}
      class="flex-shrink:0"
    >
      {#if isSubmitting}
        送信中...
      {:else}
        <svg class="w:5 h:5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      {/if}
    </Button>
  </div>

  <!-- Input hints -->
  {#if !disabled}
    <div class="mt:2 text:xs text:care-text-secondary">
      Enterで送信、Shift+Enterで改行
      {#if allowAttachments}
        • ファイル添付可能（最大{maxAttachments}個、{Math.round(maxAttachmentSize / 1024 / 1024)}MBまで）
      {/if}
    </div>
  {/if}
</div>