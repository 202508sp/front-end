<script lang="ts">
	import { type FullAutoFill } from "svelte/elements";

  interface Props {
    type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
    value?: string | number;
    placeholder?: string;
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    min?: number;
    max?: number;
    step?: number;
    pattern?: string;
    autocomplete?: FullAutoFill | null | undefined;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'error';
    oninput?: (event: Event) => void;
    onchange?: (event: Event) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
    class?: string;
    'data-testid'?: string;
  }

  let {
    type = 'text',
    value = $bindable(),
    placeholder,
    disabled = false,
    readonly = false,
    required = false,
    min,
    max,
    step,
    pattern,
    autocomplete,
    size = 'md',
    variant = 'default',
    oninput,
    onchange,
    onfocus,
    onblur,
    class: className = '',
    'data-testid': testId,
    ...restProps
  }: Props = $props();

  // Base classes
  const baseClasses = 'block w:full rounded:lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset:1';

  // Size classes
  const sizeClasses = {
    sm: 'px:3 py:2 text:sm',
    md: 'px:4 py:2.5 text:base',
    lg: 'px:5 py:3 text:lg'
  };

  // Variant classes
  const variantClasses = {
    default: 'border:care-gray-300 focus:border:care-primary-500 focus:ring:care-primary-500',
    error: 'border:care-accent-error-300 focus:border:care-accent-error-500 focus:ring:care-accent-error-500'
  };

  // State classes
  const stateClasses = disabled 
    ? 'bg:care-gray-50 text:care-text-disabled cursor-not-allowed'
    : readonly
    ? 'bg:care-background-secondary text:care-text-secondary'
    : 'bg:care-background-primary text:care-text-primary';

  const inputClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses} ${className}`;
</script>

<input
  {type}
  bind:value
  {placeholder}
  {disabled}
  {readonly}
  {required}
  {min}
  {max}
  {step}
  {pattern}
  {autocomplete}
  class={inputClasses}
  data-testid={testId}
  oninput={oninput}
  onchange={onchange}
  onfocus={onfocus}
  onblur={onblur}
  {...restProps}
/>