<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { StatCard as StatCardType } from '$lib/types/statistics';

  interface Props {
    card: StatCardType;
    onclick?: () => void;
    class?: string;
  }

  let { card, onclick, class: className = '' }: Props = $props();

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'material-symbols:trending-up';
      case 'decrease':
        return 'material-symbols:trending-down';
      default:
        return 'material-symbols:trending-flat';
    }
  };

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text:green-600';
      case 'decrease':
        return 'text:red-600';
      default:
        return 'text:gray-500';
    }
  };

  const formatValue = (value: number | string): string => {
    if (typeof value === 'number') {
      return value.toLocaleString('ja-JP');
    }
    return value;
  };

  const formatChange = (change?: number): string => {
    if (change === undefined) return '';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const handleKeydown = (e: KeyboardEvent) => {
    if (onclick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onclick();
    }
  };
</script>

{#if onclick}
  <button
    class={`stat-card clickable ${className}`}
    onclick={onclick}
    onkeydown={handleKeydown}
    type="button"
  >
    <!-- Header -->
    <div class="stat-card-header">
      <div class="icon-container" style="background-color: {card.color}20;">
        <Icon icon={card.icon} class="icon" style="color: {card.color};" />
      </div>
      <div class="title-container">
        <h3 class="title">{card.title}</h3>
        {#if card.description}
          <p class="description">{card.description}</p>
        {/if}
      </div>
    </div>

    <!-- Value -->
    <div class="stat-value">
      <span class="value">{formatValue(card.value)}</span>
      {#if card.unit}
        <span class="unit">{card.unit}</span>
      {/if}
    </div>

    <!-- Change Indicator -->
    {#if card.change !== undefined}
      <div class="change-indicator {getChangeColor(card.changeType)}">
        <Icon icon={getChangeIcon(card.changeType)} class="change-icon" />
        <span class="change-text">{formatChange(card.change)}</span>
        <span class="change-label">前期比</span>
      </div>
    {/if}
  </button>
{:else}
  <div class={`stat-card ${className}`}>
    <!-- Header -->
    <div class="stat-card-header">
      <div class="icon-container" style="background-color: {card.color}20;">
        <Icon icon={card.icon} class="icon" style="color: {card.color};" />
      </div>
      <div class="title-container">
        <h3 class="title">{card.title}</h3>
        {#if card.description}
          <p class="description">{card.description}</p>
        {/if}
      </div>
    </div>

    <!-- Value -->
    <div class="stat-value">
      <span class="value">{formatValue(card.value)}</span>
      {#if card.unit}
        <span class="unit">{card.unit}</span>
      {/if}
    </div>

    <!-- Change Indicator -->
    {#if card.change !== undefined}
      <div class="change-indicator {getChangeColor(card.changeType)}">
        <Icon icon={getChangeIcon(card.changeType)} class="change-icon" />
        <span class="change-text">{formatChange(card.change)}</span>
        <span class="change-label">前期比</span>
      </div>
    {/if}
  </div>
{/if}

<style>
  .stat-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    width: 100%;
    text-align: left;
  }

  .stat-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .stat-card.clickable {
    cursor: pointer;
  }

  .stat-card.clickable:hover {
    transform: translateY(-2px);
    border-color: #d1d5db;
  }

  .stat-card.clickable:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }

  .stat-card-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 16px;
  }

  .icon-container {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icon {
    width: 24px;
    height: 24px;
  }

  .title-container {
    flex: 1;
    min-width: 0;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .description {
    font-size: 12px;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }

  .stat-value {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 12px;
  }

  .value {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    line-height: 1.2;
  }

  .unit {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
  }

  .change-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .change-icon {
    width: 16px;
    height: 16px;
  }

  .change-text {
    font-weight: 600;
  }

  .change-label {
    color: #6b7280;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .stat-card {
      padding: 16px;
    }

    .stat-card-header {
      gap: 10px;
      margin-bottom: 12px;
    }

    .icon-container {
      width: 40px;
      height: 40px;
    }

    .icon {
      width: 20px;
      height: 20px;
    }

    .title {
      font-size: 13px;
    }

    .value {
      font-size: 24px;
    }
  }
</style>