<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: (event: MouseEvent) => void;
    children: Snippet;
    class?: string;
    'data-testid'?: string;
  }

  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    onclick,
    children,
    class: className = '',
    'data-testid': testId,
    ...restProps
  }: Props = $props();

  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  // Variant classes
  const variantClasses = {
    primary: 'bg:care-primary-600 text:care-text-inverse hover:bg:care-primary-700 focus:ring:care-primary-500',
    secondary: 'bg:care-secondary-600 text:care-text-inverse hover:bg:care-secondary-700 focus:ring:care-secondary-500',
    outline: 'border:1|solid|care-primary-600 text:care-primary-600 hover:bg:care-primary-50 focus:ring:care-primary-500',
    ghost: 'text:care-primary-600 hover:bg:care-primary-50 focus:ring:care-primary-500',
    danger: 'bg:care-accent-error-600 text:care-text-inverse hover:bg:care-accent-error-700 focus:ring:care-accent-error-500'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px:3 py:1.5 text:sm r:16px',
    md: 'px:4 py:2 text:base r:24px',
    lg: 'px:6 py:3 text:lg r:8px'
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
</script>

<button
  {type}
  {disabled}
  class={buttonClasses}
  data-testid={testId}
  onclick={onclick}
  {...restProps}
>
  {#if loading}
    <svg class="animate:spin -ml:1 mr:2 h:4 w:4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  {/if}
  {@render children()}
</button>