<script lang="ts">
  import type { Report } from '$lib/types/report.js';
  import type { ReportSearchFilter } from '$lib/types/family.js';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Icon from '@iconify/svelte';
  import { formatDate, formatRelativeTime } from '$lib/utils/date.js';

  interface Props {
    reports: Report[];
    isLoading?: boolean;
    onSearch?: (filter: ReportSearchFilter) => void;
    onLoadMore?: () => void;
    hasMore?: boolean;
  }

  let {
    reports = [],
    isLoading = false,
    onSearch = () => {},
    onLoadMore = () => {},
    hasMore = false
  }: Props = $props();

  // 検索・フィルター状態
  let searchTerm = $state('');
  let selectedTypes = $state<string[]>([]);
  let dateRange = $state<{ start: string; end: string }>({ start: '', end: '' });
  let selectedReport = $state<Report | null>(null);
  let showReportModal = $state(false);

  // レポートタイプの定義
  const reportTypes = [
    { value: 'daily', label: '日常レポート' },
    { value: 'medical', label: '医療レポート' },
    { value: 'incident', label: 'インシデントレポート' },
    { value: 'progress', label: '経過レポート' },
    { value: 'family-communication', label: '家族連絡' }
  ];

  const getReportTypeLabel = (type: string) => {
    const typeObj = reportTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'daily': 'blue',
      'medical': 'red',
      'incident': 'orange',
      'progress': 'green',
      'family-communication': 'purple'
    };
    return colors[type] || 'gray';
  };

  // 検索実行
  const handleSearch = () => {
    const filter: ReportSearchFilter = {
      searchTerm: searchTerm.trim() || undefined,
      type: selectedTypes.length > 0 ? selectedTypes : undefined,
      dateRange: dateRange.start && dateRange.end ? {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      } : undefined
    };
    onSearch(filter);
  };

  // フィルターリセット
  const resetFilters = () => {
    searchTerm = '';
    selectedTypes = [];
    dateRange = { start: '', end: '' };
    handleSearch();
  };

  // レポート詳細表示
  const viewReport = (report: Report) => {
    selectedReport = report;
    showReportModal = true;
  };

  // タイプフィルター切り替え
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      selectedTypes = selectedTypes.filter(t => t !== type);
    } else {
      selectedTypes = [...selectedTypes, type];
    }
  };

  // 添付ファイルダウンロード
  const downloadAttachment = (attachment: any) => {
    window.open(attachment.url, '_blank');
  };
</script>

<div class="report-viewer">
  <!-- 検索・フィルター -->
  <Card class="search-section">
    <div class="search-header">
      <h2>
        <Icon icon="material-symbols:search" width="20" height="20" />
        レポート検索
      </h2>
    </div>
    
    <div class="search-form">
      <div class="search-input">
        <input
          bind:value={searchTerm}
          placeholder="レポートを検索..."
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          class="search-input-field"
        />
        <Button onclick={handleSearch} class="search-button">
          <Icon icon="material-symbols:search" width="16" height="16" />
        </Button>
      </div>
      
      <div class="filter-section">
        <div class="filter-group">
          <label for="report-types">レポートタイプ:</label>
          <div class="type-filters" id="report-types">
            {#each reportTypes as type}
              <button
                class="type-filter {selectedTypes.includes(type.value) ? 'active' : ''}"
                onclick={() => toggleType(type.value)}
              >
                {type.label}
              </button>
            {/each}
          </div>
        </div>
        
        <div class="filter-group">
          <label for="date-range">期間:</label>
          <div class="date-range" id="date-range">
            <input
              type="date"
              bind:value={dateRange.start}
              placeholder="開始日"
              class="date-input"
            />
            <span>〜</span>
            <input
              type="date"
              bind:value={dateRange.end}
              placeholder="終了日"
              class="date-input"
            />
          </div>
        </div>
        
        <div class="filter-actions">
          <Button variant="outline" onclick={resetFilters}>
            リセット
          </Button>
        </div>
      </div>
    </div>
  </Card>

  <!-- レポート一覧 -->
  <Card class="reports-section">
    <div class="reports-header">
      <h2>
        <Icon icon="material-symbols:description" width="20" height="20" />
        レポート一覧 ({reports.length}件)
      </h2>
    </div>
    
    {#if isLoading}
      <div class="loading-state">
        <Icon icon="material-symbols:progress-activity" width="32" height="32" class="loading-icon" />
        <p>読み込み中...</p>
      </div>
    {:else if reports.length === 0}
      <div class="empty-state">
        <Icon icon="material-symbols:description-outline" width="64" height="64" />
        <h3>レポートが見つかりません</h3>
        <p>検索条件を変更してお試しください</p>
      </div>
    {:else}
      <div class="reports-list">
        {#each reports as report}
          <div 
            class="report-card"
            role="button"
            tabindex="0"
            onclick={() => viewReport(report)}
            onkeydown={(e) => e.key === 'Enter' && viewReport(report)}
          >
            <div class="report-header">
              <span class="report-type {getReportTypeColor(report.type)}">
                {getReportTypeLabel(report.type)}
              </span>
              <span class="report-date">{formatDate(report.date)}</span>
            </div>
            
            <h3 class="report-title">{report.title}</h3>
            
            <p class="report-preview">
              {report.content.length > 150 
                ? report.content.substring(0, 150) + '...' 
                : report.content}
            </p>
            
            <div class="report-meta">
              <div class="report-info">
                <span class="author">作成者: {report.authorName}</span>
                <span class="created-at">{formatRelativeTime(report.createdAt)}</span>
              </div>
              
              {#if report.attachments.length > 0}
                <div class="attachments-indicator">
                  <Icon icon="material-symbols:attach-file" width="16" height="16" />
                  {report.attachments.length}
                </div>
              {/if}
            </div>
            
            {#if report.tags.length > 0}
              <div class="report-tags">
                {#each report.tags.slice(0, 3) as tag}
                  <span class="tag">{tag}</span>
                {/each}
                {#if report.tags.length > 3}
                  <span class="tag-more">+{report.tags.length - 3}</span>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      {#if hasMore}
        <div class="load-more">
          <Button onclick={onLoadMore} variant="outline">
            さらに読み込む
          </Button>
        </div>
      {/if}
    {/if}
  </Card>
</div>

<!-- レポート詳細モーダル -->
{#if showReportModal && selectedReport}
  <Modal
    isOpen={showReportModal}
    onClose={() => showReportModal = false}
    title={selectedReport.title}
    size="lg"
  >
    <div class="report-detail">
      <div class="report-detail-header">
        <div class="report-meta-info">
          <span class="report-type {getReportTypeColor(selectedReport.type)}">
            {getReportTypeLabel(selectedReport.type)}
          </span>
          <span class="report-date">{formatDate(selectedReport.date)}</span>
          <span class="author">作成者: {selectedReport.authorName}</span>
        </div>
        
        {#if selectedReport.tags.length > 0}
          <div class="report-tags">
            {#each selectedReport.tags as tag}
              <span class="tag">{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
      
      <div class="report-content">
        <div class="content-text">
          {selectedReport.content}
        </div>
        
        {#if selectedReport.attachments.length > 0}
          <div class="report-attachments">
            <h4>添付ファイル</h4>
            <div class="attachments-list">
              {#each selectedReport.attachments as attachment}
                <div class="attachment-item">
                  <Icon icon="material-symbols:attach-file" width="20" height="20" />
                  <span class="attachment-name">{attachment.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onclick={() => downloadAttachment(attachment)}
                  >
                    <Icon icon="material-symbols:download" width="16" height="16" />
                  </Button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </Modal>
{/if}

<style>
  .report-viewer {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .search-section {
    padding: 24px;
  }

  .search-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }

  .search-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .search-input {
    display: flex;
    gap: 8px;
  }

  .search-input-field {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
  }

  .search-input-field:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  .date-input {
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
  }

  .date-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .search-button {
    flex-shrink: 0;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-group label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }

  .type-filters {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .type-filter {
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    transition: all 200ms;
    background: white;
  }

  .type-filter:hover {
    border-color: #60a5fa;
    background-color: #eff6ff;
  }

  .type-filter.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }

  .date-range {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filter-actions {
    display: flex;
    justify-content: flex-end;
  }

  .reports-section {
    padding: 24px;
  }

  .reports-header h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 16px;
  }

  .loading-state {
    text-align: center;
    padding: 48px 0;
    color: #6b7280;
  }

  .loading-icon {
    animation: spin 1s linear infinite;
    margin-bottom: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: #6b7280;
  }

  .empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    margin-top: 16px;
    margin-bottom: 8px;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .report-card {
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 200ms;
  }

  .report-card:hover {
    border-color: #93c5fd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .report-type {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 4px;
  }

  .report-type.blue { background-color: #dbeafe; color: #1d4ed8; }
  .report-type.red { background-color: #fee2e2; color: #b91c1c; }
  .report-type.orange { background-color: #fed7aa; color: #c2410c; }
  .report-type.green { background-color: #dcfce7; color: #166534; }
  .report-type.purple { background-color: #e9d5ff; color: #7c3aed; }
  .report-type.gray { background-color: #f3f4f6; color: #374151; }

  .report-date {
    font-size: 12px;
    color: #6b7280;
  }

  .report-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }

  .report-preview {
    font-size: 14px;
    color: #6b7280;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .report-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .report-info {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: #6b7280;
  }

  .attachments-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
  }

  .report-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 11px;
    color: #6b7280;
    background-color: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .tag-more {
    font-size: 11px;
    color: #6b7280;
    background-color: #f9fafb;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .load-more {
    text-align: center;
    margin-top: 24px;
  }

  .report-detail {
    max-height: 80vh;
    overflow-y: auto;
  }

  .report-detail-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #e5e7eb;
    margin-bottom: 16px;
  }

  .report-meta-info {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 8px;
  }

  .report-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .content-text {
    font-size: 14px;
    line-height: 1.6;
    color: #1f2937;
  }

  .report-attachments h4 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
  }

  .attachments-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background-color: #f9fafb;
    border-radius: 4px;
  }

  .attachment-name {
    flex: 1;
    font-size: 14px;
    color: #374151;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>