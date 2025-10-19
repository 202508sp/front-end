<script lang="ts">
  import type { Report, ReportFilter, ReportSortOption, ReportType, ReportStatus } from '$lib/types/report';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { reportStore } from '$lib/stores/report.svelte';
  import { formatDate } from '$lib/utils/date';
  import Icon from '@iconify/svelte';
  
  interface Props {
    userId?: string;
    onReportSelect?: (report: Report) => void;
    onReportEdit?: (report: Report) => void;
    onReportDelete?: (report: Report) => void;
    showActions?: boolean;
  }
  
  let { 
    userId, 
    onReportSelect, 
    onReportEdit, 
    onReportDelete, 
    showActions = true 
  }: Props = $props();
  
  // 検索・フィルタ状態
  let searchTerm = $state('');
  let selectedTypes = $state<ReportType[]>([]);
  let selectedStatuses = $state<ReportStatus[]>([]);
  let dateRange = $state<{ start: string; end: string }>({ start: '', end: '' });
  let showFilters = $state(false);
  
  // ソート状態
  let sortField = $state<keyof Report>('createdAt');
  let sortDirection = $state<'asc' | 'desc'>('desc');
  
  // 初期化
  $effect(() => {
    reportStore.loadReports(userId);
    reportStore.loadTemplates();
  });
  
  // フィルタの適用
  $effect(() => {
    const filter: ReportFilter = {};
    
    if (searchTerm.trim()) {
      filter.searchTerm = searchTerm.trim();
    }
    
    if (selectedTypes.length > 0) {
      filter.type = selectedTypes;
    }
    
    if (selectedStatuses.length > 0) {
      filter.status = selectedStatuses;
    }
    
    if (dateRange.start && dateRange.end) {
      filter.dateRange = {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      };
    }
    
    reportStore.setFilter(filter);
  });
  
  // ソートの適用
  $effect(() => {
    reportStore.setSortOption({
      field: sortField,
      direction: sortDirection
    });
  });
  
  function toggleSort(field: keyof Report) {
    if (sortField === field) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }
  
  function clearFilters() {
    searchTerm = '';
    selectedTypes = [];
    selectedStatuses = [];
    dateRange = { start: '', end: '' };
    reportStore.clearFilter();
  }
  
  function handleReportClick(report: Report) {
    reportStore.selectReport(report);
    onReportSelect?.(report);
  }
  
  function getStatusColor(status: ReportStatus): string {
    switch (status) {
      case 'draft': return 'bg:gray-100 color:gray-800';
      case 'pending-review': return 'bg:yellow-100 color:yellow-800';
      case 'approved': return 'bg:green-100 color:green-800';
      case 'published': return 'bg:blue-100 color:blue-800';
      case 'archived': return 'bg:gray-100 color:gray-600';
      default: return 'bg:gray-100 color:gray-800';
    }
  }
  
  function getStatusLabel(status: ReportStatus): string {
    switch (status) {
      case 'draft': return '下書き';
      case 'pending-review': return '承認待ち';
      case 'approved': return '承認済み';
      case 'published': return '公開済み';
      case 'archived': return 'アーカイブ';
      default: return status;
    }
  }
  
  function getTypeLabel(type: ReportType): string {
    switch (type) {
      case 'daily': return '日次';
      case 'medical': return '医療';
      case 'incident': return 'インシデント';
      case 'progress': return '経過';
      case 'family-communication': return '家族連絡';
      case 'monthly-summary': return '月次';
      default: return type;
    }
  }
  
  const reportTypeOptions = [
    { value: 'daily', label: '日次レポート' },
    { value: 'medical', label: '医療レポート' },
    { value: 'incident', label: 'インシデントレポート' },
    { value: 'progress', label: '経過レポート' },
    { value: 'family-communication', label: '家族連絡' },
    { value: 'monthly-summary', label: '月次サマリー' }
  ];
  
  const statusOptions = [
    { value: 'draft', label: '下書き' },
    { value: 'pending-review', label: '承認待ち' },
    { value: 'approved', label: '承認済み' },
    { value: 'published', label: '公開済み' },
    { value: 'archived', label: 'アーカイブ' }
  ];
</script>

<div class="h:full flex flex:col">
  <!-- 検索・フィルタヘッダー -->
  <div class="p:16px border-b:1px|solid|gray-200 bg:white">
    <div class="flex items:center gap:12px mb:12px">
      <div class="flex:1 relative">
        <Icon 
          icon="material-symbols:search" 
          class="absolute left:8px top:50% transform:translateY(-50%) w:20px h:20px color:gray-400"
        />
        <input
          type="text"
          bind:value={searchTerm}
          placeholder="レポートを検索..."
          class="w:full pl:36px pr:12px py:8px border:1px|solid|gray-300 r:4px"
        />
      </div>
      
      <Button 
        variant="secondary" 
        onclick={() => showFilters = !showFilters}
        class="flex items:center gap:4px"
      >
        <Icon icon="material-symbols:filter-list" class="w:16px h:16px" />
        フィルタ
      </Button>
      
      {#if Object.keys(reportStore.filter).length > 0}
        <Button variant="secondary" onclick={clearFilters}>
          <Icon icon="material-symbols:clear" class="w:16px h:16px" />
          クリア
        </Button>
      {/if}
    </div>
    
    <!-- フィルタパネル -->
    {#if showFilters}
      <div class="p:16px bg:gray-50 r:8px space-y:12px">
        <div class="grid grid-cols:2 gap:12px">
          <FormField label="レポート種別">
            <div class="space-y:4px">
              {#each reportTypeOptions as option}
                <label class="flex items:center gap:8px">
                  <input
                    type="checkbox"
                    bind:group={selectedTypes}
                    value={option.value}
                    class="w:16px h:16px"
                  />
                  <span class="font:14px">{option.label}</span>
                </label>
              {/each}
            </div>
          </FormField>
          
          <FormField label="ステータス">
            <div class="space-y:4px">
              {#each statusOptions as option}
                <label class="flex items:center gap:8px">
                  <input
                    type="checkbox"
                    bind:group={selectedStatuses}
                    value={option.value}
                    class="w:16px h:16px"
                  />
                  <span class="font:14px">{option.label}</span>
                </label>
              {/each}
            </div>
          </FormField>
        </div>
        
        <div class="grid grid-cols:2 gap:12px">
          <FormField label="開始日">
            <input
              type="date"
              bind:value={dateRange.start}
              class="w:full p:8px border:1px|solid|gray-300 r:4px"
            />
          </FormField>
          
          <FormField label="終了日">
            <input
              type="date"
              bind:value={dateRange.end}
              class="w:full p:8px border:1px|solid|gray-300 r:4px"
            />
          </FormField>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- レポート一覧 -->
  <div class="flex:1 overflow:auto">
    {#if reportStore.isLoading}
      <div class="flex items:center justify:center h:200px">
        <div class="flex items:center gap:8px">
          <Icon icon="material-symbols:refresh" class="w:20px h:20px animate:spin" />
          <span>読み込み中...</span>
        </div>
      </div>
    {:else if reportStore.error}
      <div class="p:20px text:center">
        <div class="p:16px bg:red-50 border:1px|solid|red-200 r:8px inline-block">
          <Icon icon="material-symbols:error" class="w:20px h:20px color:red-500 mb:8px" />
          <p class="color:red-600">{reportStore.error}</p>
        </div>
      </div>
    {:else if reportStore.filteredReports.length === 0}
      <div class="p:20px text:center">
        <Icon icon="material-symbols:description" class="w:48px h:48px color:gray-400 mb:12px" />
        <p class="color:gray-600">レポートが見つかりません</p>
      </div>
    {:else}
      <!-- テーブルヘッダー -->
      <div class="sticky top:0 bg:white border-b:1px|solid|gray-200 z:10">
        <div class="grid grid-cols:12 gap:12px p:12px font:14px font:bold color:gray-700">
          <button 
            class="col-span:3 text:left flex items:center gap:4px hover:color:blue-600"
            onclick={() => toggleSort('title')}
          >
            タイトル
            {#if sortField === 'title'}
              <Icon 
                icon={sortDirection === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'} 
                class="w:16px h:16px" 
              />
            {/if}
          </button>
          
          <button 
            class="col-span:1 text:left flex items:center gap:4px hover:color:blue-600"
            onclick={() => toggleSort('type')}
          >
            種別
            {#if sortField === 'type'}
              <Icon 
                icon={sortDirection === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'} 
                class="w:16px h:16px" 
              />
            {/if}
          </button>
          
          <button 
            class="col-span:1 text:left flex items:center gap:4px hover:color:blue-600"
            onclick={() => toggleSort('status')}
          >
            ステータス
            {#if sortField === 'status'}
              <Icon 
                icon={sortDirection === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'} 
                class="w:16px h:16px" 
              />
            {/if}
          </button>
          
          <button 
            class="col-span:2 text:left flex items:center gap:4px hover:color:blue-600"
            onclick={() => toggleSort('authorName')}
          >
            作成者
            {#if sortField === 'authorName'}
              <Icon 
                icon={sortDirection === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'} 
                class="w:16px h:16px" 
              />
            {/if}
          </button>
          
          <button 
            class="col-span:2 text:left flex items:center gap:4px hover:color:blue-600"
            onclick={() => toggleSort('date')}
          >
            日付
            {#if sortField === 'date'}
              <Icon 
                icon={sortDirection === 'asc' ? 'material-symbols:arrow-upward' : 'material-symbols:arrow-downward'} 
                class="w:16px h:16px" 
              />
            {/if}
          </button>
          
          <div class="col-span:1 text:center">家族公開</div>
          
          {#if showActions}
            <div class="col-span:2 text:center">操作</div>
          {/if}
        </div>
      </div>
      
      <!-- レポート行 -->
      <div class="divide-y:1px|solid|gray-100">
        {#each reportStore.filteredReports as report}
          <div 
            class="grid grid-cols:12 gap:12px p:12px hover:bg:gray-50 cursor:pointer"
            role="button"
            tabindex="0"
            onclick={() => handleReportClick(report)}
            onkeydown={(e) => e.key === 'Enter' && handleReportClick(report)}
          >
            <div class="col-span:3">
              <h3 class="font:14px font:medium mb:2px">{report.title}</h3>
              {#if report.tags.length > 0}
                <div class="flex flex:wrap gap:4px">
                  {#each report.tags.slice(0, 3) as tag}
                    <span class="px:6px py:2px bg:gray-100 color:gray-700 r:12px font:12px">
                      {tag}
                    </span>
                  {/each}
                  {#if report.tags.length > 3}
                    <span class="px:6px py:2px bg:gray-100 color:gray-700 r:12px font:12px">
                      +{report.tags.length - 3}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
            
            <div class="col-span:1">
              <span class="px:8px py:4px bg:gray-100 color:gray-700 r:12px font:12px">
                {getTypeLabel(report.type)}
              </span>
            </div>
            
            <div class="col-span:1">
              <span class="px:8px py:4px r:12px font:12px {getStatusColor(report.status)}">
                {getStatusLabel(report.status)}
              </span>
            </div>
            
            <div class="col-span:2">
              <p class="font:14px">{report.authorName}</p>
            </div>
            
            <div class="col-span:2">
              <p class="font:14px">{formatDate(report.date)}</p>
              <p class="font:12px color:gray-500">
                作成: {formatDate(report.createdAt)}
              </p>
            </div>
            
            <div class="col-span:1 text:center">
              {#if report.isPublishedToFamily}
                <Icon icon="material-symbols:check-circle" class="w:20px h:20px color:green-500" />
              {:else}
                <Icon icon="material-symbols:remove-circle" class="w:20px h:20px color:gray-400" />
              {/if}
            </div>
            
            {#if showActions}
              <div class="col-span:2 flex items:center justify:center gap:8px">
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    onReportEdit?.(report);
                  }}
                  class="p:4px hover:bg:blue-100 r:4px"
                  title="編集"
                >
                  <Icon icon="material-symbols:edit" class="w:16px h:16px color:blue-600" />
                </button>
                
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    onReportDelete?.(report);
                  }}
                  class="p:4px hover:bg:red-100 r:4px"
                  title="削除"
                >
                  <Icon icon="material-symbols:delete" class="w:16px h:16px color:red-600" />
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <!-- フッター情報 -->
  {#if !reportStore.isLoading && !reportStore.error}
    <div class="p:12px border-t:1px|solid|gray-200 bg:gray-50">
      <p class="font:12px color:gray-600 text:center">
        {reportStore.filteredReports.length} 件のレポート
        {#if Object.keys(reportStore.filter).length > 0}
          (フィルタ適用中)
        {/if}
      </p>
    </div>
  {/if}
</div>