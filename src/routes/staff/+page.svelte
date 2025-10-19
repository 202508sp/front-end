<script lang="ts">
  import type { Staff } from '$lib/types/staff';
  import { staffStore } from '$lib/stores/staff.svelte';
  import StaffList from '$lib/components/staff/StaffList.svelte';
  import StaffSidebar from '$lib/components/staff/StaffSidebar.svelte';
  import StaffSchedule from '$lib/components/staff/StaffSchedule.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { onMount } from 'svelte';

  // Page state
  let selectedStaff = $state<Staff | null>(null);
  let isSidebarOpen = $state(false);
  let isSidebarFullscreen = $state(false);
  let activeView = $state<'list' | 'schedule'>('list');
  let showApprovalModal = $state(false);
  let pendingApprovals = $state<Staff[]>([]);

  // Load staff data on mount
  onMount(() => {
    staffStore.loadStaff();
    loadPendingApprovals();
  });

  // Handle staff selection
  function handleStaffSelect(staff: Staff) {
    selectedStaff = staff;
    isSidebarOpen = true;
    isSidebarFullscreen = false;
  }

  // Handle sidebar close
  function handleSidebarClose() {
    isSidebarOpen = false;
    selectedStaff = null;
  }

  // Handle sidebar fullscreen toggle
  function handleSidebarToggleFullscreen() {
    isSidebarFullscreen = !isSidebarFullscreen;
  }

  // Handle staff update
  async function handleStaffUpdate(updatedStaff: Staff) {
    try {
      await staffStore.updateStaff(updatedStaff.id, updatedStaff);
      selectedStaff = updatedStaff;
      
      // Show success message (you might want to implement a toast system)
      console.log('職員情報が更新されました');
    } catch (error) {
      console.error('職員情報の更新に失敗しました:', error);
    }
  }

  // Load pending approvals (mock implementation)
  async function loadPendingApprovals() {
    // TODO: Replace with actual API call
    // This would typically fetch staff updates that need approval
    pendingApprovals = [];
  }

  // Handle approval
  async function handleApproval(staff: Staff, approved: boolean) {
    try {
      if (approved) {
        await staffStore.updateStaff(staff.id, staff);
        console.log(`${staff.name}の変更が承認されました`);
      } else {
        console.log(`${staff.name}の変更が却下されました`);
      }
      
      // Remove from pending approvals
      pendingApprovals = pendingApprovals.filter(s => s.id !== staff.id);
    } catch (error) {
      console.error('承認処理に失敗しました:', error);
    }
  }

  // Handle schedule management
  async function handleScheduleAdd(staffId: string, schedule: any) {
    try {
      await staffStore.addSchedule(staffId, schedule);
      console.log('スケジュールが追加されました');
    } catch (error) {
      console.error('スケジュールの追加に失敗しました:', error);
    }
  }

  async function handleScheduleUpdate(staffId: string, scheduleId: string, updates: any) {
    try {
      await staffStore.updateSchedule(staffId, scheduleId, updates);
      console.log('スケジュールが更新されました');
    } catch (error) {
      console.error('スケジュールの更新に失敗しました:', error);
    }
  }

  async function handleScheduleDelete(staffId: string, scheduleId: string) {
    try {
      await staffStore.deleteSchedule(staffId, scheduleId);
      console.log('スケジュールが削除されました');
    } catch (error) {
      console.error('スケジュールの削除に失敗しました:', error);
    }
  }

  // Switch view mode
  function setActiveView(view: 'list' | 'schedule') {
    activeView = view;
    if (view === 'schedule') {
      // Close sidebar when switching to schedule view
      isSidebarOpen = false;
      selectedStaff = null;
    }
  }
</script>

<svelte:head>
  <title>職員管理 - 介護施設ダッシュボード</title>
</svelte:head>

<div class="flex h:screen bg:care-background-secondary">
  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col {isSidebarOpen && !isSidebarFullscreen ? 'mr:96' : ''}">
    <!-- Header -->
    <div class="flex-shrink:0 bg:white border-b:1|solid|care-gray-200 px:6 py:4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text:2xl font:bold text:care-text-primary">職員管理</h1>
          <p class="text:care-text-secondary mt:1">
            職員情報の管理とスケジュール調整を行います
          </p>
        </div>
        
        <div class="flex items-center gap:3">
          <!-- Pending Approvals Badge -->
          {#if pendingApprovals.length > 0}
            <Button
              variant="outline"
              size="sm"
              onclick={() => showApprovalModal = true}
              class="relative"
            >
              {#snippet children()}
                <svg class="w:4 h:4 mr:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                承認待ち
                <span class="absolute -top:2 -right:2 bg:care-accent-error-500 text:white text:xs rounded:full w:5 h:5 flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              {/snippet}
            </Button>
          {/if}
          
          <!-- View Toggle -->
          <div class="flex border:1|solid|care-gray-300 rounded:lg overflow:hidden">
            <button
              type="button"
              class="px:4 py:2 text:sm font:medium {activeView === 'list' ? 'bg:care-primary-500 text:white' : 'bg:white text:care-text-primary hover:bg:care-gray-50'}"
              onclick={() => setActiveView('list')}
            >
              <svg class="w:4 h:4 mr:2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              職員一覧
            </button>
            <button
              type="button"
              class="px:4 py:2 text:sm font:medium border-l:1|solid|care-gray-300 {activeView === 'schedule' ? 'bg:care-primary-500 text:white' : 'bg:white text:care-text-primary hover:bg:care-gray-50'}"
              onclick={() => setActiveView('schedule')}
            >
              <svg class="w:4 h:4 mr:2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0h4l-4 4-4-4h4z" />
              </svg>
              スケジュール
            </button>
          </div>
          
          <!-- Add Staff Button -->
          <Button variant="primary" size="sm">
            {#snippet children()}
              <svg class="w:4 h:4 mr:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              職員を追加
            {/snippet}
          </Button>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 overflow:hidden">
      {#if activeView === 'list'}
        <!-- Staff List View -->
        <StaffList
          onStaffSelect={handleStaffSelect}
          class="h:full"
          data-testid="staff-list-view"
        />
      {:else if activeView === 'schedule'}
        <!-- Schedule View -->
        <StaffSchedule
          class="h:full"
          data-testid="staff-schedule-view"
        />
      {/if}
    </div>
  </div>

  <!-- Staff Detail Sidebar -->
  <StaffSidebar
    staff={selectedStaff}
    isOpen={isSidebarOpen}
    isFullscreen={isSidebarFullscreen}
    onClose={handleSidebarClose}
    onToggleFullscreen={handleSidebarToggleFullscreen}
    onStaffUpdate={handleStaffUpdate}
  />
</div>

<!-- Approval Modal -->
{#if showApprovalModal}
  <Modal
    isOpen={showApprovalModal}
    onClose={() => showApprovalModal = false}
    title="承認待ちの変更"
    size="lg"
  >
    <div class="space-y:4">
      <p class="text:care-text-secondary">
        以下の職員情報変更が承認待ちです。各項目を確認して承認または却下してください。
      </p>
      
      {#if pendingApprovals.length === 0}
        <div class="text:center py:8">
          <svg class="h:12 w:12 text:care-gray-300 mx:auto mb:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text:care-text-secondary">承認待ちの項目はありません</p>
        </div>
      {:else}
        <div class="space-y:4 max-h:96 overflow-y:auto">
          {#each pendingApprovals as staff}
            <div class="border:1|solid|care-gray-200 rounded:lg p:4">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font:medium text:care-text-primary">{staff.name}</h4>
                  <p class="text:sm text:care-text-secondary">{staff.nameKana} - {staff.department}</p>
                  <div class="mt:2 text:sm text:care-text-secondary">
                    <p>変更内容: 基本情報の更新</p>
                    <p>申請日: {new Date().toLocaleDateString('ja-JP')}</p>
                  </div>
                </div>
                <div class="flex gap:2 ml:4">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => handleApproval(staff, false)}
                  >
                    {#snippet children()}
                      却下
                    {/snippet}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onclick={() => handleApproval(staff, true)}
                  >
                    {#snippet children()}
                      承認
                    {/snippet}
                  </Button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
    
    {#snippet footer()}
      <Button variant="outline" onclick={() => showApprovalModal = false}>
        閉じる
      </Button>
    {/snippet}
  </Modal>
{/if}

<style>
  /* Custom styles for the staff management page */
  :global(.staff-management) {
    --care-primary-50: #eff6ff;
    --care-primary-100: #dbeafe;
    --care-primary-500: #3b82f6;
    --care-primary-600: #2563eb;
    --care-gray-50: #f9fafb;
    --care-gray-100: #f3f4f6;
    --care-gray-200: #e5e7eb;
    --care-gray-300: #d1d5db;
    --care-text-primary: #111827;
    --care-text-secondary: #6b7280;
    --care-background-primary: #ffffff;
    --care-background-secondary: #f9fafb;
    --care-accent-error-500: #ef4444;
    --care-accent-success-100: #dcfce7;
    --care-accent-success-700: #15803d;
    --care-accent-warning-100: #fef3c7;
    --care-accent-warning-700: #a16207;
    --care-secondary-100: #e0e7ff;
    --care-secondary-700: #3730a3;
  }
</style>