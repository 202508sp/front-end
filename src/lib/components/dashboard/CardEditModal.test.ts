/**
 * CardEditModal コンポーネントのテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/svelte';
import CardEditModal from './CardEditModal.svelte';
import type { DashboardCard } from '$lib/types/dashboard';

// モックカードデータ
const mockCard: DashboardCard = {
  id: 'test-card-1',
  userId: 'user-1',
  type: 'user-list',
  title: 'テストカード',
  icon: 'material-symbols:person-outline',
  size: 'medium',
  position: { x: 0, y: 0 },
  config: { maxItems: 10, sortBy: 'name' },
  isVisible: true,
  order: 1,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
};

describe('CardEditModal', () => {
  let onCloseMock: ReturnType<typeof vi.fn>;
  let onSaveMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCloseMock = vi.fn();
    onSaveMock = vi.fn();
  });

  it('モーダルが正しく表示される', () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    expect(screen.getByText('カード設定')).toBeInTheDocument();
    expect(screen.getByDisplayValue('テストカード')).toBeInTheDocument();
  });

  it('カードタイトルを編集できる', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    const titleInput = screen.getByDisplayValue('テストカード');
    await fireEvent.input(titleInput, { target: { value: '新しいタイトル' } });

    expect(titleInput).toHaveValue('新しいタイトル');
  });

  it('カードサイズを変更できる', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    const largeRadio = screen.getByDisplayValue('large');
    await fireEvent.click(largeRadio);

    expect(largeRadio).toBeChecked();
  });

  it('表示設定を切り替えできる', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    const visibilityToggle = screen.getByRole('switch');
    await fireEvent.click(visibilityToggle);

    // トグルの状態が変更されることを確認
    expect(visibilityToggle).toHaveAttribute('aria-checked', 'false');
  });

  it('カードタイプ別の設定項目が表示される', () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    // user-list タイプの設定項目
    expect(screen.getByText('最大表示件数')).toBeInTheDocument();
    expect(screen.getByText('ソート順')).toBeInTheDocument();
  });

  it('統計カードの設定項目が正しく表示される', () => {
    const statsCard: DashboardCard = {
      ...mockCard,
      type: 'statistics',
      config: { statType: 'user-count', dateRange: 'today' }
    };

    render(CardEditModal, {
      props: {
        isOpen: true,
        card: statsCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    expect(screen.getByText('統計タイプ')).toBeInTheDocument();
    expect(screen.getByText('期間')).toBeInTheDocument();
  });

  it('保存ボタンクリックで正しいデータが送信される', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストカード');
    await fireEvent.input(titleInput, { target: { value: '更新されたタイトル' } });

    // サイズを変更
    const largeRadio = screen.getByDisplayValue('large');
    await fireEvent.click(largeRadio);

    // 保存ボタンをクリック
    const saveButton = screen.getByText('保存');
    await fireEvent.click(saveButton);

    expect(onSaveMock).toHaveBeenCalledWith('test-card-1', {
      title: '更新されたタイトル',
      size: 'large',
      config: { maxItems: 10, sortBy: 'name' },
      isVisible: true,
      updatedAt: expect.any(Date)
    });
  });

  it('キャンセルボタンクリックでモーダルが閉じる', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    const cancelButton = screen.getByText('キャンセル');
    await fireEvent.click(cancelButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('リセットボタンで初期値に戻る', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    // タイトルを変更
    const titleInput = screen.getByDisplayValue('テストカード');
    await fireEvent.input(titleInput, { target: { value: '変更されたタイトル' } });

    // リセットボタンをクリック
    const resetButton = screen.getByText('リセット');
    await fireEvent.click(resetButton);

    // 元の値に戻ることを確認
    expect(titleInput).toHaveValue('テストカード');
  });

  it('プレビューが正しく表示される', () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    expect(screen.getByText('プレビュー')).toBeInTheDocument();
    expect(screen.getByText('サイズ: 中 (240x120)')).toBeInTheDocument();
  });

  it('非表示設定時にプレビューに警告が表示される', async () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: mockCard,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    // 表示設定をオフにする
    const visibilityToggle = screen.getByRole('switch');
    await fireEvent.click(visibilityToggle);

    expect(screen.getByText('※ 非表示設定')).toBeInTheDocument();
  });

  it('カードがnullの場合は何も表示されない', () => {
    render(CardEditModal, {
      props: {
        isOpen: true,
        card: null,
        onClose: onCloseMock,
        onSave: onSaveMock
      }
    });

    expect(screen.queryByText('基本設定')).not.toBeInTheDocument();
  });
});