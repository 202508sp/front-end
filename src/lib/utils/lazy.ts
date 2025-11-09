/**
 * 遅延読み込みユーティリティ
 * コンポーネントとモジュールの動的インポートを管理
 */

import type { Component } from 'svelte';

/**
 * 遅延読み込み可能なコンポーネントの型定義
 */
export interface LazyComponent<T = any> {
  component: Component;
  loading: boolean;
  error: Error | null;
  props?: T;
}

/**
 * 遅延読み込み状態の管理
 */
export class LazyLoader {
  private cache = new Map<string, Promise<any>>();
  private loadingStates = new Map<string, boolean>();
  private errors = new Map<string, Error>();

  /**
   * コンポーネントを遅延読み込み
   */
  async loadComponent<T = any>(
    importFn: () => Promise<any>,
    key: string
  ): Promise<Component> {
    // キャッシュから取得
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // 読み込み状態を設定
    this.loadingStates.set(key, true);
    this.errors.delete(key);

    try {
      const promise = importFn().then(module => {
        this.loadingStates.set(key, false);
        return module.default;
      });

      // キャッシュに保存
      this.cache.set(key, promise);
      
      return await promise;
    } catch (error) {
      this.loadingStates.set(key, false);
      this.errors.set(key, error as Error);
      throw error;
    }
  }

  /**
   * モジュールを遅延読み込み
   */
  async loadModule<T = any>(
    importFn: () => Promise<T>,
    key: string
  ): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    this.loadingStates.set(key, true);
    this.errors.delete(key);

    try {
      const promise = importFn().then(module => {
        this.loadingStates.set(key, false);
        return module;
      });

      this.cache.set(key, promise);
      return await promise;
    } catch (error) {
      this.loadingStates.set(key, false);
      this.errors.set(key, error as Error);
      throw error;
    }
  }

  /**
   * 読み込み状態を取得
   */
  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  /**
   * エラー状態を取得
   */
  getError(key: string): Error | null {
    return this.errors.get(key) || null;
  }

  /**
   * キャッシュをクリア
   */
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.loadingStates.delete(key);
      this.errors.delete(key);
    } else {
      this.cache.clear();
      this.loadingStates.clear();
      this.errors.clear();
    }
  }

  /**
   * プリロード（事前読み込み）
   */
  async preload(importFn: () => Promise<any>, key: string): Promise<void> {
    if (!this.cache.has(key)) {
      try {
        await this.loadModule(importFn, key);
      } catch (error) {
        // プリロードのエラーは無視（実際の使用時に再試行）
        console.warn(`Preload failed for ${key}:`, error);
      }
    }
  }
}

// グローバルインスタンス
export const lazyLoader = new LazyLoader();

/**
 * 遅延読み込み用のヘルパー関数
 */
export function lazy<T = any>(
  importFn: () => Promise<any>,
  key?: string
): () => Promise<Component> {
  const cacheKey = key || importFn.toString();
  
  return () => lazyLoader.loadComponent(importFn, cacheKey);
}

/**
 * ルート遅延読み込み用のヘルパー
 */
export function lazyRoute(routePath: string) {
  return lazy(() => import(`../../routes${routePath}/+page.svelte`), `route:${routePath}`);
}

/**
 * コンポーネント遅延読み込み用のヘルパー
 */
export function lazyComponent(componentPath: string) {
  return lazy(() => import(`../components/${componentPath}.svelte`), `component:${componentPath}`);
}

/**
 * 条件付き遅延読み込み
 */
export async function lazyIf<T>(
  condition: boolean,
  importFn: () => Promise<T>,
  key: string
): Promise<T | null> {
  if (!condition) {
    return null;
  }
  
  return lazyLoader.loadModule(importFn, key);
}

/**
 * 複数の遅延読み込みを並列実行
 */
export async function lazyAll<T extends Record<string, () => Promise<any>>>(
  imports: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(imports);
  const promises = entries.map(([key, importFn]) => 
    lazyLoader.loadModule(importFn, key).then(result => [key, result])
  );
  
  const results = await Promise.all(promises);
  return Object.fromEntries(results) as any;
}