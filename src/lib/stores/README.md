# ダッシュボードストア

Svelte 5 Rune を使用したダッシュボード状態管理システムです。

## 概要

`DashboardStore` は介護施設向けダッシュボードのカード管理、レイアウト管理、ドラッグ&ドロップ機能を提供します。

## 主な機能

### 1. カード管理
- カードの追加・削除・移動
- カードの表示/非表示切り替え
- カード設定の更新

### 2. 状態管理
- Svelte 5 Rune (`$state`, `$derived`) を使用した効率的な状態管理
- 自動的な派生状態の計算
- リアクティブな更新

### 3. 永続化
- localStorage を使用した状態の永続化
- レイアウトの保存・読み込み

### 4. ドラッグ&ドロップ
- カードのドラッグ&ドロップ機能
- ドロップゾーンの管理
- 編集モードでの操作制限

## 使用方法

### 基本的な使用

```typescript
import { dashboardStore } from '$lib/stores';

// カードを追加
const template: CardTemplate = {
  type: 'user-list',
  title: '利用者一覧',
  icon: 'material-symbols:person-outline',
  defaultSize: 'medium',
  defaultConfig: { maxItems: 10 },
  description: '利用者の一覧を表示',
  category: 'management'
};

const newCard = dashboardStore.addCard(template);

// カードを移動
dashboardStore.moveCard(newCard.id, { x: 2, y: 3 });

// カードを削除
dashboardStore.removeCard(newCard.id);
```

### Svelte コンポーネントでの使用

```svelte
<script lang="ts">
  import { dashboardStore } from '$lib/stores';
  
  // 派生状態を取得
  const { visibleCards, isEditMode, canEdit } = dashboardStore;
</script>

<!-- 表示中のカード一覧 -->
{#each visibleCards as card (card.id)}
  <div class="card">
    <h3>{card.title}</h3>
    <p>位置: ({card.position.x}, {card.position.y})</p>
  </div>
{/each}

<!-- 編集モード切り替え -->
<button onclick={() => dashboardStore.toggleEditMode()}>
  編集モード: {isEditMode ? 'ON' : 'OFF'}
</button>
```

## API リファレンス

### プロパティ

#### 基本状態
- `cards: DashboardCard[]` - 全カードの配列
- `currentLayout: DashboardLayout | null` - 現在のレイアウト
- `isEditMode: boolean` - 編集モードの状態
- `isLoading: boolean` - ローディング状態
- `error: string | null` - エラーメッセージ

#### ドラッグ&ドロップ状態
- `dragState: DragState` - ドラッグ&ドロップの状態

#### 設定
- `gridSettings: GridSettings` - グリッドの設定
- `cardTemplates: CardTemplate[]` - カードテンプレート

#### 派生状態
- `visibleCards` - 表示中のカード（`isVisible: true`）
- `sortedCards` - ソート済みのカード
- `cardStats` - カードタイプ別の統計
- `canEdit` - 編集可能かどうか
- `availablePositions` - 利用可能な位置

### メソッド

#### カード管理
- `addCard(template: CardTemplate, position?: Position): DashboardCard`
- `removeCard(cardId: string): boolean`
- `moveCard(cardId: string, newPosition: Position): boolean`
- `updateCard(cardId: string, updates: Partial<DashboardCard>): boolean`
- `toggleCardVisibility(cardId: string): boolean`

#### 編集モード
- `toggleEditMode(): void`

#### ドラッグ&ドロップ
- `startDrag(cardId: string, offset: Position): void`
- `endDrag(dropPosition?: Position): void`
- `resetDragState(): void`

#### レイアウト管理
- `saveLayout(name: string): DashboardLayout`
- `loadLayout(layout: DashboardLayout): void`

#### ユーティリティ
- `reset(): void`
- `setError(error: string | null): void`
- `setLoading(loading: boolean): void`

## 型定義

主要な型定義は `$lib/types/dashboard.ts` で定義されています：

- `DashboardCard` - ダッシュボードカード
- `DashboardLayout` - レイアウト情報
- `CardTemplate` - カードテンプレート
- `DragState` - ドラッグ状態
- `GridSettings` - グリッド設定
- `Position` - 位置情報
- `CardType` - カードタイプ
- `CardSize` - カードサイズ

## テスト

```bash
npm test src/lib/stores/dashboard.test.ts
```

テストファイルには以下のテストケースが含まれています：

- カード管理機能のテスト
- 編集モードのテスト
- ドラッグ&ドロップ機能のテスト
- 派生状態の計算テスト
- ローカルストレージ連携のテスト
- レイアウト管理のテスト

## 注意事項

1. **Svelte 5 Rune**: このストアは Svelte 5 の Rune 機能を使用しています。Svelte 4 以前では動作しません。

2. **ローカルストレージ**: ブラウザの localStorage を使用して状態を永続化します。サーバーサイドレンダリング時は無効になります。

3. **メモリ管理**: 大量のカードを扱う場合は、パフォーマンスに注意してください。

4. **型安全性**: TypeScript を使用して型安全性を確保しています。型定義を適切に使用してください。

## 今後の拡張予定

- サーバーサイドでの状態同期
- カードのアニメーション機能
- より高度なレイアウト機能
- パフォーマンス最適化