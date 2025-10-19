# Staff Management Components

職員管理機能のコンポーネント群です。

## Components

### StaffList.svelte
職員一覧を表示するコンポーネント。検索、フィルタリング、ソート、ページネーション機能を提供します。

**Props:**
- `onStaffSelect?: (staff: Staff) => void` - 職員選択時のコールバック
- `class?: string` - 追加のCSSクラス
- `data-testid?: string` - テスト用ID

**Features:**
- 職員の検索（名前、フリガナ、メールアドレス）
- 役職、部署、ステータスによるフィルタリング
- 複数項目でのソート
- ページネーション
- レスポンシブデザイン

### StaffDetail.svelte
職員の詳細情報を表示・編集するコンポーネント。

**Props:**
- `staff: Staff` - 表示する職員データ
- `isEditMode?: boolean` - 編集モードの有効/無効
- `onSave?: (staff: Staff) => void` - 保存時のコールバック
- `onCancel?: () => void` - キャンセル時のコールバック

**Features:**
- タブ形式での情報表示（基本情報、権限管理、資格情報、スケジュール）
- 編集モードでの情報更新
- バリデーション機能
- 権限管理（トグル形式）
- 資格情報の追加・削除・編集
- スケジュール情報の管理

### StaffSchedule.svelte
職員のスケジュールをカレンダー形式で表示するコンポーネント。

**Props:**
- `class?: string` - 追加のCSSクラス
- `data-testid?: string` - テスト用ID

**Features:**
- 日・週・月表示の切り替え
- スケジュールの視覚的表示
- シフトタイプ別の色分け
- 今日の日付のハイライト
- ナビゲーション機能

### StaffSidebar.svelte
職員詳細情報をサイドバー形式で表示するコンポーネント。

**Props:**
- `staff: Staff | null` - 表示する職員データ
- `isOpen?: boolean` - サイドバーの開閉状態
- `isFullscreen?: boolean` - 全画面表示の有効/無効
- `level?: number` - サイドバーのレベル（ネスト対応）
- `onClose?: () => void` - 閉じる時のコールバック
- `onToggleFullscreen?: () => void` - 全画面切り替え時のコールバック
- `onBack?: () => void` - 戻る時のコールバック
- `onStaffUpdate?: (staff: Staff) => void` - 職員更新時のコールバック

**Features:**
- 2段階展開対応
- 全画面表示切り替え
- 編集モード切り替え
- StaffDetailコンポーネントの統合

## Usage Example

```svelte
<script>
  import { StaffList, StaffSidebar } from '$lib/components/staff';
  import { staffStore } from '$lib/stores/staff.svelte';
  
  let selectedStaff = $state(null);
  let isSidebarOpen = $state(false);
  
  function handleStaffSelect(staff) {
    selectedStaff = staff;
    isSidebarOpen = true;
  }
  
  function handleStaffUpdate(updatedStaff) {
    staffStore.updateStaff(updatedStaff.id, updatedStaff);
  }
</script>

<div class="flex h:screen">
  <div class="flex-1">
    <StaffList onStaffSelect={handleStaffSelect} />
  </div>
  
  <StaffSidebar
    staff={selectedStaff}
    isOpen={isSidebarOpen}
    onClose={() => isSidebarOpen = false}
    onStaffUpdate={handleStaffUpdate}
  />
</div>
```

## Data Flow

1. **StaffList** - 職員一覧の表示と選択
2. **StaffSidebar** - 選択された職員の詳細表示
3. **StaffDetail** - 職員情報の詳細表示・編集
4. **StaffSchedule** - スケジュール情報の表示

## Store Integration

これらのコンポーネントは `staffStore` と連携して動作します：

- 職員データの読み込み
- 検索・フィルタリング状態の管理
- CRUD操作の実行
- スケジュール管理

## Styling

MasterCSSを使用してスタイリングされており、介護施設向けのデザインシステムに準拠しています。

## Testing

各コンポーネントには適切な `data-testid` 属性が設定されており、統合テストに対応しています。