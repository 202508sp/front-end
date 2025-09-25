# 介護施設向けダッシュボード - 設計書

## 概要

介護施設向けダッシュボードは、Svelte 5（Runeモード）、TypeScript、MasterCSSを使用したモダンなWebアプリケーションです。職員の業務効率化、利用者情報の適切な管理、家族との円滑な連携を実現する包括的なシステムを提供します。

### 技術スタック
- **フロントエンド**: Svelte 5 (Rune mode) + TypeScript
- **スタイリング**: MasterCSS v2.0 + カスタムデザイントークン
- **アイコン**: Iconify/Svelte（メインは material-symbols）
- **フォント**: Noto Sans JP (Variable)
- **バックエンド**: Firebase (認証・データベース・リアルタイム通信)
- **ビルドツール**: Vite + SvelteKit

## アーキテクチャ

### システム全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Pages     │  │ Components  │  │      Layouts        │  │
│  │             │  │             │  │                     │  │
│  │ • Home      │  │ • Cards     │  │ • Main Layout       │  │
│  │ • Users     │  │ • Sidebar   │  │ • Modal Stack       │  │
│  │ • Staff     │  │ • Charts    │  │ • Responsive Grid   │  │
│  │ • Stats     │  │ • Forms     │  │                     │  │
│  │ • Settings  │  │ • Chat      │  │                     │  │
│  │ • Family    │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Stores    │  │  Services   │  │      Utils          │  │
│  │             │  │             │  │                     │  │
│  │ • User      │  │ • Auth      │  │ • Date Helpers      │  │
│  │ • Dashboard │  │ • Data      │  │ • Validation        │  │
│  │ • Chat      │  │ • Chat      │  │ • Formatters        │  │
│  │ • Settings  │  │ • Export    │  │ • Drag & Drop       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Firebase   │  │ Local Store │  │    API Gateway      │  │
│  │             │  │             │  │                     │  │
│  │ • Firestore │  │ • Settings  │  │ • REST Endpoints    │  │
│  │ • Auth      │  │ • Cache     │  │ • WebSocket         │  │
│  │ • Storage   │  │ • Offline   │  │ • File Upload       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### ディレクトリ構造

```
src/
├── lib/
│   ├── components/           # 再利用可能なコンポーネント
│   │   ├── ui/              # 基本UIコンポーネント
│   │   │   ├── Button.svelte
│   │   │   ├── Modal.svelte
│   │   │   ├── Sidebar.svelte
│   │   │   ├── Card.svelte
│   │   │   └── Chart.svelte
│   │   ├── dashboard/       # ダッシュボード専用コンポーネント
│   │   │   ├── DashboardCard.svelte
│   │   │   ├── CardGrid.svelte
│   │   │   └── CardSelector.svelte
│   │   ├── user/           # 利用者管理コンポーネント
│   │   │   ├── UserList.svelte
│   │   │   ├── UserDetail.svelte
│   │   │   └── UserSidebar.svelte
│   │   ├── staff/          # 職員管理コンポーネント
│   │   │   ├── StaffList.svelte
│   │   │   ├── StaffDetail.svelte
│   │   │   └── StaffSchedule.svelte
│   │   ├── statistics/     # 統計コンポーネント
│   │   │   ├── StatChart.svelte
│   │   │   ├── DateRangePicker.svelte
│   │   │   └── StatCard.svelte
│   │   ├── chat/           # チャット機能
│   │   │   ├── ChatWindow.svelte
│   │   │   ├── MessageList.svelte
│   │   │   └── MessageInput.svelte
│   │   └── forms/          # フォームコンポーネント
│   │       ├── FormField.svelte
│   │       ├── Toggle.svelte
│   │       └── FileUpload.svelte
│   ├── stores/             # 状態管理
│   │   ├── dashboard.svelte.ts
│   │   ├── user.svelte.ts
│   │   ├── staff.svelte.ts
│   │   ├── chat.svelte.ts
│   │   └── settings.svelte.ts
│   ├── services/           # ビジネスロジック
│   │   ├── auth.ts
│   │   ├── database.ts
│   │   ├── chat.ts
│   │   └── export.ts
│   ├── utils/              # ユーティリティ
│   │   ├── date.ts
│   │   ├── validation.ts
│   │   ├── dragdrop.ts
│   │   └── formatters.ts
│   └── types/              # 型定義
│       ├── user.ts
│       ├── staff.ts
│       ├── dashboard.ts
│       └── chat.ts
├── routes/                 # ページルーティング
│   ├── +layout.svelte      # メインレイアウト
│   ├── +page.svelte        # ホームダッシュボード
│   ├── user/
│   │   └── +page.svelte    # 利用者管理
│   ├── staff/
│   │   └── +page.svelte    # 職員管理
│   ├── statistics/
│   │   └── +page.svelte    # 統計・分析
│   ├── settings/
│   │   └── +page.svelte    # 設定
│   ├── management/
│   │   └── +page.svelte    # 職員管理・家族連携
│   └── family-portal/
│       └── +page.svelte    # 家族ポータル
└── app.html                # HTMLテンプレート
```

## コンポーネント設計とインターフェース

### 1. ダッシュボードカードシステム

#### DashboardCard.svelte
```typescript
interface DashboardCardProps {
  id: string;
  title: string;
  icon: string;
  href?: string;
  component?: ComponentType;
  data?: any;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  isDraggable: boolean;
}
```

#### CardGrid.svelte
```typescript
interface CardGridProps {
  cards: DashboardCard[];
  isEditMode: boolean;
  onCardMove: (cardId: string, newPosition: Position) => void;
  onCardRemove: (cardId: string) => void;
  onCardAdd: () => void;
}
```

### 2. サイドバーシステム

#### Sidebar.svelte
```typescript
interface SidebarProps {
  isOpen: boolean;
  isFullscreen: boolean;
  title: string;
  onClose: () => void;
  onToggleFullscreen: () => void;
  children: Snippet;
}

interface SidebarState {
  currentLevel: number; // 0: closed, 1: sidebar, 2: expanded
  history: SidebarContent[];
}
```

### 3. 統計チャートシステム

#### StatChart.svelte
```typescript
interface StatChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  options: ChartOptions;
  dateRange: DateRange;
  filters: StatFilter[];
}

interface ChartData {
  labels: string[];
  datasets: Dataset[];
}
```

### 4. チャット機能

#### ChatWindow.svelte
```typescript
interface ChatWindowProps {
  chatId: string;
  participants: User[];
  isStaffView: boolean;
  onSendMessage: (message: string, attachments?: File[]) => void;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  isRead: boolean;
}
```

## データモデル

### User（利用者）
```typescript
interface User {
  id: string;
  name: string;
  nameKana: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  address: Address;
  emergencyContact: Contact;
  medicalInfo: MedicalInfo;
  careLevel: number; // 要介護度
  familyMembers: FamilyMember[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

interface MedicalInfo {
  allergies: string[];
  medications: Medication[];
  conditions: string[];
  restrictions: string[];
}
```

### Staff（職員）
```typescript
interface Staff {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  role: StaffRole;
  department: string;
  hireDate: Date;
  qualifications: Qualification[];
  schedule: WorkSchedule[];
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

type StaffRole = 'admin' | 'manager' | 'caregiver' | 'nurse' | 'therapist';
```

### DashboardCard（ダッシュボードカード）
```typescript
interface DashboardCard {
  id: string;
  userId: string; // 職員ID
  type: CardType;
  title: string;
  icon: string;
  size: CardSize;
  position: Position;
  config: CardConfig;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CardType = 'user-list' | 'statistics' | 'schedule' | 'notifications' | 'quick-actions';
type CardSize = 'small' | 'medium' | 'large';
```

### ChatMessage（チャットメッセージ）
```typescript
interface ChatMessage {
  id: string;
  chatRoomId: string;
  senderId: string;
  senderType: 'staff' | 'family';
  content: string;
  attachments: Attachment[];
  timestamp: Date;
  isRead: boolean;
  replyTo?: string; // 返信先メッセージID
}

interface ChatRoom {
  id: string;
  userId: string; // 利用者ID
  participants: Participant[];
  lastMessage?: ChatMessage;
  createdAt: Date;
  updatedAt: Date;
}
```

### Report（レポート）
```typescript
interface Report {
  id: string;
  userId: string; // 利用者ID
  authorId: string; // 作成職員ID
  type: ReportType;
  title: string;
  content: string;
  attachments: Attachment[];
  date: Date;
  isPublishedToFamily: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type ReportType = 'daily' | 'medical' | 'incident' | 'progress' | 'family-communication';
```

## エラーハンドリング

### エラー分類と対応

#### 1. ネットワークエラー
```typescript
interface NetworkError {
  type: 'network';
  code: 'offline' | 'timeout' | 'server-error';
  message: string;
  retryable: boolean;
}

// 対応策
const handleNetworkError = (error: NetworkError) => {
  if (error.retryable) {
    // 自動リトライ機能
    scheduleRetry(error);
  }
  // オフライン対応
  enableOfflineMode();
  // ユーザー通知
  showErrorToast(error.message);
};
```

#### 2. 認証エラー
```typescript
interface AuthError {
  type: 'auth';
  code: 'unauthorized' | 'session-expired' | 'permission-denied';
  message: string;
}

// 対応策
const handleAuthError = (error: AuthError) => {
  if (error.code === 'session-expired') {
    // 自動再ログイン試行
    attemptTokenRefresh();
  } else {
    // ログイン画面へリダイレクト
    redirectToLogin();
  }
};
```

#### 3. データ検証エラー
```typescript
interface ValidationError {
  type: 'validation';
  field: string;
  code: string;
  message: string;
}

// 対応策
const handleValidationError = (errors: ValidationError[]) => {
  // フォームフィールドにエラー表示
  errors.forEach(error => {
    highlightField(error.field);
    showFieldError(error.field, error.message);
  });
};
```

### エラー境界とフォールバック

```typescript
// エラー境界コンポーネント
interface ErrorBoundaryProps {
  fallback: ComponentType<{ error: Error }>;
  onError?: (error: Error) => void;
  children: Snippet;
}

// フォールバックUI
const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div class="p:20px text-align:center">
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onclick={() => window.location.reload()}>
        ページを再読み込み
      </button>
    </div>
  );
};
```

## テスト戦略

### 1. 単体テスト（Unit Tests）
- **対象**: 個別コンポーネント、ユーティリティ関数、ストア
- **ツール**: Vitest + Testing Library
- **カバレッジ目標**: 80%以上

```typescript
// 例: DashboardCard.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import DashboardCard from './DashboardCard.svelte';

test('カードがクリック可能で正しいイベントを発火する', async () => {
  const mockOnClick = vi.fn();
  const { getByRole } = render(DashboardCard, {
    props: {
      title: 'テストカード',
      onClick: mockOnClick
    }
  });

  const card = getByRole('button');
  await fireEvent.click(card);
  
  expect(mockOnClick).toHaveBeenCalledTimes(1);
});
```

### 2. 統合テスト（Integration Tests）
- **対象**: ページレベルの機能、API連携
- **ツール**: Playwright
- **重点項目**: ユーザーフロー、データの整合性

```typescript
// 例: dashboard.integration.test.ts
test('ダッシュボードカードの追加・削除・移動', async ({ page }) => {
  await page.goto('/');
  
  // カード追加
  await page.click('[data-testid="add-card-button"]');
  await page.click('[data-testid="user-list-card"]');
  
  // カードが追加されたことを確認
  await expect(page.locator('[data-testid="dashboard-card"]')).toHaveCount(1);
  
  // ドラッグ&ドロップでカード移動
  await page.dragAndDrop(
    '[data-testid="dashboard-card"]',
    '[data-testid="drop-zone-2"]'
  );
  
  // 位置が変更されたことを確認
  const cardPosition = await page.locator('[data-testid="dashboard-card"]').getAttribute('data-position');
  expect(cardPosition).toBe('2');
});
```

### 3. E2Eテスト（End-to-End Tests）
- **対象**: 完全なユーザーシナリオ
- **ツール**: Playwright
- **重点項目**: クリティカルパス、ブラウザ互換性

```typescript
// 例: user-management.e2e.test.ts
test('利用者情報の閲覧から編集まで', async ({ page }) => {
  // ログイン
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'staff@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  
  // 利用者一覧ページへ
  await page.click('[data-testid="users-menu"]');
  
  // 利用者選択
  await page.click('[data-testid="user-item-1"]');
  
  // サイドバーで詳細表示
  await expect(page.locator('[data-testid="user-sidebar"]')).toBeVisible();
  
  // 編集モードに切り替え
  await page.click('[data-testid="edit-user-button"]');
  
  // 情報更新
  await page.fill('[data-testid="user-notes"]', '新しいメモ');
  await page.click('[data-testid="save-button"]');
  
  // 保存確認
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### 4. アクセシビリティテスト
- **ツール**: axe-playwright
- **重点項目**: キーボードナビゲーション、スクリーンリーダー対応

```typescript
// 例: accessibility.test.ts
import { injectAxe, checkA11y } from 'axe-playwright';

test('ダッシュボードのアクセシビリティ', async ({ page }) => {
  await page.goto('/');
  await injectAxe(page);
  
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

## パフォーマンス最適化

### 1. コード分割とレイジーローディング
```typescript
// 動的インポートによるコード分割
const UserDetail = lazy(() => import('./UserDetail.svelte'));
const StatisticsChart = lazy(() => import('./StatisticsChart.svelte'));

// ルートレベルでの分割
const routes = {
  '/': () => import('./routes/+page.svelte'),
  '/users': () => import('./routes/user/+page.svelte'),
  '/statistics': () => import('./routes/statistics/+page.svelte')
};
```

### 2. 状態管理の最適化
```typescript
// Svelte 5 Runeを使用した効率的な状態管理
class DashboardStore {
  // 基本状態
  cards = $state<DashboardCard[]>([]);
  isEditMode = $state(false);
  
  // 派生状態（自動的に再計算）
  visibleCards = $derived(
    this.cards.filter(card => card.isVisible)
  );
  
  // 計算コストの高い派生状態（メモ化）
  sortedCards = $derived.by(() => {
    return this.visibleCards
      .slice()
      .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  });
  
  // アクション
  addCard(card: DashboardCard) {
    this.cards.push(card);
  }
  
  removeCard(cardId: string) {
    this.cards = this.cards.filter(card => card.id !== cardId);
  }
}
```

### 3. 仮想化とページネーション
```typescript
// 大量データの仮想化
interface VirtualListProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => ComponentType;
}

// ページネーション
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}
```

## セキュリティ考慮事項

### 1. 認証・認可
```typescript
// Firebase Authenticationを使用した認証
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: Permission[];
}

// ロールベースアクセス制御
const checkPermission = (requiredPermission: Permission, userPermissions: Permission[]) => {
  return userPermissions.includes(requiredPermission);
};

// ルートガード
const requireAuth = (permission?: Permission) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      if (!authStore.isAuthenticated) {
        throw new Error('認証が必要です');
      }
      if (permission && !checkPermission(permission, authStore.user.permissions)) {
        throw new Error('権限が不足しています');
      }
      return originalMethod.apply(this, args);
    };
  };
};
```

### 2. データ検証とサニタイゼーション
```typescript
// 入力値検証
const validateUserInput = (input: string): string => {
  // HTMLタグの除去
  const sanitized = input.replace(/<[^>]*>/g, '');
  // 長さ制限
  return sanitized.slice(0, 1000);
};

// スキーマ検証
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  birthDate: z.date(),
  careLevel: z.number().min(1).max(5)
});
```

### 3. データ暗号化
```typescript
// 機密データの暗号化
const encryptSensitiveData = (data: string): string => {
  // 実装は環境に応じて選択
  return btoa(data); // 簡易例（本番では適切な暗号化を使用）
};

// 通信の暗号化（HTTPS必須）
const apiClient = {
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`
  }
};
```

この設計書では、要件定義で定めた全ての機能を技術的に実現するための詳細な設計を提供しています。Svelte 5のRune機能を活用した現代的な状態管理、MasterCSSによる効率的なスタイリング、そして拡張性とメンテナンス性を重視したアーキテクチャを採用しています。