<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label?: string;
    description?: string;
    error?: string;
    required?: boolean;
    disabled?: boolean;
    children: Snippet;
    class?: string;
    'data-testid'?: string;
  }

  let {
    label,
    description,
    error,
    required = false,
    disabled = false,
    children,
    class: className = '',
    'data-testid': testId
  }: Props = $props();

  // Generate unique ID for accessibility
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
</script>

<div class="space-y:2 {className}" data-testid={testId}>
  <!-- Label -->
  {#if label}
    <label 
      for={fieldId}
      class="block text:sm font:medium text:care-text-primary {disabled ? 'opacity:50' : ''}"
    >
      {label}
      {#if required}
        <span class="text:care-accent-error-500 ml:1">*</span>
      {/if}
    </label>
  {/if}

  <!-- Description -->
  {#if description}
    <p 
      id={descriptionId}
      class="text:xs text:care-text-secondary {disabled ? 'opacity:50' : ''}"
    >
      {description}
    </p>
  {/if}

  <!-- Input Field -->
  <div class="relative">
    {@render children()}
  </div>

  <!-- Error Message -->
  {#if error}
    <p 
      id={errorId}
      class="text:xs text:care-accent-error-600 flex ai:center gap:1"
      role="alert"
    >
      <svg class="w:3 h:3 flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      {error}
    </p>
  {/if}
</div>
