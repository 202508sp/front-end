<script lang="ts">
  import type { Staff, StaffRole, Permission, Qualification, WorkSchedule } from '$lib/types/staff';
  import type { ValidationError } from '$lib/types/common';
  import FormField from '$lib/components/ui/FormField.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import { formatDate } from '$lib/utils/date';
  import { validateStaffData } from '$lib/utils/validation';

  interface Props {
    staff: Staff;
    isEditMode?: boolean;
    onSave?: (staff: Staff) => void;
    onCancel?: () => void;
  }

  let { staff, isEditMode = false, onSave, onCancel }: Props = $props();

  // Edit form state
  let editedStaff = $state<Staff>(structuredClone(staff));
  let activeTab = $state<'basic' | 'permissions' | 'qualifications' | 'schedule'>('basic');
  let validationErrors = $state<ValidationError[]>([]);
  let isValidating = $state(false);
  let isSaving = $state(false);

  // Role options
  const roleOptions: { value: StaffRole; label: string }[] = [
    { value: 'admin', label: '管理者' },
    { value: 'manager', label: 'マネージャー' },
    { value: 'caregiver', label: '介護士' },
    { value: 'nurse', label: '看護師' },
    { value: 'therapist', label: 'セラピスト' },
    { value: 'support', label: 'サポート' }
  ];

  // Permission options
  const permissionOptions: { value: Permission; label: string; description: string }[] = [
    { value: 'user.read', label: '利用者閲覧', description: '利用者情報を閲覧できます' },
    { value: 'user.write', label: '利用者編集', description: '利用者情報を編集できます' },
    { value: 'staff.read', label: '職員閲覧', description: '職員情報を閲覧できます' },
    { value: 'staff.write', label: '職員編集', description: '職員情報を編集できます' },
    { value: 'statistics.read', label: '統計閲覧', description: '統計情報を閲覧できます' },
    { value: 'settings.write', label: '設定編集', description: 'システム設定を編集できます' },
    { value: 'reports.write', label: 'レポート作成', description: 'レポートを作成・編集できます' },
    { value: 'family.communicate', label: '家族連携', description: '家族とのコミュニケーションができます' }
  ];

  // Update edited staff when staff prop changes
  $effect(() => {
    if (!isEditMode) {
      editedStaff = structuredClone(staff);
    }
  });

  async function handleSave() {
    isValidating = true;
    validationErrors = [];

    try {
      // バリデーション実行
      const errors = validateStaffData(editedStaff);
      
      if (errors.length > 0) {
        validationErrors = errors;
        // 最初のエラーがあるタブに切り替え
        const firstError = errors[0];
        if (firstError.field.includes('権限')) {
          activeTab = 'permissions';
        } else if (firstError.field.includes('資格')) {
          activeTab = 'qualifications';
        } else if (firstError.field.includes('スケジュール')) {
          activeTab = 'schedule';
        } else {
          activeTab = 'basic';
        }
        return;
      }

      isSaving = true;
      await onSave?.(editedStaff);
    } catch (error) {
      console.error('保存エラー:', error);
      validationErrors = [{
        field: 'general',
        message: '保存中にエラーが発生しました',
        code: 'save_error'
      }];
    } finally {
      isValidating = false;
      isSaving = false;
    }
  }

  function handleCancel() {
    editedStaff = structuredClone(staff);
    validationErrors = [];
    onCancel?.();
  }

  // フィールド固有のエラーを取得
  function getFieldError(fieldName: string): ValidationError | undefined {
    return validationErrors.find(error => error.field === fieldName);
  }

  // フィールドにエラーがあるかチェック
  function hasFieldError(fieldName: string): boolean {
    return validationErrors.some(error => error.field === fieldName);
  }

  // Get role label
  function getRoleLabel(role: StaffRole): string {
    const option = roleOptions.find(opt => opt.value === role);
    return option?.label || role;
  }

  // Permission management
  function togglePermission(permission: Permission) {
    const index = editedStaff.permissions.indexOf(permission);
    if (index === -1) {
      editedStaff.permissions = [...editedStaff.permissions, permission];
    } else {
      editedStaff.permissions = editedStaff.permissions.filter(p => p !== permission);
    }
  }

  function hasPermission(permission: Permission): boolean {
    return editedStaff.permissions.includes(permission);
  }

  // Qualification management
  function addQualification() {
    editedStaff.qualifications = [
      ...editedStaff.qualifications,
      {
        id: crypto.randomUUID(),
        name: '',
        issuer: '',
        issueDate: new Date(),
        certificateNumber: ''
      }
    ];
  }

  function removeQualification(qualificationId: string) {
    editedStaff.qualifications = editedStaff.qualifications.filter(
      (qual) => qual.id !== qualificationId
    );
  }

  // Schedule management
  function addSchedule() {
    editedStaff.schedule = [
      ...editedStaff.schedule,
      {
        id: crypto.randomUUID(),
        date: new Date(),
        startTime: '09:00',
        endTime: '18:00',
        shiftType: 'day',
        isConfirmed: false,
        notes: ''
      }
    ];
  }

  function removeSchedule(scheduleId: string) {
    editedStaff.schedule = editedStaff.schedule.filter(
      (schedule) => schedule.id !== scheduleId
    );
  }

  // Calculate years of service
  function calculateYearsOfService(hireDate: Date): number {
    const today = new Date();
    const years = today.getFullYear() - hireDate.getFullYear();
    const monthDiff = today.getMonth() - hireDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
      return years - 1;
    }
    
    return years;
  }
</script>

<div class="flex:col h:full flex">
  {#if isEditMode}
    <!-- Edit Mode Header -->
    <div class="p:4 border-b:1|solid|gray-200 bg:blue-50">
      <div class="items:center justify:between flex">
        <div>
          <h3 class="text:lg font:semibold text:blue-900">編集モード</h3>
          <p class="text:sm text:blue-700">職員情報を編集しています</p>
        </div>
        <div class="gap:2 flex">
          <Button variant="outline" size="sm" onclick={handleCancel} disabled={isSaving}>
            キャンセル
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onclick={handleSave} 
            disabled={isValidating || isSaving}
          >
            {#if isSaving}
              <svg class="animate:spin w:4 h:4 mr:2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity:25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity:75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              保存中...
            {:else if isValidating}
              検証中...
            {:else}
              保存
            {/if}
          </Button>
        </div>
      </div>
    </div>

    <!-- Validation Errors -->
    {#if validationErrors.length > 0}
      <div class="p:4 bg:red-50 border-b:1|solid|red-200">
        <div class="items:start flex">
          <svg class="w:5 h:5 text:red-500 mt:0.5 mr:2 flex-shrink:0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="flex:1">
            <h4 class="text:sm font:medium text:red-800 mb:1">入力内容に問題があります</h4>
            <ul class="text:sm text:red-700 space-y:1">
              {#each validationErrors.slice(0, 5) as error}
                <li>• {error.message}</li>
              {/each}
              {#if validationErrors.length > 5}
                <li class="text:red-600">他 {validationErrors.length - 5} 件のエラー</li>
              {/if}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Tab Navigation -->
  <div class="border-b:1|solid|gray-200 bg:gray-50">
    <nav class="flex">
      <button
        type="button"
        class="
          px:4 py:3 text:sm font:medium border-b:2|solid|transparent
          {activeTab === 'basic'
          ? 'text:blue-600 border-b-color:blue-600 bg:white'
          : 'text:gray-500 hover:text:gray-700'}
          transition:all|200ms
        "
        onclick={() => (activeTab = 'basic')}
      >
        基本情報
      </button>
      <button
        type="button"
        class="
          px:4 py:3 text:sm font:medium border-b:2|solid|transparent
          {activeTab === 'permissions'
          ? 'text:blue-600 border-b-color:blue-600 bg:white'
          : 'text:gray-500 hover:text:gray-700'}
          transition:all|200ms
        "
        onclick={() => (activeTab = 'permissions')}
      >
        権限管理
      </button>
      <button
        type="button"
        class="
          px:4 py:3 text:sm font:medium border-b:2|solid|transparent
          {activeTab === 'qualifications'
          ? 'text:blue-600 border-b-color:blue-600 bg:white'
          : 'text:gray-500 hover:text:gray-700'}
          transition:all|200ms
        "
        onclick={() => (activeTab = 'qualifications')}
      >
        資格情報
      </button>
      <button
        type="button"
        class="
          px:4 py:3 text:sm font:medium border-b:2|solid|transparent
          {activeTab === 'schedule'
          ? 'text:blue-600 border-b-color:blue-600 bg:white'
          : 'text:gray-500 hover:text:gray-700'}
          transition:all|200ms
        "
        onclick={() => (activeTab = 'schedule')}
      >
        スケジュール
      </button>
    </nav>
  </div>

  <!-- Tab Content -->
  <div class="flex:1 overflow:auto p:4">
    {#if activeTab === 'basic'}
      <!-- Basic Information -->
      <div class="space-y:6">
        {#if isEditMode}
          <div class="grid-cols:1 @md:grid-cols:2 gap:4 grid">
            <FormField 
              label="氏名" 
              required 
              error={getFieldError('氏名')?.message}
            >
              <Input 
                bind:value={editedStaff.name} 
                placeholder="佐藤 花子"
                class={hasFieldError('氏名') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField 
              label="氏名（カナ）" 
              required
              error={getFieldError('氏名（カナ）')?.message}
            >
              <Input 
                bind:value={editedStaff.nameKana} 
                placeholder="サトウ ハナコ"
                class={hasFieldError('氏名（カナ）') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField 
              label="メールアドレス" 
              required
              error={getFieldError('メールアドレス')?.message}
            >
              <Input
                type="email"
                bind:value={editedStaff.email}
                placeholder="hanako.sato@example.com"
                class={hasFieldError('メールアドレス') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField 
              label="電話番号" 
              required
              error={getFieldError('電話番号')?.message}
            >
              <Input
                type="tel"
                bind:value={editedStaff.phone}
                placeholder="090-1111-2222"
                class={hasFieldError('電話番号') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField 
              label="役職" 
              required
              error={getFieldError('役職')?.message}
            >
              <select
                bind:value={editedStaff.role}
                class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500 {hasFieldError('役職') ? 'border-red-500 focus:border-red-500' : ''}"
              >
                <option value="">選択してください</option>
                {#each roleOptions as option}
                  <option value={option.value}>{option.label}</option>
                {/each}
              </select>
            </FormField>
            <FormField 
              label="部署" 
              required
              error={getFieldError('部署')?.message}
            >
              <Input
                bind:value={editedStaff.department}
                placeholder="介護部"
                class={hasFieldError('部署') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField 
              label="入社日" 
              required
              error={getFieldError('入社日')?.message}
            >
              <Input
                type="date"
                value={editedStaff.hireDate.toISOString().split('T')[0]}
                oninput={(e) => {
                  const target = e.target as HTMLInputElement;
                  editedStaff.hireDate = new Date(target.value);
                }}
                class={hasFieldError('入社日') ? 'border-red-500 focus:border-red-500' : ''}
              />
            </FormField>
            <FormField label="アクティブ状態">
              <Toggle
                checked={editedStaff.isActive}
                onchange={(checked) => editedStaff.isActive = checked}
                label={editedStaff.isActive ? 'アクティブ' : '非アクティブ'}
              />
            </FormField>
          </div>
        {:else}
          <!-- View Mode -->
          <div class="space-y:6">
            <!-- Profile Header -->
            <div class="items:start gap:4 flex">
              <div class="w:16 h:16 bg:gray-200 r:9999px items:center justify:center flex">
                <svg class="w:8 h:8 text:gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="flex:1">
                <h3 class="text:xl font:semibold text:gray-900">{staff.name}</h3>
                <p class="text:gray-600">{staff.nameKana}</p>
                <div class="gap:4 mt:2 text:sm text:gray-500 flex">
                  <span>{getRoleLabel(staff.role)}</span>
                  <span>{staff.department}</span>
                  <span>勤続{calculateYearsOfService(staff.hireDate)}年</span>
                </div>
              </div>
              <div class="text:right">
                <span
                  class="
                  px:3 py:1 text:sm r:9999px
                  {staff.isActive ? 'bg:green-100 text:green-800' : 'bg:gray-100 text:gray-800'}
                "
                >
                  {staff.isActive ? 'アクティブ' : '非アクティブ'}
                </span>
              </div>
            </div>

            <!-- Basic Info Grid -->
            <div class="grid-cols:1 @md:grid-cols:2 gap:6 grid">
              <div>
                <h4 class="font:semibold text:gray-900 mb:2">連絡先情報</h4>
                <dl class="space-y:2 text:sm">
                  <div class="flex">
                    <dt class="w:20 text:gray-500">メール:</dt>
                    <dd class="text:gray-900">{staff.email}</dd>
                  </div>
                  <div class="flex">
                    <dt class="w:20 text:gray-500">電話:</dt>
                    <dd class="text:gray-900">{staff.phone}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 class="font:semibold text:gray-900 mb:2">勤務情報</h4>
                <dl class="space-y:2 text:sm">
                  <div class="flex">
                    <dt class="w:20 text:gray-500">入社日:</dt>
                    <dd class="text:gray-900">{formatDate(staff.hireDate)}</dd>
                  </div>
                  {#if staff.lastLoginAt}
                    <div class="flex">
                      <dt class="w:20 text:gray-500">最終ログイン:</dt>
                      <dd class="text:gray-900">{formatDate(staff.lastLoginAt)}</dd>
                    </div>
                  {/if}
                </dl>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {:else if activeTab === 'permissions'}
      <!-- Permissions Management -->
      <div class="space-y:6">
        <div>
          <h4 class="text:lg font:semibold text:gray-900 mb:4">権限管理</h4>
          <p class="text:sm text:gray-600 mb:6">
            この職員に付与する権限を選択してください。権限は役職に応じて適切に設定してください。
          </p>
          
          <div class="space-y:4">
            {#each permissionOptions as option}
              <div class="border:1|solid|gray-200 r:24px p:4">
                <div class="items:start justify:between flex">
                  <div class="flex:1">
                    <div class="items:center gap:3 flex">
                      <h5 class="font:medium text:gray-900">{option.label}</h5>
                      <span class="px:2 py:1 bg:gray-100 text:gray-600 text:xs r:9999px font:mono">
                        {option.value}
                      </span>
                    </div>
                    <p class="text:sm text:gray-600 mt:1">{option.description}</p>
                  </div>
                  <div class="ml:4">
                    {#if isEditMode}
                      <Toggle
                        checked={hasPermission(option.value)}
                        onchange={() => togglePermission(option.value)}
                        size="sm"
                      />
                    {:else}
                      <span class="
                        px:2 py:1 text:xs r:9999px
                        {hasPermission(option.value) 
                          ? 'bg:green-100 text:green-800' 
                          : 'bg:gray-100 text:gray-600'}
                      ">
                        {hasPermission(option.value) ? '許可' : '拒否'}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else if activeTab === 'qualifications'}
      <!-- Qualifications -->
      <div class="space-y:6">
        {#if isEditMode}
          <!-- Edit Qualifications -->
          <div>
            <div class="items:center justify:between mb:4 flex">
              <h4 class="text:lg font:semibold text:gray-900">資格情報</h4>
              <Button variant="outline" size="sm" onclick={addQualification}>
                <svg class="w:4 h:4 mr:1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                資格を追加
              </Button>
            </div>
            <div class="space-y:4">
              {#each editedStaff.qualifications as qualification, index}
                <div class="border:1|solid|gray-200 r:16px p:4">
                  <div class="items:start justify:between mb:3 flex">
                    <h5 class="font:medium text:gray-900">資格 {index + 1}</h5>
                    <button
                      type="button"
                      class="text:red-600 hover:text:red-800"
                      onclick={() => removeQualification(qualification.id)}
                      aria-label="資格を削除"
                    >
                      <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div class="grid-cols:2 gap:3 grid">
                    <FormField label="資格名">
                      <Input bind:value={qualification.name} placeholder="介護福祉士" />
                    </FormField>
                    <FormField label="発行機関">
                      <Input bind:value={qualification.issuer} placeholder="厚生労働省" />
                    </FormField>
                    <FormField label="取得日">
                      <Input
                        type="date"
                        value={qualification.issueDate.toISOString().split('T')[0]}
                        oninput={(e) => {
                          const target = e.target as HTMLInputElement;
                          qualification.issueDate = new Date(target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="有効期限">
                      <Input
                        type="date"
                        value={qualification.expiryDate?.toISOString().split('T')[0] || ''}
                        oninput={(e) => {
                          const target = e.target as HTMLInputElement;
                          qualification.expiryDate = target.value ? new Date(target.value) : undefined;
                        }}
                      />
                    </FormField>
                  </div>
                  <FormField label="証明書番号">
                    <Input bind:value={qualification.certificateNumber} placeholder="KF123456" />
                  </FormField>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- View Qualifications -->
          <div>
            <h4 class="text:lg font:semibold text:gray-900 mb:4">資格情報</h4>
            {#if staff.qualifications.length > 0}
              <div class="space-y:4">
                {#each staff.qualifications as qualification}
                  <div class="border:1|solid|gray-200 r:16px p:4">
                    <div class="items:start justify:between flex">
                      <div class="flex:1">
                        <h5 class="font:medium text:gray-900">{qualification.name}</h5>
                        <p class="text:sm text:gray-600">{qualification.issuer}</p>
                        <div class="text:sm text:gray-600 mt:2">
                          <p>取得日: {formatDate(qualification.issueDate)}</p>
                          {#if qualification.expiryDate}
                            <p>有効期限: {formatDate(qualification.expiryDate)}</p>
                          {/if}
                          {#if qualification.certificateNumber}
                            <p>証明書番号: {qualification.certificateNumber}</p>
                          {/if}
                        </div>
                      </div>
                      {#if qualification.expiryDate}
                        {@const isExpiringSoon = qualification.expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000}
                        {@const isExpired = qualification.expiryDate.getTime() < Date.now()}
                        <span class="
                          px:2 py:1 text:xs r:9999px
                          {isExpired 
                            ? 'bg:red-100 text:red-800' 
                            : isExpiringSoon 
                              ? 'bg:yellow-100 text:yellow-800' 
                              : 'bg:green-100 text:green-800'}
                        ">
                          {isExpired ? '期限切れ' : isExpiringSoon ? '期限間近' : '有効'}
                        </span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text:center py:8 text:gray-500">
                <svg class="h:12 w:12 text:gray-300 mx:auto mb:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p>資格情報が登録されていません</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {:else if activeTab === 'schedule'}
      <!-- Schedule -->
      <div class="space-y:6">
        {#if isEditMode}
          <!-- Edit Schedule -->
          <div>
            <div class="items:center justify:between mb:4 flex">
              <h4 class="text:lg font:semibold text:gray-900">スケジュール</h4>
              <Button variant="outline" size="sm" onclick={addSchedule}>
                <svg class="w:4 h:4 mr:1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                スケジュールを追加
              </Button>
            </div>
            <div class="space-y:4">
              {#each editedStaff.schedule as schedule, index}
                <div class="border:1|solid|gray-200 r:16px p:4">
                  <div class="items:start justify:between mb:3 flex">
                    <h5 class="font:medium text:gray-900">スケジュール {index + 1}</h5>
                    <button
                      type="button"
                      class="text:red-600 hover:text:red-800"
                      onclick={() => removeSchedule(schedule.id)}
                      aria-label="スケジュールを削除"
                    >
                      <svg class="w:4 h:4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <div class="grid-cols:2 gap:3 grid">
                    <FormField label="日付">
                      <Input
                        type="date"
                        value={schedule.date.toISOString().split('T')[0]}
                        oninput={(e) => {
                          const target = e.target as HTMLInputElement;
                          schedule.date = new Date(target.value);
                        }}
                      />
                    </FormField>
                    <FormField label="シフトタイプ">
                      <select
                        bind:value={schedule.shiftType}
                        class="w:full px:3 py:2 border:1|solid|gray-300 r:16px focus:outline:2|solid|blue-500"
                      >
                        <option value="day">日勤</option>
                        <option value="evening">夕勤</option>
                        <option value="night">夜勤</option>
                        <option value="on-call">オンコール</option>
                      </select>
                    </FormField>
                    <FormField label="開始時間">
                      <Input
                        type="text"
                        bind:value={schedule.startTime}
                        placeholder="09:00"
                        pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                      />
                    </FormField>
                    <FormField label="終了時間">
                      <Input
                        type="text"
                        bind:value={schedule.endTime}
                        placeholder="18:00"
                        pattern="^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                      />
                    </FormField>
                  </div>
                  <div class="mt:3">
                    <FormField label="備考">
                      <Input bind:value={schedule.notes} placeholder="特記事項があれば入力" />
                    </FormField>
                  </div>
                  <div class="mt:3">
                    <Toggle
                      checked={schedule.isConfirmed}
                      onchange={(checked) => schedule.isConfirmed = checked}
                      label={schedule.isConfirmed ? '確定済み' : '未確定'}
                    />
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <!-- View Schedule -->
          <div>
            <h4 class="text:lg font:semibold text:gray-900 mb:4">スケジュール</h4>
            {#if staff.schedule.length > 0}
              <div class="space-y:4">
                {#each staff.schedule.sort((a, b) => a.date.getTime() - b.date.getTime()) as schedule}
                  <div class="border:1|solid|gray-200 r:16px p:4">
                    <div class="items:start justify:between flex">
                      <div class="flex:1">
                        <div class="items:center gap:3 flex">
                          <h5 class="font:medium text:gray-900">{formatDate(schedule.date)}</h5>
                          <span class="px:2 py:1 bg:blue-100 text:blue-800 text:xs r:9999px">
                            {schedule.shiftType === 'day' ? '日勤' : 
                             schedule.shiftType === 'evening' ? '夕勤' : 
                             schedule.shiftType === 'night' ? '夜勤' : 'オンコール'}
                          </span>
                          <span class="
                            px:2 py:1 text:xs r:9999px
                            {schedule.isConfirmed ? 'bg:green-100 text:green-800' : 'bg:yellow-100 text:yellow-800'}
                          ">
                            {schedule.isConfirmed ? '確定済み' : '未確定'}
                          </span>
                        </div>
                        <div class="text:sm text:gray-600 mt:1">
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        {#if schedule.notes}
                          <div class="text:sm text:gray-600 mt:2">
                            {schedule.notes}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text:center py:8 text:gray-500">
                <svg class="h:12 w:12 text:gray-300 mx:auto mb:2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 012 0v4m0 0V3a1 1 0 012 0v4m0 0h4l-4 4-4-4h4z" />
                </svg>
                <p>スケジュールが登録されていません</p>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>