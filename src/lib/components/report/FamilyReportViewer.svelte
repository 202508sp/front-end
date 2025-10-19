<script lang="ts">
  import type { Report, ReportType } from '$lib/types/report';
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/Button.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { reportService } from '$lib/services/report';
  import { formatDate } from '$lib/utils/date';
  import Icon from '@iconify/svelte';
  
  interface Props {
    userId: string;
    familyMemberId: string;
    user?: User;
    isSimplified?: boolean; // 利用者本人用の簡易インターフェース
  }
  
  let { userId, familyMemberId, user, isSimplified = false }: Props = $props();
  
  // 状態
  let reports = $state<Report[]>([]);
  let selectedReport = $state<Report | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // フィルタ状態
  let searchTerm = $state('');
  let selectedTypes = $state<ReportType[]>([]);
  let dateRange = $state<{ start: string; end: string }>({ start: '', end: '' });
  let showFilters = $state(false);
  
  // 派生状態
  let filteredReports = $derived(() => {
    let filtered = reports;
    
    // 検索フィルタ
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(term) ||
        report.content.toLowerCase().includes(term)
      );
    }
    
    // タイプフィルタ
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(report => selectedTypes.includes(report.type));
    }
    
    // 日付範囲フィルタ
    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(report => {
        const reportDate = new Date(report.date);
        return reportDate >= new Date(dateRange.start) && reportDate <= new Date(dateRange.end);
      });
    }
    
    // 日付順でソート（新しい順）
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  
  // 初期化
  $effect(() => {
    loadFamilyReports();
  });
  
  async function loadFamilyReports() {
    isLoading = true;
    error = null;
    
    try {
      reports = await reportService.getFamilyReports(userId, familyMemberId);
    } catch (err) {
      error = err instanceof Error ? err.message : 'レポートの読み込みに失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  async function selectReport(report: Report) {
    selectedReport = report;
    
    // 既読状態を更新
    try {
      await reportService.markReportAsRead(report.id, familyMemberId);
    } catch (err) {
      console.error('Failed to mark report as read:', err);
    }
  }
  
  function clearFilters() {
    searchTerm = '';
    selectedTypes = [];
    dateRange = { start: '', end: '' };
  }
  
  function getTypeLabel(type: ReportType): string {
    switch (type) {
      case 'daily': return '日次レポート';
      case 'medical': return '医療レポート';
      case 'incident': return 'インシデントレポート';
      case 'progress': return '経過レポート';
      case 'family-communication': return '家族連絡';
      case 'monthly-summary': return '月次サマリー';
      default: return type;
    }
  }
  
  function getTypeColor(type: ReportType): string {
    switch (type) {
      case 'daily': return 'bg:blue-100 color:blue-800';
      case 'medical': return 'bg:red-100 color:red-800';
      case 'incident': return 'bg:orange-100 color:orange-800';
      case 'progress': return 'bg:green-100 color:green-800';
      case 'family-communication': return 'bg:purple-100 color:purple-800';
      case 'monthly-summary': return 'bg:gray-100 color:gray-800';
      default: return 'bg:gray-100 color:gray-800';
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
</script>

<div class="h:full flex {isSimplified ? 'flex:col' : ''}">
  <!-- レポート一覧 -->
  <div class="w:{isSimplified ? 'full' : '400px'} border-r:{isSimplified ? 'none' : '1px|solid|gray-200'} flex flex:col">
    <!-- ヘッダー -->
    <div class="p:16px border-b:1px|solid|gray-200 bg:white">
      {#if user}
        <div class="mb:12px">
          <h2 class="font:18px font:bold">{user.name}さんのレポート</h2>
          <p class="font:14px color:gray-600">家族ポータル</p>
        </div>
      {/if}
      
      {#if !isSimplified}
        <!-- 検索 -->
        <div class="relative mb:12px">
          <Icon 
            icon="material-symbols:search" 
            class="absolute left:8px top:50% transform:translateY(-50%) w:16px h:16px color:gray-400"
          />
          <input
            type="text"
            bind:value={searchTerm}
            placeholder="レポートを検索..."
            class="w:full pl:32px pr:12px py:8px border:1px|solid|gray-300 r:4px font:14px"
          />
        </div>
        
        <!-- フィルタボタン -->
        <div class="flex items:center gap:8px">
          <Button 
            variant="secondary" 
            onclick={() => showFilters = !showFilters}
            class="flex items:center gap:4px font:12px"
          >
            <Icon icon="material-symbols:filter-list" class="w:14px h:14px" />
            フィルタ
          </Button>
          
          {#if searchTerm || selectedTypes.length > 0 || dateRange.start || dateRange.end}
            <Button variant="secondary" onclick={clearFilters} class="font:12px">
              <Icon icon="material-symbols:clear" class="w:14px h:14px" />
              クリア
            </Button>
          {/if}
        </div>
        
        <!-- フィルタパネル -->
        {#if showFilters}
          <div class="mt:12px p:12px bg:gray-50 r:8px space-y:12px">
            <FormField label="レポート種別">
              <div class="space-y:4px">
                {#each reportTypeOptions as option}
                  <label class="flex items:center gap:6px">
                    <input
                      type="checkbox"
                      bind:group={selectedTypes}
                      value={option.value}
                      class="w:14px h:14px"
                    />
                    <span class="font:12px">{option.label}</span>
                  </label>
                {/each}
              </div>
            </FormField>
            
            <div class="grid grid-cols:2 gap:8px">
              <FormField label="開始日">
                <input
                  type="date"
                  bind:value={dateRange.start}
                  class="w:full p:6px border:1px|solid|gray-300 r:4px font:12px"
                />
              </FormField>
              
              <FormField label="終了日">
                <input
                  type="date"
                  bind:value={dateRange.end}
                  class="w:full p:6px border:1px|solid|gray-300 r:4px font:12px"
                />
              </FormField>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    
    <!-- レポートリスト -->
    <div class="flex:1 overflow:auto">
      {#if isLoading}
        <div class="flex items:center justify:center h:200px">
          <div class="flex items:center gap:8px">
            <Icon icon="material-symbols:refresh" class="w:20px h:20px animate:spin" />
            <span class="font:14px">読み込み中...</span>
          </div>
        </div>
      {:else if error}
        <div class="p:20px text:center">
          <div class="p:16px bg:red-50 border:1px|solid|red-200 r:8px inline-block">
            <Icon icon="material-symbols:error" class="w:20px h:20px color:red-500 mb:8px" />
            <p class="color:red-600 font:14px">{error}</p>
          </div>
        </div>
      {:else if filteredReports.length === 0}
        <div class="p:20px text:center">
          <Icon icon="material-symbols:description" class="w:32px h:32px color:gray-400 mb:12px" />
          <p class="color:gray-600 font:14px">レポートが見つかりません</p>
        </div>
      {:else}
        <div class="divide-y:1px|solid|gray-100">
          {#each filteredReports as report}
            <div 
              class="p:12px hover:bg:gray-50 cursor:pointer {selectedReport?.id === report.id ? 'bg:blue-50' : ''}"
              role="button"
              tabindex="0"
              onclick={() => selectReport(report)}
              onkeydown={(e) => e.key === 'Enter' && selectReport(report)}
            >
              <div class="flex items:start justify:between mb:8px">
                <h3 class="font:14px font:medium line-height:1.4 flex:1 mr:8px">
                  {report.title}
                </h3>
                <span class="px:6px py:2px r:12px font:10px {getTypeColor(report.type)} flex-shrink:0">
                  {getTypeLabel(report.type)}
                </span>
              </div>
              
              <div class="flex items:center justify:between">
                <p class="font:12px color:gray-600">{formatDate(report.date)}</p>
                <p class="font:12px color:gray-500">by {report.authorName}</p>
              </div>
              
              {#if report.tags.length > 0}
                <div class="flex flex:wrap gap:4px mt:6px">
                  {#each report.tags.slice(0, 2) as tag}
                    <span class="px:4px py:2px bg:gray-100 color:gray-700 r:8px font:10px">
                      {tag}
                    </span>
                  {/each}
                  {#if report.tags.length > 2}
                    <span class="px:4px py:2px bg:gray-100 color:gray-700 r:8px font:10px">
                      +{report.tags.length - 2}
                    </span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    <!-- フッター -->
    {#if !isLoading && !error}
      <div class="p:12px border-t:1px|solid|gray-200 bg:gray-50">
        <p class="font:12px color:gray-600 text:center">
          {filteredReports.length} 件のレポート
        </p>
      </div>
    {/if}
  </div>
  
  <!-- レポート詳細 -->
  {#if !isSimplified}
    <div class="flex:1 flex flex:col">
      {#if selectedReport}
        <div class="p:16px border-b:1px|solid|gray-200 bg:white">
          <div class="flex items:start justify:between mb:12px">
            <h2 class="font:18px font:bold line-height:1.4 flex:1 mr:16px">
              {selectedReport.title}
            </h2>
            <span class="px:8px py:4px r:12px font:12px {getTypeColor(selectedReport.type)} flex-shrink:0">
              {getTypeLabel(selectedReport.type)}
            </span>
          </div>
          
          <div class="grid grid-cols:3 gap:16px font:14px">
            <div>
              <span class="color:gray-600">作成者:</span>
              <span class="ml:4px">{selectedReport.authorName}</span>
            </div>
            <div>
              <span class="color:gray-600">レポート日:</span>
              <span class="ml:4px">{formatDate(selectedReport.date)}</span>
            </div>
            <div>
              <span class="color:gray-600">公開日:</span>
              <span class="ml:4px">
                {selectedReport.publishedAt ? formatDate(selectedReport.publishedAt) : '-'}
              </span>
            </div>
          </div>
          
          {#if selectedReport.tags.length > 0}
            <div class="flex flex:wrap gap:6px mt:12px">
              {#each selectedReport.tags as tag}
                <span class="px:6px py:2px bg:gray-100 color:gray-700 r:12px font:12px">
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="flex:1 overflow:auto p:16px">
          <!-- セクション表示 -->
          {#if selectedReport.sections.length > 0}
            <div class="space-y:20px mb:24px">
              {#each selectedReport.sections as section}
                <div>
                  <h3 class="font:16px font:bold mb:8px">{section.title}</h3>
                  <div class="p:12px bg:gray-50 r:8px">
                    {#if section.type === 'text'}
                      <p class="font:14px line-height:1.6 whitespace:pre-wrap">{section.value || '記載なし'}</p>
                    {:else}
                      <p class="font:14px color:gray-600">
                        {section.type === 'checklist' ? 'チェックリスト項目' :
                         section.type === 'rating' ? '評価項目' :
                         section.type === 'file' ? 'ファイル添付' :
                         section.type === 'signature' ? '署名' : '不明な項目'}
                      </p>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
          
          <!-- 自由記述内容 -->
          {#if selectedReport.content}
            <div>
              <h3 class="font:16px font:bold mb:8px">詳細内容</h3>
              <div class="p:12px bg:gray-50 r:8px">
                <p class="font:14px line-height:1.6 whitespace:pre-wrap">{selectedReport.content}</p>
              </div>
            </div>
          {/if}
          
          <!-- 添付ファイル -->
          {#if selectedReport.attachments.length > 0}
            <div class="mt:20px">
              <h3 class="font:16px font:bold mb:8px">添付ファイル</h3>
              <div class="space-y:8px">
                {#each selectedReport.attachments as attachment}
                  <div class="flex items:center gap:8px p:8px border:1px|solid|gray-200 r:4px">
                    <Icon icon="material-symbols:attach-file" class="w:16px h:16px color:gray-500" />
                    <span class="font:14px flex:1">{attachment.name}</span>
                    <Button variant="secondary" class="font:12px">
                      ダウンロード
                    </Button>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
        
      {:else}
        <div class="flex:1 flex items:center justify:center">
          <div class="text:center">
            <Icon icon="material-symbols:description" class="w:48px h:48px color:gray-400 mb:12px" />
            <p class="font:16px color:gray-600 mb:8px">レポートを選択してください</p>
            <p class="font:14px color:gray-500">左側のリストからレポートを選択して詳細を確認できます</p>
          </div>
        </div>
      {/if}
    </div>
  {:else if selectedReport}
    <!-- 簡易表示モード（利用者本人用） -->
    <div class="mt:16px p:16px border:1px|solid|gray-200 r:8px">
      <h3 class="font:16px font:bold mb:8px">{selectedReport.title}</h3>
      <p class="font:12px color:gray-600 mb:12px">
        {formatDate(selectedReport.date)} - {selectedReport.authorName}
      </p>
      
      {#if selectedReport.content}
        <div class="p:12px bg:gray-50 r:8px">
          <p class="font:14px line-height:1.6">{selectedReport.content}</p>
        </div>
      {/if}
    </div>
  {/if}
</div>