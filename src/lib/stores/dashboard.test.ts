/**
 * ダッシュボードストアのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardStore } from './dashboard.svelte';
import type { CardTemplate, Position } from '$lib/types/dashboard';

// localStorage のモック
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('DashboardStore', () => {
  let store: DashboardStore;
  
  beforeEach(() => {
    // localStorage モックをリセット
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    
    store = new DashboardStore();
  });
  
  describe('カード管理', () => {
    it('カードを追加できる', () => {
      const template: CardTemplate = {
        type: 'user-list',
        title: 'テストカード',
        icon: 'test-icon',
        defaultSize: 'medium',
        defaultConfig: {},
        description: 'テスト用カード',
        category: 'management'
      };
      
      const card = store.addCard(template);
      
      expect(card).toBeDefined();
      expect(card.type).toBe('user-list');
      expect(card.title).toBe('テストカード');
      expect(card.isVisible).toBe(true);
      expect(store.cards).toHaveLength(1);
    });
    
    it('カードを削除できる', () => {
      const template: CardTemplate = {
        type: 'statistics',
        title: '統計カード',
        icon: 'stats-icon',
        defaultSize: 'large',
        defaultConfig: {},
        description: '統計用カード',
        category: 'statistics'
      };
      
      const card = store.addCard(template);
      expect(store.cards).toHaveLength(1);
      
      const removed = store.removeCard(card.id);
      expect(removed).toBe(true);
      expect(store.cards).toHaveLength(0);
    });
    
    it('存在しないカードの削除は失敗する', () => {
      const removed = store.removeCard('non-existent-id');
      expect(removed).toBe(false);
    });
    
    it('カードを移動できる', () => {
      const template: CardTemplate = {
        type: 'schedule',
        title: 'スケジュールカード',
        icon: 'schedule-icon',
        defaultSize: 'medium',
        defaultConfig: {},
        description: 'スケジュール用カード',
        category: 'management'
      };
      
      const card = store.addCard(template, { x: 0, y: 0 });
      const newPosition: Position = { x: 2, y: 3 };
      
      const moved = store.moveCard(card.id, newPosition);
      expect(moved).toBe(true);
      
      const updatedCard = store.cards.find(c => c.id === card.id);
      expect(updatedCard?.position).toEqual(newPosition);
    });
    
    it('カードの表示/非表示を切り替えできる', () => {
      const template: CardTemplate = {
        type: 'notifications',
        title: '通知カード',
        icon: 'notification-icon',
        defaultSize: 'small',
        defaultConfig: {},
        description: '通知用カード',
        category: 'communication'
      };
      
      const card = store.addCard(template);
      expect(card.isVisible).toBe(true);
      expect(store.visibleCards).toHaveLength(1);
      
      store.toggleCardVisibility(card.id);
      let updatedCard = store.cards.find(c => c.id === card.id);
      expect(updatedCard?.isVisible).toBe(false);
      expect(store.visibleCards).toHaveLength(0);
      
      store.toggleCardVisibility(card.id);
      updatedCard = store.cards.find(c => c.id === card.id);
      expect(updatedCard?.isVisible).toBe(true);
      expect(store.visibleCards).toHaveLength(1);
    });
  });
  
  describe('編集モード', () => {
    it('編集モードを切り替えできる', () => {
      expect(store.isEditMode).toBe(false);
      expect(store.canEdit).toBe(false);
      
      store.toggleEditMode();
      expect(store.isEditMode).toBe(true);
      expect(store.canEdit).toBe(true);
      
      store.toggleEditMode();
      expect(store.isEditMode).toBe(false);
      expect(store.canEdit).toBe(false);
    });
  });
  
  describe('ドラッグ&ドロップ', () => {
    it('ドラッグを開始できる', () => {
      const template: CardTemplate = {
        type: 'quick-actions',
        title: 'クイックアクション',
        icon: 'action-icon',
        defaultSize: 'small',
        defaultConfig: {},
        description: 'アクション用カード',
        category: 'utilities'
      };
      
      const card = store.addCard(template);
      store.toggleEditMode(); // 編集モードを有効にする
      
      const offset: Position = { x: 10, y: 20 };
      store.startDrag(card.id, offset);
      
      expect(store.dragState.isDragging).toBe(true);
      expect(store.dragState.draggedCard).toStrictEqual(card);
      expect(store.dragState.dragOffset).toEqual(offset);
    });
    
    it('ドラッグを終了できる', () => {
      const template: CardTemplate = {
        type: 'weather',
        title: '天気',
        icon: 'weather-icon',
        defaultSize: 'small',
        defaultConfig: {},
        description: '天気用カード',
        category: 'utilities'
      };
      
      const card = store.addCard(template, { x: 0, y: 0 });
      store.toggleEditMode();
      
      store.startDrag(card.id, { x: 0, y: 0 });
      expect(store.dragState.isDragging).toBe(true);
      
      const dropPosition: Position = { x: 1, y: 1 };
      store.endDrag(dropPosition);
      
      expect(store.dragState.isDragging).toBe(false);
      expect(store.dragState.draggedCard).toBeUndefined();
      
      const updatedCard = store.cards.find(c => c.id === card.id);
      expect(updatedCard?.position).toEqual(dropPosition);
    });
  });
  
  describe('派生状態', () => {
    it('visibleCards が正しく計算される', () => {
      const template1: CardTemplate = {
        type: 'user-list',
        title: 'カード1',
        icon: 'icon1',
        defaultSize: 'medium',
        defaultConfig: {},
        description: 'カード1',
        category: 'management'
      };
      
      const template2: CardTemplate = {
        type: 'statistics',
        title: 'カード2',
        icon: 'icon2',
        defaultSize: 'large',
        defaultConfig: {},
        description: 'カード2',
        category: 'statistics'
      };
      
      const card1 = store.addCard(template1);
      const card2 = store.addCard(template2);
      
      expect(store.visibleCards).toHaveLength(2);
      
      store.toggleCardVisibility(card1.id);
      expect(store.visibleCards).toHaveLength(1);
      expect(store.visibleCards[0]).toStrictEqual(card2);
    });
    
    it('cardStats が正しく計算される', () => {
      const userListTemplate: CardTemplate = {
        type: 'user-list',
        title: 'ユーザーリスト',
        icon: 'user-icon',
        defaultSize: 'medium',
        defaultConfig: {},
        description: 'ユーザーリスト',
        category: 'management'
      };
      
      const statsTemplate: CardTemplate = {
        type: 'statistics',
        title: '統計',
        icon: 'stats-icon',
        defaultSize: 'large',
        defaultConfig: {},
        description: '統計',
        category: 'statistics'
      };
      
      store.addCard(userListTemplate);
      store.addCard(statsTemplate);
      store.addCard(statsTemplate); // 同じタイプを2つ追加
      
      const stats = store.cardStats;
      expect(stats['user-list']).toBe(1);
      expect(stats['statistics']).toBe(2);
      expect(stats['schedule']).toBe(0);
    });
  });
  
  describe('ローカルストレージ', () => {
    it('カード追加時にローカルストレージに保存される', () => {
      const template: CardTemplate = {
        type: 'calendar',
        title: 'カレンダー',
        icon: 'calendar-icon',
        defaultSize: 'large',
        defaultConfig: {},
        description: 'カレンダー',
        category: 'utilities'
      };
      
      store.addCard(template);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'care-facility-dashboard',
        expect.any(String)
      );
    });
  });
  
  describe('レイアウト管理', () => {
    it('レイアウトを保存できる', () => {
      const template: CardTemplate = {
        type: 'user-list',
        title: 'テストカード',
        icon: 'test-icon',
        defaultSize: 'medium',
        defaultConfig: {},
        description: 'テスト',
        category: 'management'
      };
      
      store.addCard(template);
      
      const layout = store.saveLayout('テストレイアウト');
      
      expect(layout.name).toBe('テストレイアウト');
      expect(layout.cards).toHaveLength(1);
      expect(store.currentLayout).toStrictEqual(layout);
    });
  });
  
  describe('リセット機能', () => {
    it('ダッシュボードをリセットできる', () => {
      const template: CardTemplate = {
        type: 'notifications',
        title: '通知',
        icon: 'notification-icon',
        defaultSize: 'small',
        defaultConfig: {},
        description: '通知',
        category: 'communication'
      };
      
      store.addCard(template);
      store.toggleEditMode();
      
      expect(store.cards).toHaveLength(1);
      expect(store.isEditMode).toBe(true);
      
      store.reset();
      
      expect(store.cards).toHaveLength(0);
      expect(store.isEditMode).toBe(false);
      expect(store.currentLayout).toBeNull();
    });
  });
});