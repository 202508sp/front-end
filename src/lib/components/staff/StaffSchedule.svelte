<script lang="ts">
  import type { Staff, WorkSchedule, ShiftType } from '$lib/types/staff';
  import { staffStore } from '$lib/stores/staff.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { formatDate } from '$lib/utils/date';

  interface Props {
    class?: string;
    'data-testid'?: string;
  }

  let {
    class: className = '',
    'data-testid': testId = 'staff-schedule'
  }: Props = $props();

  // Calendar state
  let currentDate = $state(new Date());
  let viewMode = $state<'day' | 'week' | 'month'>('week');

  // Get current view dates
  const viewDates = $derived.by(() => {
    const dates: Date[] = [];
    const baseDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      dates.push(new Date(baseDate));
    } else if (viewMode === 'week') {
      // Get start of week (Sunday)
      const startOfWeek = new Date(baseDate);
      startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        dates.push(date);
      }
    } else if (viewMode === 'month') {
      // Get start of month
      const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const startOfCalendar = new Date(startOfMonth);
      startOfCalendar.setDate(startOfMonth.getDate() - startOfMonth.getDay());
      
      // Get 6 weeks (42 days) to cover the full month view
      for (let i = 0; i < 42; i++) {
        const date = new Date(startOfCalendar);
        date.setDate(startOfCalendar.getDate() + i);
        dates.push(date);
      }
    }
    
    return dates;
  });

  // Get schedules for current view
  const viewSchedules = $derived.by(() => {
    const startDate = viewDates[0];
    const endDate = viewDates[viewDates.length - 1];
    
    return staffStore.staff.flatMap(staff =>
      staff.schedule
        .filter(schedule => {
          const scheduleDate = new Date(schedule.date);
          return scheduleDate >= startDate && scheduleDate <= endDate;
        })
        .map(schedule => ({
          ...schedule,
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role
        }))
    );
  });

  // Navigation functions
  function navigatePrevious() {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    
    currentDate = newDate;
    staffStore.setSelectedDate(newDate);
  }

  function navigateNext() {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    currentDate = newDate;
    staffStore.setSelectedDate(newDate);
  }

  function goToToday() {
    currentDate = new Date();
    staffStore.setSelectedDate(currentDate);
  }

  function setViewMode(mode: 'day' | 'week' | 'month') {
    viewMode = mode;
    staffStore.setScheduleView(mode);
  }

  // Get schedules for a specific date
  function getSchedulesForDate(date: Date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return viewSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === targetDate.getTime();
    });
  }

  // Get shift type color
  function getShiftColor(shiftType: ShiftType): string {
    switch (shiftType) {
      case 'day':
        return 'bg:blue-100 text:blue-800';
      case 'evening':
        return 'bg:orange-100 text:orange-800';
      case 'night':
        return 'bg:purple-100 text:purple-800';
      case 'on-call':
        return 'bg:green-100 text:green-800';
      default:
        return 'bg:gray-100 text:gray-800';
    }
  }

  // Get shift type label
  function getShiftLabel(shiftType: ShiftType): string {
    switch (shiftType) {
      case 'day':
        return '日勤';
      case 'evening':
        return '夕勤';
      case 'night':
        return '夜勤';
      case 'on-call':
        return 'オンコール';
      default:
        return shiftType;
    }
  }

  // Check if date is today
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  // Check if date is in current month (for month view)
  function isCurrentMonth(date: Date): boolean {
    return date.getMonth() === currentDate.getMonth();
  }

  // Get view title
  const viewTitle = $derived.by(() => {
    if (viewMode === 'day') {
      return formatDate(currentDate);
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    } else if (viewMode === 'month') {
      return `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
    }
    return '';
  });

  // Week day labels
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
</script>

<div class="flex flex-col h:full {className}" data-testid={testId}>
  <!-- Header -->
  <div class="flex-shrink:0 p:4 border-b:1|solid|care-gray-200 bg:care-background-primary">
    <div class="flex items-center justify-between mb:4">
      <h2 class="text:xl font:semibold text:care-text-primary">
        職員スケジュール
      </h2>
      
      <div class="flex items-center gap:2">
        <!-- View Mode Buttons -->
        <div class="flex border:1|solid|care-gray-300 rounded:md overflow:hidden">
          <button
            type="button"
            class="px:3 py:1 text:sm {viewMode === 'day' ? 'bg:care-primary-500 text:white' : 'bg:white text:care-text-primary hover:bg:care-gray-50'}"
            onclick={() => setViewMode('day')}
          >
            日
          </button>
          <button
            type="button"
            class="px:3 py:1 text:sm border-l:1|solid|care-gray-300 {viewMode === 'week' ? 'bg:care-primary-500 text:white' : 'bg:white text:care-text-primary hover:bg:care-gray-50'}"
            onclick={() => setViewMode('week')}
          >
            週
          </button>
          <button
            type="button"
            class="px:3 py:1 text:sm border-l:1|solid|care-gray-300 {viewMode === 'month' ? 'bg:care-primary-500 text:white' : 'bg:white text:care-text-primary hover:bg:care-gray-50'}"
            onclick={() => setViewMode('month')}
          >
            月
          </button>
        </div>
        
        <Button variant="outline" size="sm" onclick={goToToday}>
          今日
        </Button>
      </div>
    </div>

    <!-- Navigation -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap:2">
        <Button variant="outline" size="sm" onclick={navigatePrevious}>
          {#snippet children()}
            <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          {/snippet}
        </Button>
        
        <h3 class="text:lg font:medium text:care-text-primary min-w:48">
          {viewTitle}
        </h3>
        
        <Button variant="outline" size="sm" onclick={navigateNext}>
          {#snippet children()}
            <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          {/snippet}
        </Button>
      </div>
      
      <div class="text:sm text:care-text-secondary">
        {viewSchedules.length}件のスケジュール
      </div>
    </div>
  </div>

  <!-- Calendar Content -->
  <div class="flex-1 overflow:auto">
    {#if viewMode === 'day'}
      <!-- Day View -->
      <div class="p:4">
        <div class="space-y:4">
          <div class="text:center py:2 border-b:1|solid|care-gray-200">
            <h4 class="text:lg font:medium text:care-text-primary">
              {formatDate(currentDate)}
              {#if isToday(currentDate)}
                <span class="ml:2 px:2 py:1 bg:care-primary-100 text:care-primary-700 text:xs rounded:full">
                  今日
                </span>
              {/if}
            </h4>
          </div>
          
          {#each getSchedulesForDate(currentDate) as schedule}
            <div class="border:1|solid|care-gray-200 rounded:lg p:4">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap:3 mb:2">
                    <h5 class="font:medium text:care-text-primary">{schedule.staffName}</h5>
                    <span class="px:2 py:1 {getShiftColor(schedule.shiftType)} text:xs rounded:full">
                      {getShiftLabel(schedule.shiftType)}
                    </span>
                    <span class="
                      px:2 py:1 text:xs rounded:full
                      {schedule.isConfirmed ? 'bg:green-100 text:green-800' : 'bg:yellow-100 text:yellow-800'}
                    ">
                      {schedule.isConfirmed ? '確定' : '未確定'}
                    </span>
                  </div>
                  <div class="text:sm text:care-text-secondary">
                    {schedule.startTime} - {schedule.endTime}
                  </div>
                  {#if schedule.notes}
                    <div class="text:sm text:care-text-secondary mt:1">
                      {schedule.notes}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {:else}
            <div class="text:center py:8 text:care-text-secondary">
              <svg class="h:12 w:12 text:care-gray-300 mx:auto mb:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0h4l-4 4-4-4h4z" />
              </svg>
              <p>この日のスケジュールはありません</p>
            </div>
          {/each}
        </div>
      </div>
    {:else if viewMode === 'week'}
      <!-- Week View -->
      <div class="p:4">
        <div class="grid grid-cols:7 gap:2">
          <!-- Week headers -->
          {#each weekDays as day, index}
            <div class="text:center py:2 font:medium text:care-text-primary border-b:1|solid|care-gray-200">
              {day}
            </div>
          {/each}
          
          <!-- Week dates -->
          {#each viewDates as date, index}
            <div class="min-h:32 p:2 border:1|solid|care-gray-200 rounded:md {isToday(date) ? 'bg:care-primary-50 border-care-primary-300' : 'bg:white'}">
              <div class="text:sm font:medium text:care-text-primary mb:2">
                {date.getDate()}
                {#if isToday(date)}
                  <span class="ml:1 w:2 h:2 bg:care-primary-500 rounded:full inline-block"></span>
                {/if}
              </div>
              
              <div class="space-y:1">
                {#each getSchedulesForDate(date) as schedule}
                  <div class="px:2 py:1 {getShiftColor(schedule.shiftType)} text:xs rounded truncate">
                    <div class="font:medium">{schedule.staffName}</div>
                    <div class="text:xs opacity:75">{schedule.startTime}-{schedule.endTime}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if viewMode === 'month'}
      <!-- Month View -->
      <div class="p:4">
        <div class="grid grid-cols:7 gap:1">
          <!-- Month headers -->
          {#each weekDays as day}
            <div class="text:center py:2 font:medium text:care-text-primary border-b:1|solid|care-gray-200">
              {day}
            </div>
          {/each}
          
          <!-- Month dates -->
          {#each viewDates as date, index}
            <div class="min-h:24 p:1 border:1|solid|care-gray-200 {isToday(date) ? 'bg:care-primary-50 border-care-primary-300' : isCurrentMonth(date) ? 'bg:white' : 'bg:care-gray-50'}">
              <div class="text:xs {isCurrentMonth(date) ? 'text:care-text-primary' : 'text:care-text-secondary'} mb:1">
                {date.getDate()}
                {#if isToday(date)}
                  <span class="ml:1 w:1.5 h:1.5 bg:care-primary-500 rounded:full inline-block"></span>
                {/if}
              </div>
              
              <div class="space-y:0.5">
                {#each getSchedulesForDate(date).slice(0, 2) as schedule}
                  <div class="px:1 py:0.5 {getShiftColor(schedule.shiftType)} text:xs rounded truncate">
                    <div class="font:medium text:xs">{schedule.staffName}</div>
                  </div>
                {/each}
                {#if getSchedulesForDate(date).length > 2}
                  <div class="text:xs text:care-text-secondary">
                    +{getSchedulesForDate(date).length - 2}件
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <!-- Legend -->
  <div class="flex-shrink:0 p:4 border-t:1|solid|care-gray-200 bg:care-background-primary">
    <div class="flex items-center justify-center gap:6 text:sm">
      <div class="flex items-center gap:2">
        <div class="w:3 h:3 bg:blue-500 rounded:full"></div>
        <span class="text:care-text-secondary">日勤</span>
      </div>
      <div class="flex items-center gap:2">
        <div class="w:3 h:3 bg:orange-500 rounded:full"></div>
        <span class="text:care-text-secondary">夕勤</span>
      </div>
      <div class="flex items-center gap:2">
        <div class="w:3 h:3 bg:purple-500 rounded:full"></div>
        <span class="text:care-text-secondary">夜勤</span>
      </div>
      <div class="flex items-center gap:2">
        <div class="w:3 h:3 bg:green-500 rounded:full"></div>
        <span class="text:care-text-secondary">オンコール</span>
      </div>
    </div>
  </div>
</div>