/**
 * ダッシュボード状態管理ストア
 * Svelte 5 Rune を使用した状態管理
 */

import type { 
  DashboardCard, 
  DashboardLayout, 
  CardTemplate, 
  DragState, 
  GridSettings,
  Position,
  CardType,
  CardSize 
} from '$lib/types/dashboard';

const STORAGE_KEY = 'care-facility-dashboard';
const LAYOUT_STORAGE_KEY = 'dashboard-layout';

/**
 * ローカルストレージからデータを読み込む
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Date オブジェクトの復元
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        })) as T;
      }
      return {
        ...parsed,
        createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : new Date()
      } as T;
    }
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
  }
  
  return defaultValue;
}

/**
 * ローカルストレージにデータを保存する
 */
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
}

/**
 * デフォルトのカードテンプレート
 */
const DEFAULT_CARD_TEMPLATES: CardTemplate[] = [
  {
    type: 'user-list',
    title: '利用者一覧',
    icon: 'material-symbols:person-outline',
    defaultSize: 'medium',
    defaultConfig: { maxItems: 10, sortBy: 'name' },
    description: '利用者の一覧を表示します',
    category: 'management'
  },
  {
    type: 'statistics',
    title: '統計情報',
    icon: 'material-symbols:analytics-outline',
    defaultSize: 'large',
    defaultConfig: { statType: 'user-count', dateRange: 'today' },
    description: '施設の統計情報を表示します',
    category: 'statistics'
  },
  {
    type: 'schedule',
    title: 'スケジュール',
    icon: 'material-symbols:calendar-today-outline',
    defaultSize: 'medium',
    defaultConfig: { maxItems: 5 },
    description: '今日のスケジュールを表示します',
    category: 'management'
  },
  {
    type: 'notifications',
    title: '通知',
    icon: 'material-symbols:notifications-outline',
    defaultSize: 'small',
    defaultConfig: { maxItems: 5, notificationTypes: ['urgent', 'info'] },
    description: '重要な通知を表示します',
    category: 'communication'
  },
  {
    type: 'quick-actions',
    title: 'クイックアクション',
    icon: 'material-symbols:bolt-outline',
    defaultSize: 'small',
    defaultConfig: { actions: ['add-user', 'create-report', 'send-message'] },
    description: 'よく使う機能への素早いアクセス',
    category: 'utilities'
  }
];

/**
 * デフォルトのグリッド設定
 */
const DEFAULT_GRID_SETTINGS: GridSettings = {
  columns: 12,
  rows: 8,
  gap: 16,
  cellWidth: 120,
  cellHeight: 120
};

/**
 * ダッシュボードストアクラス
 */
export class DashboardStore {
  // 基本状態
  cards = $state<DashboardCard[]>(loadFromStorage(STORAGE_KEY, []));
  currentLayout = $state<DashboardLayout | null>(loadFromStorage(LAYOUT_STORAGE_KEY, null));
  isEditMode = $state(false);
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  // ドラッグ&ドロップ状態
  dragState = $state<DragState>({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    dropZones: []
  });
  
  // グリッド設定
  gridSettings = $state<GridSettings>(DEFAULT_GRID_SETTINGS);
  
  // カードテンプレート
  cardTemplates = $state<CardTemplate[]>(DEFAULT_CARD_TEMPLATES);
  
  // 派生状態（自動的に再計算）
  visibleCards = $derived(
    this.cards.filter(card => card.isVisible)
  );
  
  // 表示順でソートされたカード
  sortedCards = $derived.by(() => {
    return this.visibleCards
      .slice()
      .sort((a, b) => {
        // まず order でソート、次に position.y、最後に position.x
        if (a.order !== b.order) return a.order - b.order;
        if (a.position.y !== b.position.y) return a.position.y - b.position.y;
        return a.position.x - b.position.x;
      });
  });
  
  // カードタイプ別の統計
  cardStats = $derived.by(() => {
    const stats: Record<CardType, number> = {
      'user-list': 0,
      'statistics': 0,
      'schedule': 0,
      'notifications': 0,
      'quick-actions': 0,
      'recent-reports': 0,
      'chat-summary': 0,
      'weather': 0,
      'calendar': 0
    };
    
    this.visibleCards.forEach(card => {
      stats[card.type]++;
    });
    
    return stats;
  });
  
  // 編集可能かどうか
  canEdit = $derived(this.isEditMode && !this.isLoading);
  
  // 空のポジションを取得
  availablePositions = $derived.by(() => {
    const occupied = new Set(
      this.visibleCards.map(card => `${card.position.x},${card.position.y}`)
    );
    
    const available: Position[] = [];
    for (let y = 0; y < this.gridSettings.rows; y++) {
      for (let x = 0; x < this.gridSettings.columns; x++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }
    
    return available;
  });

  /**
   * カードを追加する
   */
  addCard(template: CardTemplate, position?: Position): DashboardCard {
    const newPosition = position || this.getNextAvailablePosition();
    const newCard: DashboardCard = {
      id: this.generateCardId(),
      userId: 'current-user', // TODO: 実際のユーザーIDを設定
      type: template.type,
      title: template.title,
      icon: template.icon,
      size: template.defaultSize,
      position: newPosition,
      config: { ...template.defaultConfig },
      isVisible: true,
      order: this.getNextOrder(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.cards.push(newCard);
    this.saveToStorage();
    
    return newCard;
  }
  
  /**
   * カードを削除する
   */
  removeCard(cardId: string): boolean {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index === -1) return false;
    
    this.cards.splice(index, 1);
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * カードを移動する
   */
  moveCard(cardId: string, newPosition: Position): boolean {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    // 移動先に他のカードがある場合は位置を交換
    const targetCardIndex = this.cards.findIndex(c => 
      c.id !== cardId && 
      c.position.x === newPosition.x && 
      c.position.y === newPosition.y
    );
    
    if (targetCardIndex !== -1) {
      this.cards[targetCardIndex].position = { ...this.cards[cardIndex].position };
      this.cards[targetCardIndex].updatedAt = new Date();
    }
    
    this.cards[cardIndex].position = { ...newPosition };
    this.cards[cardIndex].updatedAt = new Date();
    
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * カードの設定を更新する
   */
  updateCard(cardId: string, updates: Partial<DashboardCard>): boolean {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    // 更新前の状態を保存（undo機能用）
    const previousState = { ...this.cards[cardIndex] };
    
    // 設定を更新
    Object.assign(this.cards[cardIndex], updates, { updatedAt: new Date() });
    
    // 設定の検証
    if (!this.validateCardConfig(this.cards[cardIndex])) {
      // 検証失敗時は元に戻す
      this.cards[cardIndex] = previousState;
      this.setError('カード設定が無効です');
      return false;
    }
    
    this.saveToStorage();
    this.setError(null);
    
    return true;
  }

  /**
   * カード設定の検証
   */
  private validateCardConfig(card: DashboardCard): boolean {
    // 基本検証
    if (!card.title || card.title.trim().length === 0) return false;
    if (!['small', 'medium', 'large'].includes(card.size)) return false;
    if (card.position.x < 0 || card.position.y < 0) return false;
    if (card.position.x >= this.gridSettings.columns || card.position.y >= this.gridSettings.rows) return false;

    // カードタイプ別の設定検証
    switch (card.type) {
      case 'user-list':
        if (card.config.maxItems && (card.config.maxItems < 1 || card.config.maxItems > 50)) return false;
        break;
      case 'statistics':
        if (card.config.statType && !['user-count', 'staff-count', 'daily-reports', 'monthly-summary'].includes(card.config.statType)) return false;
        if (card.config.dateRange && !['today', 'week', 'month', 'custom'].includes(card.config.dateRange)) return false;
        break;
      case 'notifications':
        if (card.config.maxItems && (card.config.maxItems < 1 || card.config.maxItems > 20)) return false;
        break;
      case 'schedule':
        if (card.config.maxItems && (card.config.maxItems < 1 || card.config.maxItems > 10)) return false;
        break;
    }

    return true;
  }
  
  /**
   * カードの表示/非表示を切り替える
   */
  toggleCardVisibility(cardId: string): boolean {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    this.cards[cardIndex].isVisible = !this.cards[cardIndex].isVisible;
    this.cards[cardIndex].updatedAt = new Date();
    
    this.saveToStorage();
    
    return true;
  }
  
  /**
   * 編集モードを切り替える
   */
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    // 編集モード終了時にドラッグ状態をリセット
    if (!this.isEditMode) {
      this.resetDragState();
    }
  }
  
  /**
   * ドラッグ開始
   */
  startDrag(cardId: string, offset: Position): void {
    const card = this.cards.find(c => c.id === cardId);
    if (!card || !this.canEdit) return;
    
    this.dragState.isDragging = true;
    this.dragState.draggedCard = card;
    this.dragState.dragOffset = offset;
    this.updateDropZones();
  }
  
  /**
   * ドラッグ終了
   */
  endDrag(dropPosition?: Position): void {
    if (!this.dragState.isDragging || !this.dragState.draggedCard) return;
    
    if (dropPosition) {
      this.moveCard(this.dragState.draggedCard.id, dropPosition);
    }
    
    this.resetDragState();
  }
  
  /**
   * ドラッグ状態をリセット
   */
  resetDragState(): void {
    this.dragState.isDragging = false;
    this.dragState.draggedCard = undefined;
    this.dragState.dragOffset = { x: 0, y: 0 };
    this.dragState.dropZones = [];
  }
  
  /**
   * ドロップゾーンを更新
   */
  private updateDropZones(): void {
    this.dragState.dropZones = this.availablePositions;
  }
  
  /**
   * 次の利用可能な位置を取得
   */
  private getNextAvailablePosition(): Position {
    const available = this.availablePositions;
    return available.length > 0 ? available[0] : { x: 0, y: 0 };
  }
  
  /**
   * 次のオーダー番号を取得
   */
  private getNextOrder(): number {
    return Math.max(0, ...this.cards.map(card => card.order)) + 1;
  }
  
  /**
   * カードIDを生成
   */
  private generateCardId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * ローカルストレージに保存
   */
  private saveToStorage(): void {
    saveToStorage(STORAGE_KEY, this.cards);
    if (this.currentLayout) {
      saveToStorage(LAYOUT_STORAGE_KEY, this.currentLayout);
    }
  }
  
  /**
   * レイアウトを保存
   */
  saveLayout(name: string): DashboardLayout {
    const layout: DashboardLayout = {
      id: `layout_${Date.now()}`,
      userId: 'current-user', // TODO: 実際のユーザーIDを設定
      name,
      cards: [...this.cards],
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.currentLayout = layout;
    this.saveToStorage();
    
    return layout;
  }
  
  /**
   * レイアウトを読み込み
   */
  loadLayout(layout: DashboardLayout): void {
    this.cards = [...layout.cards];
    this.currentLayout = layout;
    this.saveToStorage();
  }
  
  /**
   * ダッシュボードをリセット
   */
  reset(): void {
    this.cards = [];
    this.currentLayout = null;
    this.isEditMode = false;
    this.resetDragState();
    this.saveToStorage();
  }

  /**
   * カードを複製する
   */
  duplicateCard(cardId: string): DashboardCard | null {
    const originalCard = this.cards.find(c => c.id === cardId);
    if (!originalCard) return null;

    const nextPosition = this.getNextAvailablePosition();
    const duplicatedCard: DashboardCard = {
      ...originalCard,
      id: this.generateCardId(),
      title: `${originalCard.title} (コピー)`,
      position: nextPosition,
      order: this.getNextOrder(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.cards.push(duplicatedCard);
    this.saveToStorage();

    return duplicatedCard;
  }

  /**
   * カードの設定をエクスポート
   */
  exportCardSettings(): string {
    const exportData = {
      cards: this.cards,
      gridSettings: this.gridSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * カードの設定をインポート
   */
  importCardSettings(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.cards || !Array.isArray(importData.cards)) {
        this.setError('無効なデータ形式です');
        return false;
      }

      // データの検証
      const validCards = importData.cards.filter((card: any) => {
        return card.id && card.type && card.title && card.position;
      });

      if (validCards.length === 0) {
        this.setError('有効なカードデータが見つかりません');
        return false;
      }

      // 既存のカードをクリアして新しいデータを設定
      this.cards = validCards.map((card: any) => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt)
      }));

      if (importData.gridSettings) {
        this.gridSettings = { ...this.gridSettings, ...importData.gridSettings };
      }

      this.saveToStorage();
      this.setError(null);

      return true;
    } catch (error) {
      this.setError('データの読み込みに失敗しました');
      return false;
    }
  }

  /**
   * カードの統計情報を取得
   */
  getCardStatistics() {
    return {
      totalCards: this.cards.length,
      visibleCards: this.visibleCards.length,
      hiddenCards: this.cards.length - this.visibleCards.length,
      cardsByType: this.cardStats,
      cardsBySizeSmall: this.cards.filter(c => c.size === 'small').length,
      cardsBySizeMedium: this.cards.filter(c => c.size === 'medium').length,
      cardsBySizeLarge: this.cards.filter(c => c.size === 'large').length,
      lastUpdated: this.cards.length > 0 ? 
        Math.max(...this.cards.map(c => c.updatedAt.getTime())) : null
    };
  }
  
  /**
   * エラーを設定
   */
  setError(error: string | null): void {
    this.error = error;
  }
  
  /**
   * ローディング状態を設定
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }
}

// シングルトンインスタンスを作成
export const dashboardStore = new DashboardStore();