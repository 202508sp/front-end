<script lang="ts">
  import type { Report, ReportStatus } from '$lib/types/report';
  import type { ReportApproval, ReportDistribution } from '$lib/services/report';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { reportService } from '$lib/services/report';
  import { formatDate } from '$lib/utils/date';
  import Icon from '@iconify/svelte';
  
  interface Props {
    report: Report;
    isOpen: boolean;
    onClose: () => void;
    onApprovalComplete?: (report: Report) => void;
  }
  
  let { report, isOpen, onClose, onApprovalComplete }: Props = $props();
  
  // 状態
  let approvals = $state<ReportApproval[]>([]);
  let distributions = $state<ReportDistribution[]>([]);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // 承認フォーム
  let approvalForm = $state({
    comments: '',
    action: '' as 'approve' | 'reject' | ''
  });
  
  let showApprovalForm = $state(false);
  let selectedApproval = $state<ReportApproval | null>(null);
  
  // 初期化
  $effect(() => {
    if (isOpen && report) {
      loadReportHistory();
    }
  });
  
  async function loadReportHistory() {
    isLoading = true;
    error = null;
    
    try {
      const history = await reportService.getReportHistory(report.id);
      approvals = history.approvals;
      distributions = history.distributions;
    } catch (err) {
      error = err instanceof Error ? err.message : 'レポート履歴の読み込みに失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  function startApproval(approval: ReportApproval, action: 'approve' | 'reject') {
    selectedApproval = approval;
    approvalForm.action = action;
    approvalForm.comments = '';
    showApprovalForm = true;
  }
  
  async function submitApproval() {
    if (!selectedApproval || !approvalForm.action) return;
    
    isLoading = true;
    error = null;
    
    try {
      const currentStaffId = 'current-staff-id'; // TODO: 現在のスタッフIDを取得
      
      if (approvalForm.action === 'approve') {
        await reportService.approveReport(
          selectedApproval.id,
          currentStaffId,
          approvalForm.comments || undefined
        );
      } else {
        await reportService.rejectReport(
          selectedApproval.id,
          currentStaffId,
          approvalForm.comments
        );
      }
      
      // 履歴を再読み込み
      await loadReportHistory();
      
      showApprovalForm = false;
      selectedApproval = null;
      
      onApprovalComplete?.(report);
      
    } catch (err) {
      error = err instanceof Error ? err.message : '承認処理に失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  async function publishToFamily() {
    isLoading = true;
    error = null;
    
    try {
      await reportService.publishReportToFamily(report.id);
      await loadReportHistory();
      onApprovalComplete?.(report);
    } catch (err) {
      error = err instanceof Error ? err.message : '家族ポータルへの公開に失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  function getStatusColor(status: ReportStatus): string {
    switch (status) {
      case 'draft': return 'color:gray-600';
      case 'pending-review': return 'color:yellow-600';
      case 'approved': return 'color:green-600';
      case 'published': return 'color:blue-600';
      case 'archived': return 'color:gray-500';
      default: return 'color:gray-600';
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
  
  function getApprovalStatusIcon(status: 'pending' | 'approved' | 'rejected'): string {
    switch (status) {
      case 'pending': return 'material-symbols:schedule';
      case 'approved': return 'material-symbols:check-circle';
      case 'rejected': return 'material-symbols:cancel';
      default: return 'material-symbols:help';
    }
  }
  
  function getApprovalStatusColor(status: 'pending' | 'approved' | 'rejected'): string {
    switch (status) {
      case 'pending': return 'color:yellow-600';
      case 'approved': return 'color:green-600';
      case 'rejected': return 'color:red-600';
      default: return 'color:gray-600';
    }
  }
  
  function getDeliveryStatusIcon(status: 'pending' | 'delivered' | 'read' | 'failed'): string {
    switch (status) {
      case 'pending': return 'material-symbols:schedule';
      case 'delivered': return 'material-symbols:mark-email-unread';
      case 'read': return 'material-symbols:mark-email-read';
      case 'failed': return 'material-symbols:error';
      default: return 'material-symbols:help';
    }
  }
  
  function getDeliveryStatusColor(status: 'pending' | 'delivered' | 'read' | 'failed'): string {
    switch (status) {
      case 'pending': return 'color:yellow-600';
      case 'delivered': return 'color:blue-600';
      case 'read': return 'color:green-600';
      case 'failed': return 'color:red-600';
      default: return 'color:gray-600';
    }
  }
</script>

<Modal {isOpen} {onClose} title="レポート承認・配信管理" size="lg">
  <div class="h:600px flex flex:col">
    {#if error}
      <div class="p:16px bg:red-50 border-b:1px|solid|red-200">
        <div class="flex items:center gap:8px">
          <Icon icon="material-symbols:error" class="w:20px h:20px color:red-500" />
          <p class="color:red-600">{error}</p>
        </div>
      </div>
    {/if}
    
    <!-- レポート情報 -->
    <div class="p:16px border-b:1px|solid|gray-200 bg:gray-50">
      <div class="flex items:center justify:between mb:12px">
        <h2 class="font:18px font:bold">{report.title}</h2>
        <div class="flex items:center gap:12px">
          <span class="px:8px py:4px bg:white r:12px font:12px {getStatusColor(report.status)}">
            {getStatusLabel(report.status)}
          </span>
          {#if report.isPublishedToFamily}
            <span class="px:8px py:4px bg:green-100 color:green-800 r:12px font:12px">
              家族公開済み
            </span>
          {/if}
        </div>
      </div>
      
      <div class="grid grid-cols:3 gap:16px font:14px">
        <div>
          <span class="color:gray-600">作成者:</span>
          <span class="ml:4px">{report.authorName}</span>
        </div>
        <div>
          <span class="color:gray-600">作成日:</span>
          <span class="ml:4px">{formatDate(report.createdAt)}</span>
        </div>
        <div>
          <span class="color:gray-600">レポート日:</span>
          <span class="ml:4px">{formatDate(report.date)}</span>
        </div>
      </div>
    </div>
    
    <div class="flex:1 overflow:auto">
      {#if isLoading}
        <div class="flex items:center justify:center h:200px">
          <div class="flex items:center gap:8px">
            <Icon icon="material-symbols:refresh" class="w:20px h:20px animate:spin" />
            <span>読み込み中...</span>
          </div>
        </div>
      {:else}
        <div class="p:16px space-y:24px">
          <!-- 承認ワークフロー -->
          <div>
            <h3 class="font:16px font:bold mb:12px flex items:center gap:8px">
              <Icon icon="material-symbols:approval" class="w:20px h:20px" />
              承認ワークフロー
            </h3>
            
            {#if approvals.length === 0}
              <div class="p:16px bg:gray-50 r:8px text:center">
                <Icon icon="material-symbols:info" class="w:24px h:24px color:gray-400 mb:8px" />
                <p class="color:gray-600">承認ワークフローが設定されていません</p>
                {#if report.status === 'approved' && !report.isPublishedToFamily}
                  <Button onclick={publishToFamily} class="mt:12px" disabled={isLoading}>
                    家族ポータルに公開
                  </Button>
                {/if}
              </div>
            {:else}
              <div class="space-y:12px">
                {#each approvals as approval}
                  <div class="p:16px border:1px|solid|gray-200 r:8px">
                    <div class="flex items:center justify:between mb:8px">
                      <div class="flex items:center gap:8px">
                        <Icon 
                          icon={getApprovalStatusIcon(approval.status)} 
                          class="w:20px h:20px {getApprovalStatusColor(approval.status)}" 
                        />
                        <h4 class="font:14px font:medium">{approval.approverName}</h4>
                        <span class="px:6px py:2px bg:gray-100 color:gray-700 r:12px font:12px">
                          ステップ {approval.stepId}
                        </span>
                      </div>
                      
                      {#if approval.status === 'pending'}
                        <div class="flex gap:8px">
                          <Button 
                            variant="secondary" 
                            onclick={() => startApproval(approval, 'approve')}
                            disabled={isLoading}
                          >
                            承認
                          </Button>
                          <Button 
                            variant="secondary" 
                            onclick={() => startApproval(approval, 'reject')}
                            disabled={isLoading}
                            class="color:red-600 hover:bg:red-50"
                          >
                            却下
                          </Button>
                        </div>
                      {/if}
                    </div>
                    
                    <div class="font:12px color:gray-600">
                      <p>作成日: {formatDate(approval.createdAt)}</p>
                      {#if approval.approvedAt}
                        <p>処理日: {formatDate(approval.approvedAt)}</p>
                      {/if}
                      {#if approval.comments}
                        <p class="mt:4px">コメント: {approval.comments}</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          
          <!-- 配信履歴 -->
          <div>
            <h3 class="font:16px font:bold mb:12px flex items:center gap:8px">
              <Icon icon="material-symbols:send" class="w:20px h:20px" />
              配信履歴
            </h3>
            
            {#if distributions.length === 0}
              <div class="p:16px bg:gray-50 r:8px text:center">
                <Icon icon="material-symbols:info" class="w:24px h:24px color:gray-400 mb:8px" />
                <p class="color:gray-600">まだ家族ポータルに配信されていません</p>
              </div>
            {:else}
              <div class="space-y:12px">
                {#each distributions as distribution}
                  <div class="p:16px border:1px|solid|gray-200 r:8px">
                    <div class="flex items:center justify:between mb:8px">
                      <div class="flex items:center gap:8px">
                        <Icon 
                          icon={getDeliveryStatusIcon(distribution.deliveryStatus)} 
                          class="w:20px h:20px {getDeliveryStatusColor(distribution.deliveryStatus)}" 
                        />
                        <h4 class="font:14px font:medium">家族ポータル配信</h4>
                        <span class="px:6px py:2px bg:blue-100 color:blue-800 r:12px font:12px">
                          {distribution.familyMemberIds.length} 名
                        </span>
                      </div>
                      
                      <span class="font:12px color:gray-600">
                        {distribution.deliveryStatus === 'delivered' ? '配信済み' :
                         distribution.deliveryStatus === 'read' ? '既読' :
                         distribution.deliveryStatus === 'failed' ? '配信失敗' : '配信中'}
                      </span>
                    </div>
                    
                    <div class="font:12px color:gray-600">
                      <p>配信日: {formatDate(distribution.distributedAt)}</p>
                      {#if distribution.readAt}
                        <p>既読日: {formatDate(distribution.readAt)}</p>
                      {/if}
                      {#if distribution.readBy && distribution.readBy.length > 0}
                        <p>既読者: {distribution.readBy.length} 名</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- 承認フォームモーダル -->
  {#if showApprovalForm && selectedApproval}
    <Modal 
      isOpen={true} 
      onClose={() => showApprovalForm = false} 
      title={approvalForm.action === 'approve' ? 'レポート承認' : 'レポート却下'}
    >
      <div class="p:24px">
        <div class="mb:16px p:12px bg:gray-50 r:8px">
          <h4 class="font:14px font:medium mb:4px">対象レポート</h4>
          <p class="font:14px">{report.title}</p>
          <p class="font:12px color:gray-600">作成者: {report.authorName}</p>
        </div>
        
        <FormField 
          label={approvalForm.action === 'approve' ? 'コメント（任意）' : 'コメント（必須）'} 
          required={approvalForm.action === 'reject'}
        >
          <textarea
            bind:value={approvalForm.comments}
            class="w:full p:8px border:1px|solid|gray-300 r:4px min-h:80px"
            placeholder={approvalForm.action === 'approve' 
              ? '承認理由やコメントがあれば記載してください' 
              : '却下理由を記載してください'}
          ></textarea>
        </FormField>
      </div>
      
      <div class="flex justify:end gap:12px p:24px border-t:1px|solid|gray-200">
        <Button variant="secondary" onclick={() => showApprovalForm = false} disabled={isLoading}>
          キャンセル
        </Button>
        <Button 
          onclick={submitApproval} 
          disabled={isLoading || (approvalForm.action === 'reject' && !approvalForm.comments.trim())}
          class={approvalForm.action === 'reject' ? 'bg:red-600 hover:bg:red-700' : ''}
        >
          {isLoading ? '処理中...' : approvalForm.action === 'approve' ? '承認' : '却下'}
        </Button>
      </div>
    </Modal>
  {/if}
</Modal>