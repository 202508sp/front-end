<script lang="ts">
  import type { Snippet } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    closable?: boolean;
    children: Snippet;
    footer?: Snippet;
    class?: string;
    'data-testid'?: string;
  }

  let {
    isOpen = $bindable(),
    onClose,
    title,
    size = 'md',
    closable = true,
    children,
    footer,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  const dispatch = createEventDispatcher<{
    close: void;
    open: void;
  }>();

  // Size classes
  const sizeClasses = {
    sm: 'max-w:md',
    md: 'max-w:lg',
    lg: 'max-w:2xl',
    xl: 'max-w:4xl',
    full: 'max-w:full mx:4'
  };

  function handleClose() {
    if (closable) {
      isOpen = false;
      dispatch('close');
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && closable) {
      handleClose();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget && closable) {
      handleClose();
    }
  }

  $effect(() => {
    if (isOpen) {
      dispatch('open');
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  });
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset:0 z:modal flex items-center justify-center p:4"
    data-testid={testId}
    role="dialog"
    aria-modal="true"
    aria-labelledby={title ? 'modal-title' : undefined}
  >
    <!-- Backdrop -->
    <div
      class="absolute inset:0 bg:care-background-overlay animate:fade-in"
      onclick={handleBackdropClick}
    ></div>

    <!-- Modal Content -->
    <div
      class="relative bg:care-background-primary r:6px shadow:2xl w:full {sizeClasses[size]} max-h:90vh overflow:hidden animate:scale-in {className}"
    >
      <!-- Header -->
      {#if title || closable}
        <div class="flex items-center justify-between p:6 border-b:1|solid|care-gray-200">
          {#if title}
            <h2 id="modal-title" class="text:xl font:semibold text:care-text-primary">
              {title}
            </h2>
          {/if}
          {#if closable}
            <button
              type="button"
              class="text:care-gray-400 hover:text:care-gray-600 transition-colors p:1 r:16px hover:bg:care-gray-100"
              onclick={handleClose}
              aria-label="モーダルを閉じる"
            >
              <svg class="w:6 h:6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}

      <!-- Body -->
      <div class="p:6 overflow-y:auto max-h:70vh">
        {@render children()}
      </div>

      <!-- Footer -->
      {#if footer}
        <div class="border-t:1|solid|care-gray-200 p:6 bg:care-background-secondary">
          {@render footer()}
        </div>
      {/if}
    </div>
  </div>
{/if}