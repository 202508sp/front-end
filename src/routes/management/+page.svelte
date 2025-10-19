<script lang="ts">
  import type { Report, ReportTemplate } from '$lib/types/report';
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { 
    ReportEditor, 
    ReportList, 
    ReportTemplateManager, 
    ReportApproval 
  } from '$lib/components/report';
  import { reportStore } from '$lib/stores/report.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  import Icon from '@iconify/svelte';
  
  // 状態
  let activeTab = $state<'reports' | 'templates' | 'approvals'>('reports');
  let selectedUser = $state<User | null>(null);
  let selectedReport = $state<Report | null>(null);
  let selectedTemplate = $state<ReportTemplate | null>(null);
  
  // モーダル状態
  let showReportEditor = $state(false);
  let showTemplateManager = $state(false);
  let showReportApproval = $state(false);
  let showUserSelector = $state(false);
  
  // 初期化
  $effect(() => {
    userStore.loadUsers();
    reportStore.loadReports();
    reportStore.loadTemplates();
  });
  
  // 承認待ちレポート
  let pendingReports = $derived(
    reportStore.reports.filter(report => report.status === 'pending-review')
  );
  
  function startCreateReport() {
    if (!selectedUser) {
      showUserSelector = true;
      return;
    }
    
    selectedReport = null;
    selectedTemplate = null;
    showReportEditor = true;
  }
  
  function startCreateReportWithTemplate() {
    if (!selectedUser) {
      showUserSelector = true;
      return;
    }
    
    selectedReport = null;
    showTemplateManager = true;
  }
  
  function handleTemplateSelect(template: ReportTemplate) {
    selectedTemplate = template;
    showTemplateManager = false;
    showReportEditor = true;
  }
  
  function handleUserSelect(user: User) {
    selectedUser = user;
    showUserSelector = false;
    
    // ユーザー選択後、元の操作を続行
    if (selectedTemplate) {
      showReportEditor = true;
    } else {
      startCreateReport();
    }
  }
  
  function handleReportEdit(report: Report) {
    selectedReport = report;
    selectedTemplate = null;
    
    // 利用者を設定
    const user = userStore.users.find(u => u.id === report.userId);
    if (user) {
      selectedUser = user;
    }
    
    showReportEditor = true;
  }
  
  function handleReportApproval(report: Report) {
    selectedReport = report;
    showReportApproval = true;
  }
  
  function handleReportSave(report: Report) {
    console.log('Report saved:', report);
    // レポート一覧を再読み込み
    reportStore.loadReports();
  }
  
  function handleReportDelete(report: Report) {
    if (confirm(`レポート「${report.title}」を削除しますか？`)) {
      reportStore.deleteReport(report.id);
    }
  }
  
  function handleApprovalComplete(report: Report) {
    console.log('Approval completed:', report);
    // レポート一覧を再読み込み
    reportStore.loadReports();
  }
</script>

<svelte:head>
  <title>管理・家族連携 - 介護施設ダッシュボード</title>
</svelte:head>

<div class="h:full flex flex:col">
  <!-- ヘッダー -->
  <div class="p:20px border-b:1px|solid|gray-200 bg:white">
    <div class="flex items:center justify:between mb:16px">
      <div>
        <h1 class="font:24px font:bold mb:4px">管理・家族連携</h1>
        <p class="color:gray-600">レポート作成・承認・配信管理</p>
      </div>
      
      <div class="flex items:center gap:12px">
        {#if pendingReports.length > 0}
          <div class="flex items:center gap:6px px:12px py:6px bg:yellow-100 color:yellow-800 r:16px">
            <Icon icon="material-symbols:notification-important" class="w:16px h:16px" />
            <span class="font:12px font:medium">承認待ち {pendingReports.length} 件</span>
          </div>
        {/if}
        
        <Button onclick={startCreateReportWithTemplate} class="flex items:center gap:6px">
          <Icon icon="material-symbols:description" class="w:16px h:16px" />
          テンプレートから作成
        </Button>
        
        <Button onclick={startCreateReport} class="flex items:center gap:6px">
          <Icon icon="material-symbols:add" class="w:16px h:16px" />
          新規レポート
        </Button>
      </div>
    </div>
    
    <!-- タブナビゲーション -->
    <div class="flex border-b:1px|solid|gray-200">
      <button
        class="px:16px py:8px font:14px font:medium border-b:2px|solid|{activeTab === 'reports' ? 'blue-500' : 'transparent'} color:{activeTab === 'reports' ? 'blue-600' : 'gray-600'} hover:color:blue-600"
        onclick={() => activeTab = 'reports'}
      >
        レポート一覧
      </button>
      
      <button
        class="px:16px py:8px font:14px font:medium border-b:2px|solid|{activeTab === 'approvals' ? 'blue-500' : 'transparent'} color:{activeTab === 'approvals' ? 'blue-600' : 'gray-600'} hover:color:blue-600 relative"
        onclick={() => activeTab = 'approvals'}
      >
        承認管理
        {#if pendingReports.length > 0}
          <span class="absolute -top:4px -right:4px w:18px h:18px bg:red-500 color:white r:50% flex items:center justify:center font:10px font:bold">
            {pendingReports.length}
          </span>
        {/if}
      </button>
      
      <button
        class="px:16px py:8px font:14px font:medium border-b:2px|solid|{activeTab === 'templates' ? 'blue-500' : 'transparent'} color:{activeTab === 'templates' ? 'blue-600' : 'gray-600'} hover:color:blue-600"
        onclick={() => activeTab = 'templates'}
      >
        テンプレート管理
      </button>
    </div>
  </div>
  
  <!-- コンテンツエリア -->
  <div class="flex:1 overflow:hidden">
    {#if activeTab === 'reports'}
      <!-- レポート一覧 -->
      <ReportList
        onReportEdit={handleReportEdit}
        onReportDelete={handleReportDelete}
        onReportSelect={(report) => {
          if (report.status === 'pending-review') {
            handleReportApproval(report);
          }
        }}
        showActions={true}
      />
      
    {:else if activeTab === 'approvals'}
      <!-- 承認管理 -->
      <div class="h:full p:20px">
        {#if pendingReports.length === 0}
          <div class="flex items:center justify:center h:full">
            <div class="text:center">
              <Icon icon="material-symbols:task-alt" class="w:48px h:48px color:green-500 mb:12px" />
              <h2 class="font:18px font:bold mb:8px">承認待ちのレポートはありません</h2>
              <p class="color:gray-600">全てのレポートが処理済みです</p>
            </div>
          </div>
        {:else}
          <div class="space-y:16px">
            <h2 class="font:18px font:bold">承認待ちレポート ({pendingReports.length} 件)</h2>
            
            <div class="grid gap:16px">
              {#each pendingReports as report}
                <div class="p:16px border:1px|solid|gray-200 r:8px hover:shadow-md transition:shadow">
                  <div class="flex items:start justify:between mb:12px">
                    <div class="flex:1">
                      <h3 class="font:16px font:medium mb:4px">{report.title}</h3>
                      <div class="flex items:center gap:16px font:14px color:gray-600">
                        <span>作成者: {report.authorName}</span>
                        <span>作成日: {new Date(report.createdAt).toLocaleDateString('ja-JP')}</span>
                        <span>レポート日: {new Date(report.date).toLocaleDateString('ja-JP')}</span>
                      </div>
                      
                      {#if report.tags.length > 0}
                        <div class="flex flex:wrap gap:6px mt:8px">
                          {#each report.tags as tag}
                            <span class="px:6px py:2px bg:gray-100 color:gray-700 r:12px font:12px">
                              {tag}
                            </span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                    
                    <div class="flex items:center gap:8px">
                      <span class="px:8px py:4px bg:yellow-100 color:yellow-800 r:12px font:12px">
                        承認待ち
                      </span>
                      
                      <Button onclick={() => handleReportApproval(report)}>
                        承認処理
                      </Button>
                    </div>
                  </div>
                  
                  {#if report.content}
                    <div class="p:12px bg:gray-50 r:8px">
                      <p class="font:14px line-height:1.6 line-clamp:3">{report.content}</p>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
    {:else if activeTab === 'templates'}
      <!-- テンプレート管理 -->
      <div class="h:full p:20px">
        <div class="flex items:center justify:between mb:16px">
          <h2 class="font:18px font:bold">レポートテンプレート</h2>
          <Button onclick={() => showTemplateManager = true}>
            <Icon icon="material-symbols:settings" class="w:16px h:16px mr:6px" />
            テンプレート管理
          </Button>
        </div>
        
        {#if reportStore.templates.length === 0}
          <div class="flex items:center justify:center h:400px">
            <div class="text:center">
              <Icon icon="material-symbols:description" class="w:48px h:48px color:gray-400 mb:12px" />
              <h3 class="font:16px font:bold mb:8px">テンプレートがありません</h3>
              <p class="color:gray-600 mb:16px">レポートテンプレートを作成して効率的にレポートを作成しましょう</p>
              <Button onclick={() => showTemplateManager = true}>
                テンプレートを作成
              </Button>
            </div>
          </div>
        {:else}
          <div class="grid grid-cols:1 md:grid-cols:2 lg:grid-cols:3 gap:16px">
            {#each reportStore.templates as template}
              <div class="p:16px border:1px|solid|gray-200 r:8px hover:shadow-md transition:shadow">
                <div class="flex items:start justify:between mb:12px">
                  <h3 class="font:16px font:medium">{template.name}</h3>
                  {#if template.isDefault}
                    <span class="px:6px py:2px bg:green-100 color:green-800 r:12px font:10px">
                      デフォルト
                    </span>
                  {/if}
                </div>
                
                <p class="font:14px color:gray-600 mb:8px">
                  {template.type === 'daily' ? '日次レポート' :
                   template.type === 'medical' ? '医療レポート' :
                   template.type === 'incident' ? 'インシデントレポート' :
                   template.type === 'progress' ? '経過レポート' :
                   template.type === 'family-communication' ? '家族連絡' :
                   template.type === 'monthly-summary' ? '月次サマリー' : template.type}
                </p>
                
                <p class="font:12px color:gray-500 mb:12px">
                  {template.sections.length} セクション
                </p>
                
                <Button 
                  variant="secondary" 
                  onclick={() => handleTemplateSelect(template)}
                  class="w:full"
                >
                  このテンプレートを使用
                </Button>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- レポート編集モーダル -->
{#if showReportEditor && selectedUser}
  <ReportEditor
    report={selectedReport || undefined}
    template={selectedTemplate || undefined}
    userId={selectedUser.id}
    isOpen={showReportEditor}
    onClose={() => {
      showReportEditor = false;
      selectedReport = null;
      selectedTemplate = null;
    }}
    onSave={handleReportSave}
  />
{/if}

<!-- テンプレート管理モーダル -->
<ReportTemplateManager
  isOpen={showTemplateManager}
  onClose={() => showTemplateManager = false}
  onTemplateSelect={handleTemplateSelect}
/>

<!-- レポート承認モーダル -->
{#if showReportApproval && selectedReport}
  <ReportApproval
    report={selectedReport}
    isOpen={showReportApproval}
    onClose={() => {
      showReportApproval = false;
      selectedReport = null;
    }}
    onApprovalComplete={handleApprovalComplete}
  />
{/if}

<!-- 利用者選択モーダル -->
{#if showUserSelector}
  <Modal 
    isOpen={true} 
    onClose={() => showUserSelector = false} 
    title="利用者を選択"
  >
    <div class="p:24px">
      <div class="mb:16px">
        <p class="font:14px color:gray-600">レポートを作成する利用者を選択してください</p>
      </div>
      
      {#if userStore.users.length === 0}
        <div class="text:center py:32px">
          <Icon icon="material-symbols:person" class="w:32px h:32px color:gray-400 mb:8px" />
          <p class="color:gray-600">利用者が登録されていません</p>
        </div>
      {:else}
        <div class="max-h:400px overflow:auto space-y:8px">
          {#each userStore.users as user}
            <button
              class="w:full p:12px text:left border:1px|solid|gray-200 r:8px hover:bg:gray-50 hover:border:blue-300"
              onclick={() => handleUserSelect(user)}
            >
              <div class="flex items:center justify:between">
                <div>
                  <h3 class="font:14px font:medium">{user.name}</h3>
                  <p class="font:12px color:gray-600">{user.nameKana}</p>
                </div>
                <div class="text:right">
                  <p class="font:12px color:gray-500">要介護度 {user.careLevel}</p>
                  <p class="font:12px color:gray-500">
                    {new Date().getFullYear() - new Date(user.birthDate).getFullYear()}歳
                  </p>
                </div>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
    
    <div class="flex justify:end p:24px border-t:1px|solid|gray-200">
      <Button variant="secondary" onclick={() => showUserSelector = false}>
        キャンセル
      </Button>
    </div>
  </Modal>
{/if}