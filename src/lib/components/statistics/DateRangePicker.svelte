<script lang="ts">
  import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
  import { ja } from 'date-fns/locale';
  import type { DateRange, StatPeriod } from '$lib/types/statistics';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';

  interface Props {
    value: DateRange;
    period?: StatPeriod;
    onchange?: (range: DateRange) => void;
    onperiodchange?: (period: StatPeriod) => void;
    class?: string;
  }

  let {
    value,
    period = 'today',
    onchange,
    onperiodchange,
    class: className = ''
  }: Props = $props();

  let isCustomMode = $state(period === 'custom');
  let startDateInput = $state('');
  let endDateInput = $state('');

  const periodOptions: { value: StatPeriod; label: string }[] = [
    { value: 'today', label: '今日' },
    { value: 'week', label: '今週' },
    { value: 'month', label: '今月' },
    { value: 'quarter', label: '四半期' },
    { value: 'year', label: '今年' },
    { value: 'custom', label: 'カスタム' }
  ];

  const getPredefinedRange = (selectedPeriod: StatPeriod): DateRange => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return {
          start: startOfDay(now),
          end: endOfDay(now)
        };
      case 'week':
        return {
          start: startOfWeek(now, { locale: ja }),
          end: endOfWeek(now, { locale: ja })
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        };
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);
        return {
          start: quarterStart,
          end: quarterEnd
        };
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        };
      default:
        return value;
    }
  };

  const handlePeriodChange = (selectedPeriod: StatPeriod) => {
    period = selectedPeriod;
    isCustomMode = selectedPeriod === 'custom';
    
    if (selectedPeriod !== 'custom') {
      const newRange = getPredefinedRange(selectedPeriod);
      onchange?.(newRange);
    }
    
    onperiodchange?.(selectedPeriod);
  };

  const handleCustomDateChange = () => {
    if (!startDateInput || !endDateInput) return;
    
    const start = new Date(startDateInput);
    const end = new Date(endDateInput);
    
    if (start <= end) {
      const newRange: DateRange = {
        start: startOfDay(start),
        end: endOfDay(end)
      };
      onchange?.(newRange);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const formatDisplayDate = (date: Date): string => {
    return format(date, 'yyyy年MM月dd日', { locale: ja });
  };

  // Initialize custom date inputs when switching to custom mode
  $effect(() => {
    if (isCustomMode && value) {
      startDateInput = formatDateForInput(value.start);
      endDateInput = formatDateForInput(value.end);
    }
  });

  // Quick preset buttons
  const quickPresets = [
    { label: '過去7日', days: 7 },
    { label: '過去30日', days: 30 },
    { label: '過去90日', days: 90 }
  ];

  const applyQuickPreset = (days: number) => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(end, days - 1));
    
    const newRange: DateRange = { start, end };
    onchange?.(newRange);
    
    // Update custom inputs
    startDateInput = formatDateForInput(start);
    endDateInput = formatDateForInput(end);
  };
</script>

<div class={`date-range-picker ${className}`}>
  <!-- Period Selection -->
  <div class="period-selector mb:16px">
    <div class="block text:14px font:600 mb:8px text:gray-700">期間選択</div>
    <div class="flex flex-wrap gap:8px">
      {#each periodOptions as option}
        <Button
          variant={period === option.value ? 'primary' : 'secondary'}
          size="sm"
          onclick={() => handlePeriodChange(option.value)}
        >
          {option.label}
        </Button>
      {/each}
    </div>
  </div>

  <!-- Custom Date Range -->
  {#if isCustomMode}
    <div class="custom-range mb:16px">
      <div class="grid grid-cols:1 md:grid-cols:2 gap:12px">
        <FormField label="開始日">
          <input
            type="date"
            bind:value={startDateInput}
            onchange={handleCustomDateChange}
            class="w:full p:8px border:1px border:gray-300 rounded:6px focus:border:blue-500 focus:outline:none"
            id="start-date-input"
          />
        </FormField>
        
        <FormField label="終了日">
          <input
            type="date"
            bind:value={endDateInput}
            onchange={handleCustomDateChange}
            class="w:full p:8px border:1px border:gray-300 rounded:6px focus:border:blue-500 focus:outline:none"
            id="end-date-input"
          />
        </FormField>
      </div>

      <!-- Quick Presets -->
      <div class="quick-presets mt:12px">
        <div class="block text:12px font:500 mb:6px text:gray-600">クイック選択</div>
        <div class="flex flex-wrap gap:6px">
          {#each quickPresets as preset}
            <Button
              variant="outline"
              size="sm"
              onclick={() => applyQuickPreset(preset.days)}
            >
              {preset.label}
            </Button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  <!-- Current Selection Display -->
  {#if value}
    <div class="current-selection p:12px bg:gray-50 rounded:6px">
      <div class="text:12px font:500 text:gray-600 mb:4px">選択中の期間</div>
      <div class="text:14px font:600 text:gray-800">
        {formatDisplayDate(value.start)} ～ {formatDisplayDate(value.end)}
      </div>
    </div>
  {/if}
</div>

