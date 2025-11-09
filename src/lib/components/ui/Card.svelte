<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'default' | 'outlined' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    clickable?: boolean;
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
    class?: string;
    'data-testid'?: string;
  }

  let {
    variant = 'default',
    padding = 'md',
    clickable = false,
    onclick,
    children,
    header,
    footer,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // Base classes
  const baseClasses = 'bg:care-background-primary r:8px transition-all';

  // Variant classes
  const variantClasses = {
    default: 'border:1|solid|care-gray-200',
    outlined: 'border:2|solid|care-primary-200',
    elevated: 'shadow:lg border:1|solid|care-gray-100'
  };

  // Padding classes
  const paddingClasses = {
    none: '',
    sm: 'p:4',
    md: 'p:6',
    lg: 'p:8'
  };

  // Clickable classes
  const clickableClasses = clickable 
    ? 'cursor-pointer hover:shadow:md hover:border:care-primary-300 focus:outline-none focus:ring-2 focus:ring:care-primary-500 focus:ring-offset:2'
    : '';

  const cardClasses = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${clickableClasses} ${className}`;

  function handleClick(event: MouseEvent) {
    if (clickable && onclick) {
      onclick(event);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (clickable && onclick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onclick(event as any);
    }
  }
</script>

<div
  class={cardClasses}
  data-testid={testId}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  {#if header}
    <div class="border-b:1|solid|care-gray-200 pb:4 mb:4">
      {@render header()}
    </div>
  {/if}

  <div class={padding === 'none' && (header || footer) ? 'px:6' : ''}>
    {@render children()}
  </div>

  {#if footer}
    <div class="border-t:1|solid|care-gray-200 pt:4 mt:4">
      {@render footer()}
    </div>
  {/if}
</div>