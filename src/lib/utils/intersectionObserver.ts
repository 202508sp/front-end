/**
 * Intersection Observer ユーティリティ
 * 要素の可視性に基づく遅延読み込みを実装
 */

/**
 * Intersection Observer のオプション
 */
export interface IntersectionOptions {
  /** ルート要素（デフォルト: viewport） */
  root?: Element | null;
  /** ルートマージン */
  rootMargin?: string;
  /** 閾値 */
  threshold?: number | number[];
  /** 一度だけ実行するか */
  once?: boolean;
}

/**
 * 可視性コールバック関数の型
 */
export type VisibilityCallback = (entry: IntersectionObserverEntry) => void;

/**
 * Intersection Observer マネージャー
 */
export class IntersectionManager {
  private observers = new Map<string, IntersectionObserver>();
  private callbacks = new Map<Element, VisibilityCallback>();
  private onceElements = new Set<Element>();

  /**
   * 要素の可視性を監視
   */
  observe(
    element: Element,
    callback: VisibilityCallback,
    options: IntersectionOptions = {}
  ): () => void {
    const {
      root = null,
      rootMargin = '50px',
      threshold = 0.1,
      once = false
    } = options;

    // オプションからキーを生成
    const key = this.generateKey(root, rootMargin, threshold);

    // 既存のオブザーバーを取得または作成
    let observer = this.observers.get(key);
    if (!observer) {
      observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { root, rootMargin, threshold }
      );
      this.observers.set(key, observer);
    }

    // コールバックを登録
    this.callbacks.set(element, callback);
    if (once) {
      this.onceElements.add(element);
    }

    // 要素を監視開始
    observer.observe(element);

    // 監視停止用の関数を返す
    return () => this.unobserve(element);
  }

  /**
   * 要素の監視を停止
   */
  unobserve(element: Element): void {
    // 全てのオブザーバーから要素を削除
    this.observers.forEach(observer => {
      observer.unobserve(element);
    });

    // コールバックとフラグを削除
    this.callbacks.delete(element);
    this.onceElements.delete(element);
  }

  /**
   * 全ての監視を停止
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.callbacks.clear();
    this.onceElements.clear();
  }

  /**
   * Intersection の処理
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      const callback = this.callbacks.get(entry.target);
      if (callback) {
        callback(entry);

        // 一度だけ実行する場合は監視を停止
        if (this.onceElements.has(entry.target) && entry.isIntersecting) {
          this.unobserve(entry.target);
        }
      }
    });
  }

  /**
   * オブザーバーキーを生成
   */
  private generateKey(
    root: Element | null,
    rootMargin: string,
    threshold: number | number[]
  ): string {
    const rootId = root ? root.id || 'element' : 'viewport';
    const thresholdStr = Array.isArray(threshold) ? threshold.join(',') : threshold.toString();
    return `${rootId}-${rootMargin}-${thresholdStr}`;
  }
}

// グローバルインスタンス
export const intersectionManager = new IntersectionManager();

/**
 * 遅延読み込み用のヘルパー関数
 */
export function lazyLoad(
  element: Element,
  callback: () => void | Promise<void>,
  options: IntersectionOptions = {}
): () => void {
  return intersectionManager.observe(
    element,
    async (entry) => {
      if (entry.isIntersecting) {
        try {
          await callback();
        } catch (error) {
          console.error('Lazy load callback failed:', error);
        }
      }
    },
    { once: true, ...options }
  );
}

/**
 * 画像の遅延読み込み
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options: IntersectionOptions = {}
): () => void {
  return lazyLoad(
    img,
    () => {
      img.src = src;
      img.classList.add('loaded');
    },
    options
  );
}

/**
 * コンポーネントの遅延読み込み
 */
export function lazyLoadComponent(
  element: Element,
  loader: () => Promise<any>,
  options: IntersectionOptions = {}
): () => void {
  return lazyLoad(element, loader, options);
}

/**
 * Svelte アクション: 遅延読み込み
 */
export function lazyAction(
  element: Element,
  params: {
    callback: () => void | Promise<void>;
    options?: IntersectionOptions;
  }
) {
  const { callback, options = {} } = params;
  
  const unobserve = lazyLoad(element, callback, options);

  return {
    destroy: unobserve
  };
}

/**
 * Svelte アクション: 画像遅延読み込み
 */
export function lazyImageAction(
  element: HTMLImageElement,
  src: string
) {
  // プレースホルダー画像を設定
  const placeholder = element.dataset.placeholder || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5sb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==';
  
  if (!element.src) {
    element.src = placeholder;
  }

  const unobserve = lazyLoadImage(element, src, {
    rootMargin: '100px',
    threshold: 0.1
  });

  return {
    update(newSrc: string) {
      if (newSrc !== src) {
        unobserve();
        lazyLoadImage(element, newSrc);
      }
    },
    destroy: unobserve
  };
}

/**
 * プリロード用のヘルパー
 */
export function preloadOnHover(
  element: Element,
  preloader: () => Promise<any>
): () => void {
  let isPreloaded = false;

  const handleMouseEnter = async () => {
    if (!isPreloaded) {
      isPreloaded = true;
      try {
        await preloader();
      } catch (error) {
        console.warn('Preload on hover failed:', error);
        isPreloaded = false; // 失敗時は再試行可能にする
      }
    }
  };

  element.addEventListener('mouseenter', handleMouseEnter, { once: true });

  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
  };
}

/**
 * アイドル時間での遅延読み込み
 */
export function lazyLoadOnIdle(
  callback: () => void | Promise<void>,
  timeout = 2000
): () => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  let isExecuted = false;

  const execute = async () => {
    if (isExecuted) return;
    isExecuted = true;
    
    try {
      await callback();
    } catch (error) {
      console.error('Idle lazy load failed:', error);
    }
  };

  // requestIdleCallback が利用可能な場合
  if ('requestIdleCallback' in window) {
    const idleId = requestIdleCallback(execute, { timeout });
    
    return () => {
      if (!isExecuted) {
        cancelIdleCallback(idleId);
      }
    };
  } else {
    // フォールバック: setTimeout を使用
    timeoutId = setTimeout(execute, timeout);
    
    return () => {
      if (!isExecuted) {
        clearTimeout(timeoutId);
      }
    };
  }
}