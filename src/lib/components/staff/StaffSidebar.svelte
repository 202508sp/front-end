<script lang="ts">
  import type { Staff } from '$lib/types/staff';
  import Sidebar from '$lib/components/ui/Sidebar.svelte';
  import StaffDetail from './StaffDetail.svelte';

  interface Props {
    staff: Staff | null;
    isOpen?: boolean;
    isFullscreen?: boolean;
    level?: number;
    onClose?: () => void;
    onToggleFullscreen?: () => void;
    onBack?: () => void;
    onStaffUpdate?: (staff: Staff) => void;
  }

  let {
    staff,
    isOpen = false,
    isFullscreen = false,
    level = 1,
    onClose,
    onToggleFullscreen,
    onBack,
    onStaffUpdate
  }: Props = $props();

  let isEditMode = $state(false);

  function handleEditToggle() {
    isEditMode = !isEditMode;
  }

  function handleStaffSave(updatedStaff: Staff) {
    onStaffUpdate?.(updatedStaff);
    isEditMode = false;
  }

  function handleEditCancel() {
    isEditMode = false;
  }
</script>

<Sidebar
  {isOpen}
  {isFullscreen}
  {level}
  title={staff?.name || '職員詳細'}
  subtitle={staff?.nameKana}
  width="wide"
  {onClose}
  {onToggleFullscreen}
  {onBack}
>
  {#snippet actions()}
    {#if staff && !isEditMode}
      <button
        type="button"
        class="
          items:center justify:center w:32px h:32px rounded:6px
          bg:transparent hover:bg:gray-100 transition:background-color|200ms
          focus:outline:2|solid|blue-500
          focus:outline-offset:2 flex
        "
        onclick={handleEditToggle}
        aria-label="編集"
        title="職員情報を編集"
      >
        <svg class="w:20px h:20px text:gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    {/if}
  {/snippet}

  {#if staff}
    <StaffDetail {staff} {isEditMode} onSave={handleStaffSave} onCancel={handleEditCancel} />
  {:else}
    <div class="items:center justify:center h:full flex">
      <div class="text:center py:8">
        <svg class="w:48px h:48px text:gray-300 mb:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p class="text:gray-500">職員を選択してください</p>
      </div>
    </div>
  {/if}
</Sidebar>