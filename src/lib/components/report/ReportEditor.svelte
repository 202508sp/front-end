<script lang="ts">
  import type { Report, ReportTemplate, ReportSectionData, ReportType, ReportStatus } from '$lib/types/report';
  import type { User } from '$lib/types/user';
  import Button from '$lib/components/ui/Button.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import FormField from '$lib/components/ui/FormField.svelte';
  import { reportStore } from '$lib/stores/report.svelte';
  import { userStore } from '$lib/stores/user.svelte';
  
  interface Props {
    report?: Report;
    template?: ReportTemplate;
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (report: Report) => void;
  }
  
  let { report, template, userId, isOpen, onClose, onSave }: Props = $props();
  
  // フォーム状態
  let formData = $state({
    title: '',
    type: 'daily' as ReportType,
    content: '',
    sections: [] as ReportSectionData[],
    tags: [] as string[],
    isPublishedToFamily: false,
    status: 'draft' as ReportStatus
  });
  
  let tagInput = $state('');
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  
  // 利用者情報
  let selectedUser = $derived(
    userStore.users.find(user => user.id === userId)
  );
  
  // テンプレートが選択された時の初期化
  $effect(() => {
    if (template && isOpen) {
      initializeFromTemplate(template);
    } else if (report && isOpen) {
      initializeFromReport(report);
    } else if (isOpen) {
      resetForm();
    }
  });
  
  function initializeFromTemplate(template: ReportTemplate) {
    formData = {
      title: `${template.name} - ${new Date().toLocaleDateString('ja-JP')}`,
      type: template.type,
      content: '',
      sections: template.sections.map(section => ({
        sectionId: section.id,
        title: section.title,
        type: section.type,
        value: '',
        isCompleted: false
      })),
      tags: [],
      isPublishedToFamily: false,
      status: 'draft'
    };
  }
  
  function initializeFromReport(report: Report) {
    formData = {
      title: report.title,
      type: report.type,
      content: report.content,
      sections: [...report.sections],
      tags: [...report.tags],
      isPublishedToFamily: report.isPublishedToFamily,
      status: report.status
    };
  }
  
  function resetForm() {
    formData = {
      title: '',
      type: 'daily',
      content: '',
      sections: [],
      tags: [],
      isPublishedToFamily: false,
      status: 'draft'
    };
    tagInput = '';
    error = null;
  }
  
  function updateSectionValue(sectionId: string, value: any) {
    const section = formData.sections.find(s => s.sectionId === sectionId);
    if (section) {
      section.value = value;
      section.isCompleted = value !== '' && value !== null && value !== undefined;
    }
  }
  
  function addTag() {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      formData.tags.push(tagInput.trim());
      tagInput = '';
    }
  }
  
  function removeTag(tag: string) {
    formData.tags = formData.tags.filter(t => t !== tag);
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  }
  
  async function handleSave() {
    if (!validateForm()) return;
    
    isLoading = true;
    error = null;
    
    try {
      const reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'> = {
        userId,
        authorId: 'current-staff-id', // TODO: 現在のスタッフIDを取得
        authorName: '現在のスタッフ', // TODO: 現在のスタッフ名を取得
        templateId: template?.id,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        sections: formData.sections,
        attachments: [],
        date: new Date(),
        status: formData.status,
        isPublishedToFamily: formData.isPublishedToFamily,
        tags: formData.tags
      };
      
      let savedReport: Report;
      
      if (report) {
        // 更新
        await reportStore.updateReport(report.id, reportData);
        savedReport = { ...report, ...reportData, updatedAt: new Date() };
      } else {
        // 新規作成
        savedReport = await reportStore.createReport(reportData);
      }
      
      onSave(savedReport);
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'レポートの保存に失敗しました';
    } finally {
      isLoading = false;
    }
  }
  
  function validateForm(): boolean {
    if (!formData.title.trim()) {
      error = 'タイトルを入力してください';
      return false;
    }
    
    if (!formData.content.trim() && formData.sections.length === 0) {
      error = '内容またはセクションを入力してください';
      return false;
    }
    
    // 必須セクションのチェック
    if (template) {
      const requiredSections = template.sections.filter(s => s.isRequired);
      for (const requiredSection of requiredSections) {
        const sectionData = formData.sections.find(s => s.sectionId === requiredSection.id);
        if (!sectionData || !sectionData.value || sectionData.value.toString().trim() === '') {
          error = `「${requiredSection.title}」は必須項目です`;
          return false;
        }
      }
    }
    
    return true;
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
    { value: 'published', label: '公開済み' }
  ];
</script>

<Modal {isOpen} {onClose} title={report ? 'レポート編集' : 'レポート作成'} size="lg">
  <div class="p:24px">
    {#if selectedUser}
      <div class="mb:20px p:16px bg:gray-50 r:8px">
        <h3 class="font:16px font:bold mb:8px">対象利用者</h3>
        <p class="font:14px">{selectedUser?.name} ({selectedUser?.nameKana})</p>
      </div>
    {/if}
    
    {#if error}
      <div class="mb:20px p:12px bg:red-50 border:1px|solid|red-200 r:4px">
        <p class="font:14px color:red-600">{error}</p>
      </div>
    {/if}
    
    <form class="space-y:20px">
      <!-- 基本情報 -->
      <div class="grid grid-cols:2 gap:16px">
        <FormField label="タイトル" required>
          <input
            type="text"
            bind:value={formData.title}
            class="w:full p:8px border:1px|solid|gray-300 r:4px"
            placeholder="レポートのタイトルを入力"
          />
        </FormField>
        
        <FormField label="レポート種別" required>
          <select
            bind:value={formData.type}
            class="w:full p:8px border:1px|solid|gray-300 r:4px"
          >
            {#each reportTypeOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </FormField>
      </div>
      
      <div class="grid grid-cols:2 gap:16px">
        <FormField label="ステータス">
          <select
            bind:value={formData.status}
            class="w:full p:8px border:1px|solid|gray-300 r:4px"
          >
            {#each statusOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </FormField>
        
        <FormField label="家族ポータル公開">
          <label class="flex items:center gap:8px">
            <input
              type="checkbox"
              bind:checked={formData.isPublishedToFamily}
              class="w:16px h:16px"
            />
            <span class="font:14px">家族ポータルに公開する</span>
          </label>
        </FormField>
      </div>
      
      <!-- セクション -->
      {#if formData.sections.length > 0}
        <div>
          <h3 class="font:16px font:bold mb:12px">レポート項目</h3>
          <div class="space-y:16px">
            {#each formData.sections as section}
              <FormField 
                label={section.title} 
                required={template?.sections.find(s => s.id === section.sectionId)?.isRequired}
              >
                {#if section.type === 'text'}
                  <textarea
                    bind:value={section.value}
                    onchange={() => updateSectionValue(section.sectionId, section.value)}
                    class="w:full p:8px border:1px|solid|gray-300 r:4px min-h:80px"
                    placeholder={template?.sections.find(s => s.id === section.sectionId)?.config?.placeholder || ''}
                  ></textarea>
                {:else if section.type === 'checklist'}
                  <!-- TODO: チェックリスト実装 -->
                  <div class="p:8px border:1px|solid|gray-300 r:4px bg:gray-50">
                    <p class="font:14px color:gray-600">チェックリスト機能は今後実装予定</p>
                  </div>
                {:else if section.type === 'rating'}
                  <!-- TODO: 評価実装 -->
                  <div class="p:8px border:1px|solid|gray-300 r:4px bg:gray-50">
                    <p class="font:14px color:gray-600">評価機能は今後実装予定</p>
                  </div>
                {/if}
              </FormField>
            {/each}
          </div>
        </div>
      {/if}
      
      <!-- 自由記述 -->
      <FormField label="内容" required={formData.sections.length === 0}>
        <textarea
          bind:value={formData.content}
          class="w:full p:8px border:1px|solid|gray-300 r:4px min-h:120px"
          placeholder="レポートの詳細内容を記載してください"
        ></textarea>
      </FormField>
      
      <!-- タグ -->
      <FormField label="タグ">
        <div class="space-y:8px">
          <div class="flex gap:8px">
            <input
              type="text"
              bind:value={tagInput}
              onkeypress={handleKeyPress}
              class="flex:1 p:8px border:1px|solid|gray-300 r:4px"
              placeholder="タグを入力してEnterキーで追加"
            />
            <Button variant="secondary" onclick={addTag} disabled={!tagInput.trim()}>
              追加
            </Button>
          </div>
          
          {#if formData.tags.length > 0}
            <div class="flex flex:wrap gap:8px">
              {#each formData.tags as tag}
                <span class="inline-flex items:center gap:4px px:8px py:4px bg:blue-100 color:blue-800 r:16px font:12px">
                  {tag}
                  <button
                    type="button"
                    onclick={() => removeTag(tag)}
                    class="w:16px h:16px flex items:center justify:center r:50% bg:blue-200 hover:bg:blue-300"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
        </div>
      </FormField>
    </form>
  </div>
  
  <div class="flex justify:end gap:12px p:24px border-t:1px|solid|gray-200">
    <Button variant="secondary" onclick={onClose} disabled={isLoading}>
      キャンセル
    </Button>
    <Button onclick={handleSave} disabled={isLoading}>
      {isLoading ? '保存中...' : report ? '更新' : '作成'}
    </Button>
  </div>
</Modal>