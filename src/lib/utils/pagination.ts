/**
 * ページネーションとデータ管理ユーティリティ
 * 大量データの効率的な分割・管理を実装
 */

/**
 * ページネーション設定
 */
export interface PaginationConfig {
  /** 1ページあたりのアイテム数 */
  pageSize: number;
  /** 現在のページ（1ベース） */
  currentPage: number;
  /** 総アイテム数 */
  totalItems: number;
  /** プリフェッチするページ数 */
  prefetchPages?: number;
}

/**
 * ページネーション結果
 */
export interface PaginationResult<T> {
  /** 現在のページのアイテム */
  items: T[];
  /** 現在のページ */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** 総アイテム数 */
  totalItems: number;
  /** 1ページあたりのアイテム数 */
  pageSize: number;
  /** 前のページがあるか */
  hasPrevious: boolean;
  /** 次のページがあるか */
  hasNext: boolean;
  /** 開始アイテムのインデックス */
  startIndex: number;
  /** 終了アイテムのインデックス */
  endIndex: number;
}

/**
 * 無限スクロール設定
 */
export interface InfiniteScrollConfig {
  /** 初期ページサイズ */
  initialPageSize: number;
  /** 追加読み込みのページサイズ */
  loadMorePageSize: number;
  /** プリフェッチの閾値（残りアイテム数） */
  prefetchThreshold: number;
  /** 最大キャッシュサイズ */
  maxCacheSize?: number;
}

/**
 * データページャークラス
 */
export class DataPager<T> {
  private cache = new Map<number, T[]>();
  private config: PaginationConfig;
  private dataLoader: (page: number, pageSize: number) => Promise<{ items: T[]; totalItems: number }>;

  constructor(
    config: PaginationConfig,
    dataLoader: (page: number, pageSize: number) => Promise<{ items: T[]; totalItems: number }>
  ) {
    this.config = { ...config };
    this.dataLoader = dataLoader;
  }

  /**
   * 指定ページのデータを取得
   */
  async getPage(page: number): Promise<PaginationResult<T>> {
    // キャッシュから取得を試行
    const cachedItems = this.cache.get(page);
    let items: T[];
    let totalItems = this.config.totalItems;

    if (cachedItems) {
      items = cachedItems;
    } else {
      // データを読み込み
      const result = await this.dataLoader(page, this.config.pageSize);
      items = result.items;
      totalItems = result.totalItems;

      // キャッシュに保存
      this.cache.set(page, items);
      this.config.totalItems = totalItems;

      // プリフェッチを実行
      this.prefetchAdjacentPages(page);
    }

    return this.createPaginationResult(items, page, totalItems);
  }

  /**
   * 次のページに移動
   */
  async nextPage(): Promise<PaginationResult<T>> {
    const nextPage = Math.min(this.config.currentPage + 1, this.getTotalPages());
    this.config.currentPage = nextPage;
    return this.getPage(nextPage);
  }

  /**
   * 前のページに移動
   */
  async previousPage(): Promise<PaginationResult<T>> {
    const prevPage = Math.max(this.config.currentPage - 1, 1);
    this.config.currentPage = prevPage;
    return this.getPage(prevPage);
  }

  /**
   * 指定ページに移動
   */
  async goToPage(page: number): Promise<PaginationResult<T>> {
    const targetPage = Math.max(1, Math.min(page, this.getTotalPages()));
    this.config.currentPage = targetPage;
    return this.getPage(targetPage);
  }

  /**
   * ページサイズを変更
   */
  async changePageSize(newPageSize: number): Promise<PaginationResult<T>> {
    // 現在の位置を維持するために新しいページを計算
    const currentItemIndex = (this.config.currentPage - 1) * this.config.pageSize;
    const newPage = Math.floor(currentItemIndex / newPageSize) + 1;

    this.config.pageSize = newPageSize;
    this.config.currentPage = newPage;
    
    // キャッシュをクリア（ページサイズが変わったため）
    this.cache.clear();

    return this.getPage(newPage);
  }

  /**
   * 隣接ページをプリフェッチ
   */
  private async prefetchAdjacentPages(currentPage: number): Promise<void> {
    const prefetchPages = this.config.prefetchPages || 1;
    const totalPages = this.getTotalPages();
    const promises: Promise<void>[] = [];

    for (let i = 1; i <= prefetchPages; i++) {
      // 前のページ
      const prevPage = currentPage - i;
      if (prevPage >= 1 && !this.cache.has(prevPage)) {
        promises.push(this.prefetchPage(prevPage));
      }

      // 次のページ
      const nextPage = currentPage + i;
      if (nextPage <= totalPages && !this.cache.has(nextPage)) {
        promises.push(this.prefetchPage(nextPage));
      }
    }

    // 並列でプリフェッチ実行
    await Promise.allSettled(promises);
  }

  /**
   * 単一ページをプリフェッチ
   */
  private async prefetchPage(page: number): Promise<void> {
    try {
      const result = await this.dataLoader(page, this.config.pageSize);
      this.cache.set(page, result.items);
    } catch (error) {
      console.warn(`Failed to prefetch page ${page}:`, error);
    }
  }

  /**
   * ページネーション結果を作成
   */
  private createPaginationResult(items: T[], page: number, totalItems: number): PaginationResult<T> {
    const totalPages = Math.ceil(totalItems / this.config.pageSize);
    const startIndex = (page - 1) * this.config.pageSize;
    const endIndex = Math.min(startIndex + this.config.pageSize - 1, totalItems - 1);

    return {
      items,
      currentPage: page,
      totalPages,
      totalItems,
      pageSize: this.config.pageSize,
      hasPrevious: page > 1,
      hasNext: page < totalPages,
      startIndex,
      endIndex
    };
  }

  /**
   * 総ページ数を取得
   */
  private getTotalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  /**
   * キャッシュをクリア
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<PaginationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 無限スクロール用のデータマネージャー
 */
export class InfiniteScrollManager<T> {
  private items: T[] = [];
  private config: InfiniteScrollConfig;
  private dataLoader: (offset: number, limit: number) => Promise<{ items: T[]; hasMore: boolean }>;
  private loading = false;
  private hasMore = true;
  private error: Error | null = null;

  constructor(
    config: InfiniteScrollConfig,
    dataLoader: (offset: number, limit: number) => Promise<{ items: T[]; hasMore: boolean }>
  ) {
    this.config = config;
    this.dataLoader = dataLoader;
  }

  /**
   * 初期データを読み込み
   */
  async loadInitial(): Promise<T[]> {
    this.items = [];
    this.hasMore = true;
    this.error = null;

    try {
      this.loading = true;
      const result = await this.dataLoader(0, this.config.initialPageSize);
      this.items = result.items;
      this.hasMore = result.hasMore;
      return this.items;
    } catch (error) {
      this.error = error as Error;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * 追加データを読み込み
   */
  async loadMore(): Promise<T[]> {
    if (this.loading || !this.hasMore) {
      return this.items;
    }

    try {
      this.loading = true;
      this.error = null;

      const result = await this.dataLoader(
        this.items.length,
        this.config.loadMorePageSize
      );

      this.items = [...this.items, ...result.items];
      this.hasMore = result.hasMore;

      // キャッシュサイズの制限
      if (this.config.maxCacheSize && this.items.length > this.config.maxCacheSize) {
        const excess = this.items.length - this.config.maxCacheSize;
        this.items = this.items.slice(excess);
      }

      return this.items;
    } catch (error) {
      this.error = error as Error;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  /**
   * プリフェッチが必要かチェック
   */
  shouldPrefetch(): boolean {
    return (
      !this.loading &&
      this.hasMore &&
      this.items.length > 0 &&
      this.items.length <= this.config.prefetchThreshold
    );
  }

  /**
   * 現在の状態を取得
   */
  getState() {
    return {
      items: this.items,
      loading: this.loading,
      hasMore: this.hasMore,
      error: this.error,
      totalLoaded: this.items.length
    };
  }

  /**
   * リセット
   */
  reset(): void {
    this.items = [];
    this.loading = false;
    this.hasMore = true;
    this.error = null;
  }

  /**
   * 設定を更新
   */
  updateConfig(newConfig: Partial<InfiniteScrollConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * 仮想化用のデータ計算ユーティリティ
 */
export class VirtualizationHelper {
  /**
   * 表示範囲を計算（固定高さ）
   */
  static calculateFixedRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan = 5
  ) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, totalItems);
    const actualStartIndex = Math.max(0, startIndex - overscan);

    return {
      startIndex: actualStartIndex,
      endIndex,
      offsetY: actualStartIndex * itemHeight,
      totalHeight: totalItems * itemHeight
    };
  }

  /**
   * 表示範囲を計算（動的高さ）
   */
  static calculateDynamicRange(
    scrollTop: number,
    containerHeight: number,
    itemHeights: number[],
    overscan = 5
  ) {
    let currentHeight = 0;
    let startIndex = 0;
    let endIndex = 0;
    let offsetY = 0;
    let foundStart = false;

    for (let i = 0; i < itemHeights.length; i++) {
      const height = itemHeights[i];

      if (!foundStart && currentHeight + height > scrollTop) {
        startIndex = Math.max(0, i - overscan);
        offsetY = itemHeights.slice(0, startIndex).reduce((sum, h) => sum + h, 0);
        foundStart = true;
      }

      if (foundStart && currentHeight > scrollTop + containerHeight) {
        endIndex = Math.min(i + overscan, itemHeights.length);
        break;
      }

      currentHeight += height;
    }

    if (!foundStart) {
      startIndex = Math.max(0, itemHeights.length - overscan);
      endIndex = itemHeights.length;
    }

    return {
      startIndex,
      endIndex,
      offsetY,
      totalHeight: currentHeight
    };
  }

  /**
   * スクロール位置からアイテムインデックスを取得
   */
  static getItemIndexFromScroll(
    scrollTop: number,
    itemHeight: number | number[]
  ): number {
    if (typeof itemHeight === 'number') {
      return Math.floor(scrollTop / itemHeight);
    } else {
      let currentHeight = 0;
      for (let i = 0; i < itemHeight.length; i++) {
        currentHeight += itemHeight[i];
        if (currentHeight > scrollTop) {
          return i;
        }
      }
      return itemHeight.length - 1;
    }
  }
}

/**
 * ページネーション用のヘルパー関数
 */
export function createPagination<T>(
  config: PaginationConfig,
  dataLoader: (page: number, pageSize: number) => Promise<{ items: T[]; totalItems: number }>
): DataPager<T> {
  return new DataPager(config, dataLoader);
}

/**
 * 無限スクロール用のヘルパー関数
 */
export function createInfiniteScroll<T>(
  config: InfiniteScrollConfig,
  dataLoader: (offset: number, limit: number) => Promise<{ items: T[]; hasMore: boolean }>
): InfiniteScrollManager<T> {
  return new InfiniteScrollManager(config, dataLoader);
}