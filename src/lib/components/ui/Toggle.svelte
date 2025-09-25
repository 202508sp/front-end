<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    checked: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
    onchange?: (checked: boolean) => void;
    children?: Snippet;
    class?: string;
    'data-testid'?: string;
  }

  let {
    checked = $bindable(),
    disabled = false,
    size = 'md',
    label,
    description,
    onchange,
    children,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // Size classes
  const sizeClasses = {
    sm: {
      switch: 'w:8 h:5',
      thumb: 'w:3 h:3',
      translate: 'translate-x:3'
    },
    md: {
      switch: 'w:11 h:6',
      thumb: 'w:4 h:4',
      translate: 'translate-x:5'
    },
    lg: {
      switch: 'w:14 h:7',
      thumb: 'w:5 h:5',
      translate: 'translate-x:7'
    }
  };

  const currentSize = sizeClasses[size];

  function handleToggle() {
    if (!disabled) {
      checked = !checked;
      onchange?.(checked);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      handleToggle();
    }
  }

  // Switch classes
  const switchClasses = `
    relative inline-flex ${currentSize.switch} rounded:full transition-colors duration:200 ease-in-out
    ${checked 
      ? 'bg:care-primary-600' 
      : 'bg:care-gray-200'
    }
    ${disabled 
      ? 'opacity:50 cursor-not-allowed' 
      : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:ring-offset:2'
    }
  `;

  // Thumb classes
  const thumbClasses = `
    inline-block ${currentSize.thumb} rounded:full bg:white shadow:md transform transition-transform duration:200 ease-in-out
    ${checked ? currentSize.translate : 'translate-x:1'}
  `;
</script>

<div class="flex items-start gap:3 {className}" data-testid={testId}>
  <!-- Toggle Switch -->
  <button
    type="button"
    class={switchClasses}
    role="switch"
    aria-checked={checked}
    aria-disabled={disabled}
    {disabled}
    onclick={handleToggle}
    onkeydown={handleKeydown}
  >
    <span class={thumbClasses}></span>
  </button>

  <!-- Label and Description -->
  {#if label || description || children}
    <div class="flex-1">
      {#if label}
        <div class="text:sm font:medium text:care-text-primary">
          {label}
        </div>
      {/if}
      {#if description}
        <div class="text:xs text:care-text-secondary mt:1">
          {description}
        </div>
      {/if}
      {#if children}
        <div class="mt:2">
          {@render children()}
        </div>
      {/if}
    </div>
  {/if}
</div>