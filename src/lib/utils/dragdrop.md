# ドラッグ&ドロップユーティリティ

介護施設向けダッシュボードのドラッグ&ドロップ機能を提供するユーティリティライブラリです。

## 特徴

- **HTML5 Drag and Drop API** のラッパー関数
- **タッチデバイス対応** のドラッグ機能
- **視覚的フィードバック** 機能
- **統合API** でデスクトップとモバイルの両方に対応
- **TypeScript** 完全対応
- **アクセシビリティ** 配慮

## 基本的な使用方法

### 1. ドラッグ可能な要素を作成

```typescript
import { makeDraggable, type DragData } from '$lib/utils/dragdrop.js';

const dragData: DragData = {
  id: 'card-1',
  type: 'dashboard-card',
  data: { title: 'ユーザー一覧' }
};

const cleanup = makeDraggable(element, dragData, {
  ghostOpacity: 0.6,
  onDragStart: (event) => console.log('ドラッグ開始'),
  onDragEnd: (event) => console.log('ドラッグ終了')
});

// クリーンアップ
cleanup();
```

### 2. ドロップゾーンを作成

```typescript
import { makeDropZone, type DropZone } from '$lib/utils/dragdrop.js';

const dropZone: DropZone = {
  id: 'dashboard-grid',
  element: gridElement,
  accepts: ['dashboard-card'],
  onDrop: (data, position) => {
    console.log('ドロップされました:', data, position);
  },
  onDragOver: (data) => {
    console.log('ドラッグオーバー:', data);
  }
};

const cleanup = makeDropZone(gridElement, dropZone);
```

### 3. 統合API（推奨）

デスクトップとモバイルの両方に対応する場合は統合APIを使用してください：

```typescript
import { 
  makeUniversalDraggable, 
  makeUniversalDropZone 
} from '$lib/utils/dragdrop.js';

// ドラッグ可能要素
const dragCleanup = makeUniversalDraggable(element, dragData, {
  dragOptions: {
    ghostOpacity: 0.6
  },
  touchOptions: {
    threshold: 10,
    ghostElement: true
  }
});

// ドロップゾーン
const dropCleanup = makeUniversalDropZone(element, dropZone);
```

## API リファレンス

### 型定義

#### DragData
```typescript
interface DragData {
  id: string;        // 一意識別子
  type: string;      // ドラッグアイテムのタイプ
  data: any;         // 追加データ
}
```

#### DropZone
```typescript
interface DropZone {
  id: string;
  element: HTMLElement;
  accepts: string[];  // 受け入れ可能なタイプ
  onDrop: (data: DragData, position: Position) => void;
  onDragOver?: (data: DragData) => void;
  onDragLeave?: () => void;
}
```

#### Position
```typescript
interface Position {
  x: number;
  y: number;
}
```

### 主要関数

#### makeDraggable(element, data, options?)
HTML5 Drag and Drop APIを使用してドラッグ可能にします。

**パラメータ:**
- `element: HTMLElement` - ドラッグ可能にする要素
- `data: DragData` - ドラッグデータ
- `options?: DragOptions` - オプション設定

**戻り値:** `() => void` - クリーンアップ関数

#### makeDropZone(element, zone, visualOptions?)
ドロップゾーンを設定します。

**パラメータ:**
- `element: HTMLElement` - ドロップゾーン要素
- `zone: DropZone` - ドロップゾーン設定
- `visualOptions?: VisualFeedbackOptions` - 視覚的フィードバック設定

#### makeTouchDraggable(element, data, options?)
タッチデバイス用のドラッグ機能を提供します。

**パラメータ:**
- `element: HTMLElement` - ドラッグ可能にする要素
- `data: DragData` - ドラッグデータ
- `options?: TouchDragOptions` - タッチ専用オプション

#### makeUniversalDraggable(element, data, options?)
HTML5とタッチの両方に対応した統合ドラッグ機能です。

#### makeUniversalDropZone(element, zone, visualOptions?)
HTML5とタッチの両方に対応した統合ドロップゾーンです。

### ユーティリティ関数

#### calculateGridPosition(position, gridSize, containerRect)
ピクセル位置をグリッド位置に変換します。

#### gridToPixelPosition(gridPosition, gridSize)
グリッド位置をピクセル位置に変換します。

#### getElementCenter(element)
要素の中心位置を取得します。

#### calculateDistance(point1, point2)
2点間の距離を計算します。

#### findNearestDropZone(position, dropZones)
最も近いドロップゾーンを見つけます。

#### createDragPreview(element, options?)
ドラッグプレビュー要素を作成します。

### 機能検出

#### isDragSupported()
HTML5 Drag and Drop APIのサポートを検出します。

#### isTouchSupported()
タッチ機能のサポートを検出します。

#### getPreferredDragMethod()
適切なドラッグ方式を自動選択します。

## CSS クラス

ドラッグ&ドロップ機能は以下のCSSクラスを使用します：

### ドラッグ中の要素
- `.dragging` - HTML5ドラッグ中
- `.touch-dragging` - タッチドラッグ中
- `.drag-ghost` - ゴースト要素

### ドロップゾーンの状態
- `.drag-active` - ドラッグがアクティブ
- `.drag-over` - ドラッグオーバー中
- `.drop-valid` - 有効なドロップ
- `.drop-invalid` - 無効なドロップ

### タッチ専用
- `.touch-drag-active` - タッチドラッグアクティブ
- `.touch-drag-over` - タッチドラッグオーバー
- `.touch-drop-valid` - タッチドロップ有効
- `.touch-drop-invalid` - タッチドロップ無効

## 使用例

### ダッシュボードカードのドラッグ&ドロップ

```svelte
<script lang="ts">
  import { makeUniversalDraggable, makeUniversalDropZone } from '$lib/utils/dragdrop.js';
  
  let cardElement: HTMLElement;
  let gridElement: HTMLElement;
  
  onMount(() => {
    // カードをドラッグ可能に
    const dragCleanup = makeUniversalDraggable(cardElement, {
      id: 'card-1',
      type: 'dashboard-card',
      data: { title: 'ユーザー一覧' }
    });
    
    // グリッドをドロップゾーンに
    const dropCleanup = makeUniversalDropZone(gridElement, {
      id: 'dashboard-grid',
      element: gridElement,
      accepts: ['dashboard-card'],
      onDrop: (data, position) => {
        // カードの位置を更新
        updateCardPosition(data.id, position);
      }
    });
    
    return () => {
      dragCleanup();
      dropCleanup();
    };
  });
</script>

<div bind:this={gridElement} class="dashboard-grid" data-drop-zone="grid">
  <div bind:this={cardElement} class="dashboard-card">
    ユーザー一覧
  </div>
</div>
```

## アクセシビリティ

- キーボードナビゲーション対応
- スクリーンリーダー対応のARIA属性
- 視覚的フィードバックの提供
- 動きを減らす設定への対応

## ブラウザサポート

- **HTML5 Drag and Drop**: モダンブラウザ全般
- **Touch Events**: モバイルブラウザ、タッチ対応デスクトップ
- **フォールバック**: 機能検出により適切な方式を自動選択

## パフォーマンス考慮事項

- イベントリスナーの適切なクリーンアップ
- メモリリークの防止
- 大量要素での仮想化対応
- スムーズなアニメーション

## トラブルシューティング

### よくある問題

1. **ドラッグが開始されない**
   - `draggable="true"` 属性が設定されているか確認
   - イベントリスナーが正しく登録されているか確認

2. **タッチドラッグが動作しない**
   - `touch-action: none` CSSプロパティを確認
   - `preventDefault()` が適切に呼ばれているか確認

3. **ドロップが検出されない**
   - `accepts` 配列にドラッグタイプが含まれているか確認
   - ドロップゾーンが正しく設定されているか確認

4. **視覚的フィードバックが表示されない**
   - CSSクラスが正しく定義されているか確認
   - CSS読み込み順序を確認