# UserList Component

利用者一覧を表示・管理するためのコンポーネントです。検索、フィルタリング、ソート、ページネーション機能を提供します。

## 機能

### 基本機能
- 利用者一覧の表示
- 利用者の選択とコールバック
- 読み込み状態・エラー状態・空状態の表示

### 検索・フィルタリング
- **テキスト検索**: 名前、フリガナ、IDによる検索
- **要介護度フィルタ**: 要介護1〜5での絞り込み
- **性別フィルタ**: 男性・女性・その他での絞り込み
- **ステータスフィルタ**: アクティブ・非アクティブでの絞り込み
- **年齢範囲フィルタ**: 最小・最大年齢での絞り込み

### ソート機能
- 名前（昇順・降順）
- フリガナ（昇順・降順）
- 要介護度（昇順・降順）
- 生年月日（昇順・降順）
- 入所日（昇順・降順）
- 更新日（昇順・降順）

### ページネーション
- 表示件数の変更（10, 20, 50, 100件）
- ページ移動（前へ・次へ・直接指定）
- ページ情報の表示

## 使用方法

```svelte
<script lang="ts">
  import UserList from '$lib/components/user/UserList.svelte';
  import type { User } from '$lib/types/user';

  function handleUserSelect(user: User) {
    console.log('Selected user:', user);
  }
</script>

<UserList 
  onUserSelect={handleUserSelect}
  class="h:full"
  data-testid="user-list"
/>
```

## Props

| プロパティ | 型 | デフォルト | 説明 |
|-----------|---|-----------|------|
| `onUserSelect` | `(user: User) => void` | `undefined` | 利用者選択時のコールバック |
| `class` | `string` | `''` | 追加のCSSクラス |
| `data-testid` | `string` | `'user-list'` | テスト用のID |

## データ構造

コンポーネントは `userStore` から以下のデータを使用します：

- `users`: 全利用者データ
- `selectedUser`: 選択中の利用者
- `isLoading`: 読み込み状態
- `error`: エラーメッセージ
- `filteredUsers`: フィルタリング済み利用者
- `sortedUsers`: ソート済み利用者
- `paginatedUsers`: ページネーション済み利用者
- `totalPages`: 総ページ数

## スタイリング

MasterCSSを使用してスタイリングされています。主要なクラス：

- `care-*`: カスタムデザイントークン
- レスポンシブ対応（`md:`, `lg:`プレフィックス）
- アクセシビリティ対応（フォーカス、ホバー状態）

## アクセシビリティ

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 適切なARIA属性の設定
- セマンティックHTMLの使用

## テスト

### 単体テスト
```bash
npm test src/lib/components/user/UserList.test.ts
```

### 統合テスト
```bash
npm test src/lib/components/user/UserList.integration.test.ts
```

## 依存関係

- `$lib/stores/user.svelte`: 利用者データストア
- `$lib/components/ui/*`: UIコンポーネント
- `$lib/utils/formatters`: フォーマッター関数
- `$lib/types/user`: 型定義

## パフォーマンス

- Svelte 5のRune機能による効率的な状態管理
- 派生状態の自動計算とメモ化
- 仮想化対応（大量データ対応）
- 遅延読み込み対応

## 今後の拡張予定

- エクスポート機能（CSV、PDF）
- 一括操作機能
- カスタムフィールド対応
- 高度な検索機能