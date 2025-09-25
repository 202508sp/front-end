/**
 * ダッシュボードドラッグ機能の統合テスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { dashboardStore } from '$lib/stores/dashboard.svelte.js';
import type { CardTemplate } from '$lib/types/dashboard.js';

describe('Dashboard Drag Integration', () => {
  beforeEach(() => {
    // テスト前にダッシュボードをリセット
    dashboardStore.reset();
  });

  it('カードの追加と移動が正しく動作する', () => {
    // テンプレートを作成
    const template: CardTemplate = {
      type: 'user-list',
      title: 'テストカード',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: { maxItems: 10 },
      description: 'テスト用カード',
      category: 'management'
    };

    // カードを追加
    const card = dashboardStore.addCard(template);
    expect(card).toBeDefined();
    expect(card.position).toEqual({ x: 0, y: 0 });

    // カードが表示されることを確認
    expect(dashboardStore.visibleCards.length).toBe(1);
    expect(dashboardStore.visibleCards[0].id).toBe(card.id);

    // カードを移動
    const newPosition = { x: 2, y: 1 };
    const moveResult = dashboardStore.moveCard(card.id, newPosition);
    expect(moveResult).toBe(true);

    // 移動後の位置を確認
    const movedCard = dashboardStore.visibleCards.find(c => c.id === card.id);
    expect(movedCard?.position).toEqual(newPosition);
  });

  it('複数カードの位置交換が正しく動作する', () => {
    // 2つのカードを追加
    const template1: CardTemplate = {
      type: 'user-list',
      title: 'カード1',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: {},
      description: 'テスト用カード1',
      category: 'management'
    };

    const template2: CardTemplate = {
      type: 'statistics',
      title: 'カード2',
      icon: 'material-symbols:analytics-outline',
      defaultSize: 'small',
      defaultConfig: {},
      description: 'テスト用カード2',
      category: 'statistics'
    };

    const card1 = dashboardStore.addCard(template1, { x: 0, y: 0 });
    const card2 = dashboardStore.addCard(template2, { x: 1, y: 0 });

    // カード1をカード2の位置に移動（位置交換）
    dashboardStore.moveCard(card1.id, { x: 1, y: 0 });

    // 位置が交換されたことを確認
    const updatedCard1 = dashboardStore.visibleCards.find(c => c.id === card1.id);
    const updatedCard2 = dashboardStore.visibleCards.find(c => c.id === card2.id);

    expect(updatedCard1?.position).toEqual({ x: 1, y: 0 });
    expect(updatedCard2?.position).toEqual({ x: 0, y: 0 });
  });

  it('編集モードの切り替えが正しく動作する', () => {
    // 初期状態では編集モードがオフ
    expect(dashboardStore.isEditMode).toBe(false);
    expect(dashboardStore.canEdit).toBe(false);

    // 編集モードを有効にする
    dashboardStore.toggleEditMode();
    expect(dashboardStore.isEditMode).toBe(true);
    expect(dashboardStore.canEdit).toBe(true);

    // 編集モードを無効にする
    dashboardStore.toggleEditMode();
    expect(dashboardStore.isEditMode).toBe(false);
    expect(dashboardStore.canEdit).toBe(false);
  });

  it('ドラッグ状態の管理が正しく動作する', () => {
    // カードを追加
    const template: CardTemplate = {
      type: 'user-list',
      title: 'テストカード',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: {},
      description: 'テスト用カード',
      category: 'management'
    };

    const card = dashboardStore.addCard(template);
    dashboardStore.toggleEditMode(); // 編集モードを有効にする

    // ドラッグ開始
    dashboardStore.startDrag(card.id, { x: 10, y: 10 });
    expect(dashboardStore.dragState.isDragging).toBe(true);
    expect(dashboardStore.dragState.draggedCard?.id).toBe(card.id);
    expect(dashboardStore.dragState.dragOffset).toEqual({ x: 10, y: 10 });

    // ドラッグ終了
    dashboardStore.endDrag({ x: 2, y: 1 });
    expect(dashboardStore.dragState.isDragging).toBe(false);
    expect(dashboardStore.dragState.draggedCard).toBeUndefined();

    // カードが移動されたことを確認
    const movedCard = dashboardStore.visibleCards.find(c => c.id === card.id);
    expect(movedCard?.position).toEqual({ x: 2, y: 1 });
  });

  it('利用可能な位置の計算が正しく動作する', () => {
    // 初期状態では全ての位置が利用可能
    const initialAvailable = dashboardStore.availablePositions;
    expect(initialAvailable.length).toBe(dashboardStore.gridSettings.columns * dashboardStore.gridSettings.rows);

    // カードを追加
    const template: CardTemplate = {
      type: 'user-list',
      title: 'テストカード',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: {},
      description: 'テスト用カード',
      category: 'management'
    };

    dashboardStore.addCard(template, { x: 0, y: 0 });

    // 利用可能な位置が1つ減ったことを確認
    const availableAfterAdd = dashboardStore.availablePositions;
    expect(availableAfterAdd.length).toBe(initialAvailable.length - 1);
    expect(availableAfterAdd.find(pos => pos.x === 0 && pos.y === 0)).toBeUndefined();
  });

  it('カードの削除が正しく動作する', () => {
    // カードを追加
    const template: CardTemplate = {
      type: 'user-list',
      title: 'テストカード',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: {},
      description: 'テスト用カード',
      category: 'management'
    };

    const card = dashboardStore.addCard(template);
    expect(dashboardStore.visibleCards.length).toBe(1);

    // カードを削除
    const removeResult = dashboardStore.removeCard(card.id);
    expect(removeResult).toBe(true);
    expect(dashboardStore.visibleCards.length).toBe(0);

    // 存在しないカードの削除は失敗する
    const removeNonExistentResult = dashboardStore.removeCard('non-existent-id');
    expect(removeNonExistentResult).toBe(false);
  });

  it('カード統計が正しく計算される', () => {
    // 初期状態では全ての統計が0
    const initialStats = dashboardStore.cardStats;
    expect(initialStats['user-list']).toBe(0);
    expect(initialStats.statistics).toBe(0);

    // 異なるタイプのカードを追加
    const userListTemplate: CardTemplate = {
      type: 'user-list',
      title: 'ユーザーリスト',
      icon: 'material-symbols:person-outline',
      defaultSize: 'medium',
      defaultConfig: {},
      description: 'ユーザーリストカード',
      category: 'management'
    };

    const statisticsTemplate: CardTemplate = {
      type: 'statistics',
      title: '統計',
      icon: 'material-symbols:analytics-outline',
      defaultSize: 'large',
      defaultConfig: {},
      description: '統計カード',
      category: 'statistics'
    };

    dashboardStore.addCard(userListTemplate);
    dashboardStore.addCard(statisticsTemplate);
    dashboardStore.addCard(userListTemplate); // 同じタイプをもう一つ

    // 統計が正しく更新されたことを確認
    const updatedStats = dashboardStore.cardStats;
    expect(updatedStats['user-list']).toBe(2);
    expect(updatedStats.statistics).toBe(1);
  });
});