/**
 * ReportStore のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportStore } from './report.svelte';
import type { Report } from '$lib/types/report';

// localStorage のモック（お気に入り永続化の影響を排除）
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock
});

describe('ReportStore', () => {
	let store: ReportStore;

	const mockReport: Report = {
		id: 'r1',
		userId: 'u1',
		authorId: 's1',
		authorName: '田中 花子',
		type: 'daily',
		title: '日次レポート',
		content: '本文',
		sections: [],
		attachments: [],
		date: new Date('2024-01-15'),
		status: 'published',
		isPublishedToFamily: true,
		publishedAt: new Date('2024-01-15T18:00:00'),
		tags: [],
		createdAt: new Date('2024-01-15T17:30:00'),
		updatedAt: new Date('2024-01-15T18:00:00')
	};

	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
		store = new ReportStore();
	});

	it('初期状態が正しく設定されている', () => {
		expect(store.reports).toEqual([]);
		expect(store.selectedReport).toBeNull();
		expect(store.isLoading).toBe(false);
		expect(store.error).toBeNull();
		expect(store.favoriteReportIds).toEqual([]);
	});

	it('お気に入りをトグルできる', () => {
		store.reports = [mockReport];

		expect(store.favoriteReportIds).toEqual([]);
		store.toggleFavoriteReport('r1');
		expect(store.favoriteReportIds).toEqual(['r1']);
		store.toggleFavoriteReport('r1');
		expect(store.favoriteReportIds).toEqual([]);
	});

	it('お気に入り順序を移動できる', () => {
		store.reports = [
			{ ...mockReport, id: 'r1', title: '1' },
			{ ...mockReport, id: 'r2', title: '2' },
			{ ...mockReport, id: 'r3', title: '3' }
		];

		store.toggleFavoriteReport('r1');
		store.toggleFavoriteReport('r2');
		store.toggleFavoriteReport('r3');
		// 追加は先頭挿入なので [r3, r2, r1]
		expect(store.favoriteReportIds).toEqual(['r3', 'r2', 'r1']);

		// r3 を r1 の後ろへ
		store.moveFavoriteReport('r3', 'r1', true);
		expect(store.favoriteReportIds).toEqual(['r2', 'r1', 'r3']);
	});
});
