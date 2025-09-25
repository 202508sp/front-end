/**
 * ドラッグ&ドロップユーティリティ
 * HTML5 Drag and Drop API とタッチデバイス対応のラッパー関数を提供
 */

import type { Position } from '../types/dashboard.js';

export interface DragData {
  id: string;
  type: string;
  data: any;
}

export interface DropZone {
  id: string;
  element: HTMLElement;
  accepts: string[];
  onDrop: (data: DragData, position: Position) => void;
  onDragOver?: (data: DragData) => void;
  onDragLeave?: () => void;
}

export interface DragOptions {
  dragImage?: HTMLElement;
  dragImageOffset?: Position;
  ghostOpacity?: number;
  onDragStart?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
}

export interface TouchDragOptions {
  threshold?: number; // ドラッグ開始の閾値（ピクセル）
  ghostElement?: boolean; // ゴースト要素を表示するか
  onDragStart?: (position: Position) => void;
  onDragMove?: (position: Position) => void;
  onDragEnd?: (position: Position) => void;
}

export interface VisualFeedbackOptions {
  dragOverClass?: string;
  dragActiveClass?: string;
  dropValidClass?: string;
  dropInvalidClass?: string;
}

/**
 * ドラッグ可能な要素を設定
 * HTML5 Drag and Drop APIのラッパー関数
 */
export function makeDraggable(
  element: HTMLElement,
  data: DragData,
  options: DragOptions = {}
): () => void {
  element.draggable = true;
  
  const handleDragStart = (event: DragEvent) => {
    if (!event.dataTransfer) return;
    
    // ドラッグデータを設定
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
    
    // カスタムドラッグイメージを設定
    if (options.dragImage) {
      const offset = options.dragImageOffset || { x: 0, y: 0 };
      event.dataTransfer.setDragImage(options.dragImage, offset.x, offset.y);
    }
    
    // ドラッグ開始時のスタイル
    element.classList.add('dragging');
    
    // ゴーストの透明度を設定
    if (options.ghostOpacity !== undefined) {
      element.style.opacity = options.ghostOpacity.toString();
    }
    
    // ドラッグ中であることを示すグローバル状態を設定
    document.body.classList.add('drag-active');
    document.body.setAttribute('data-drag-type', data.type);
    
    options.onDragStart?.(event);
  };
  
  const handleDragEnd = (event: DragEvent) => {
    element.classList.remove('dragging');
    element.style.opacity = '';
    
    // グローバル状態をクリア
    document.body.classList.remove('drag-active');
    document.body.removeAttribute('data-drag-type');
    
    options.onDragEnd?.(event);
  };
  
  element.addEventListener('dragstart', handleDragStart);
  element.addEventListener('dragend', handleDragEnd);
  
  // クリーンアップ関数を返す
  return () => {
    element.draggable = false;
    element.removeEventListener('dragstart', handleDragStart);
    element.removeEventListener('dragend', handleDragEnd);
    element.classList.remove('dragging');
    element.style.opacity = '';
  };
}

/**
 * ドロップゾーンを設定
 * 視覚的フィードバック機能付き
 */
export function makeDropZone(
  element: HTMLElement,
  zone: DropZone,
  visualOptions: VisualFeedbackOptions = {}
): () => void {
  const {
    dragOverClass = 'drag-over',
    dragActiveClass = 'drag-active',
    dropValidClass = 'drop-valid',
    dropInvalidClass = 'drop-invalid'
  } = visualOptions;

  let dragCounter = 0; // ネストした要素での dragenter/dragleave の問題を解決

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    dragCounter++;
    
    if (dragCounter === 1) {
      element.classList.add(dragActiveClass);
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    
    if (!event.dataTransfer) return;
    
    // ドラッグ中のデータタイプを body 属性から取得
    const dragType = document.body.getAttribute('data-drag-type');
    
    if (dragType && zone.accepts.includes(dragType)) {
      event.dataTransfer.dropEffect = 'move';
      element.classList.add(dragOverClass);
      element.classList.add(dropValidClass);
      element.classList.remove(dropInvalidClass);
      
      // データが利用可能な場合はコールバックを呼び出し
      try {
        const dragData: DragData = JSON.parse(
          event.dataTransfer.getData('application/json') || '{}'
        );
        if (dragData.type) {
          zone.onDragOver?.(dragData);
        }
      } catch {
        // データが取得できない場合は無視
      }
    } else {
      event.dataTransfer.dropEffect = 'none';
      element.classList.add(dropInvalidClass);
      element.classList.remove(dropValidClass);
    }
  };
  
  const handleDragLeave = (event: DragEvent) => {
    dragCounter--;
    
    if (dragCounter === 0) {
      element.classList.remove(dragActiveClass);
      element.classList.remove(dragOverClass);
      element.classList.remove(dropValidClass);
      element.classList.remove(dropInvalidClass);
      zone.onDragLeave?.();
    }
  };
  
  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    dragCounter = 0;
    
    // すべてのドラッグ関連クラスを削除
    element.classList.remove(dragActiveClass);
    element.classList.remove(dragOverClass);
    element.classList.remove(dropValidClass);
    element.classList.remove(dropInvalidClass);
    
    if (!event.dataTransfer) return;
    
    try {
      const dragData: DragData = JSON.parse(
        event.dataTransfer.getData('application/json')
      );
      
      if (zone.accepts.includes(dragData.type)) {
        const rect = element.getBoundingClientRect();
        const position: Position = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        
        zone.onDrop(dragData, position);
      }
    } catch (error) {
      console.error('ドロップデータの解析に失敗しました:', error);
    }
  };
  
  element.addEventListener('dragenter', handleDragEnter);
  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', handleDrop);
  
  // クリーンアップ関数を返す
  return () => {
    element.removeEventListener('dragenter', handleDragEnter);
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('drop', handleDrop);
    element.classList.remove(dragActiveClass);
    element.classList.remove(dragOverClass);
    element.classList.remove(dropValidClass);
    element.classList.remove(dropInvalidClass);
  };
}

/**
 * タッチデバイス用のドラッグ&ドロップ
 * 改良されたタッチ対応とゴースト要素サポート
 */
export function makeTouchDraggable(
  element: HTMLElement,
  data: DragData,
  options: TouchDragOptions = {}
): () => void {
  const {
    threshold = 10,
    ghostElement = true,
    onDragStart,
    onDragMove,
    onDragEnd
  } = options;

  let isDragging = false;
  let hasMoved = false;
  let startPosition: Position = { x: 0, y: 0 };
  let currentPosition: Position = { x: 0, y: 0 };
  let ghostEl: HTMLElement | null = null;
  
  const createGhostElement = (): HTMLElement => {
    const ghost = element.cloneNode(true) as HTMLElement;
    ghost.style.position = 'fixed';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.opacity = '0.8';
    ghost.style.transform = 'rotate(5deg)';
    ghost.style.transition = 'none';
    ghost.classList.add('drag-ghost');
    document.body.appendChild(ghost);
    return ghost;
  };

  const updateGhostPosition = (position: Position) => {
    if (ghostEl) {
      const rect = element.getBoundingClientRect();
      ghostEl.style.left = `${position.x - rect.width / 2}px`;
      ghostEl.style.top = `${position.y - rect.height / 2}px`;
    }
  };

  const removeGhostElement = () => {
    if (ghostEl) {
      document.body.removeChild(ghostEl);
      ghostEl = null;
    }
  };
  
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    startPosition = { x: touch.clientX, y: touch.clientY };
    currentPosition = { ...startPosition };
    hasMoved = false;
    
    // 長押しでドラッグ開始の準備
    const longPressTimer = setTimeout(() => {
      if (!hasMoved) {
        isDragging = true;
        element.classList.add('touch-dragging');
        document.body.classList.add('touch-drag-active');
        document.body.setAttribute('data-drag-type', data.type);
        
        if (ghostElement) {
          ghostEl = createGhostElement();
          updateGhostPosition(currentPosition);
        }
        
        onDragStart?.(startPosition);
        
        // 触覚フィードバック（対応デバイスのみ）
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }, 200);

    // タッチ終了時にタイマーをクリア
    const clearTimer = () => {
      clearTimeout(longPressTimer);
      element.removeEventListener('touchend', clearTimer);
      element.removeEventListener('touchcancel', clearTimer);
    };
    
    element.addEventListener('touchend', clearTimer);
    element.addEventListener('touchcancel', clearTimer);
  };
  
  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const newPosition = { x: touch.clientX, y: touch.clientY };
    
    // 移動距離を計算
    const distance = calculateDistance(startPosition, newPosition);
    
    if (distance > threshold) {
      hasMoved = true;
    }
    
    if (isDragging) {
      currentPosition = newPosition;
      updateGhostPosition(currentPosition);
      
      // ドロップゾーンのハイライト
      const elementBelow = document.elementFromPoint(
        currentPosition.x,
        currentPosition.y
      );
      
      // 前回のハイライトをクリア
      document.querySelectorAll('.touch-drag-over').forEach(el => {
        el.classList.remove('touch-drag-over');
      });
      
      // 新しいハイライトを追加
      if (elementBelow && elementBelow !== ghostEl) {
        const dropZone = elementBelow.closest('[data-drop-zone]');
        if (dropZone) {
          dropZone.classList.add('touch-drag-over');
        }
      }
      
      onDragMove?.(currentPosition);
      
      // スクロールを防ぐ
      event.preventDefault();
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    isDragging = false;
    hasMoved = false;
    element.classList.remove('touch-dragging');
    document.body.classList.remove('touch-drag-active');
    document.body.removeAttribute('data-drag-type');
    
    // ハイライトをクリア
    document.querySelectorAll('.touch-drag-over').forEach(el => {
      el.classList.remove('touch-drag-over');
    });
    
    removeGhostElement();
    
    // ドロップ先の要素を取得
    const elementBelow = document.elementFromPoint(
      currentPosition.x,
      currentPosition.y
    );
    
    if (elementBelow) {
      // カスタムイベントを発火してドロップを通知
      const dropEvent = new CustomEvent('touchdrop', {
        detail: { 
          data, 
          position: currentPosition,
          target: elementBelow
        }
      });
      elementBelow.dispatchEvent(dropEvent);
    }
    
    onDragEnd?.(currentPosition);
  };

  const handleTouchCancel = () => {
    if (isDragging) {
      isDragging = false;
      hasMoved = false;
      element.classList.remove('touch-dragging');
      document.body.classList.remove('touch-drag-active');
      document.body.removeAttribute('data-drag-type');
      
      document.querySelectorAll('.touch-drag-over').forEach(el => {
        el.classList.remove('touch-drag-over');
      });
      
      removeGhostElement();
      onDragEnd?.(currentPosition);
    }
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchcancel', handleTouchCancel);
  
  // クリーンアップ関数を返す
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchcancel', handleTouchCancel);
    element.classList.remove('touch-dragging');
    removeGhostElement();
  };
}

/**
 * グリッド位置を計算
 */
export function calculateGridPosition(
  position: Position,
  gridSize: { width: number; height: number },
  containerRect: DOMRect
): Position {
  const relativeX = position.x - containerRect.left;
  const relativeY = position.y - containerRect.top;
  
  const gridX = Math.floor(relativeX / gridSize.width);
  const gridY = Math.floor(relativeY / gridSize.height);
  
  return { x: gridX, y: gridY };
}

/**
 * グリッド位置をピクセル位置に変換
 */
export function gridToPixelPosition(
  gridPosition: Position,
  gridSize: { width: number; height: number }
): Position {
  return {
    x: gridPosition.x * gridSize.width,
    y: gridPosition.y * gridSize.height
  };
}

/**
 * 要素の中心位置を取得
 */
export function getElementCenter(element: HTMLElement): Position {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

/**
 * 2点間の距離を計算
 */
export function calculateDistance(point1: Position, point2: Position): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 最も近いドロップゾーンを見つける
 */
export function findNearestDropZone(
  position: Position,
  dropZones: (DropZone & { position: Position })[]
): DropZone | null {
  let nearest: DropZone | null = null;
  let minDistance = Infinity;
  
  for (const zone of dropZones) {
    const distance = calculateDistance(position, zone.position);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = zone;
    }
  }
  
  return nearest;
}

/**
 * タッチドロップゾーンを設定
 * タッチデバイス専用のドロップゾーン
 */
export function makeTouchDropZone(
  element: HTMLElement,
  zone: DropZone,
  visualOptions: VisualFeedbackOptions = {}
): () => void {
  const {
    dragActiveClass = 'touch-drag-active',
    dropValidClass = 'touch-drop-valid',
    dropInvalidClass = 'touch-drop-invalid'
  } = visualOptions;

  // data-drop-zone 属性を設定
  element.setAttribute('data-drop-zone', zone.id);

  const handleTouchDrop = (event: CustomEvent) => {
    const { data, position } = event.detail;
    
    if (zone.accepts.includes(data.type)) {
      element.classList.add(dropValidClass);
      element.classList.remove(dropInvalidClass);
      
      const rect = element.getBoundingClientRect();
      const relativePosition: Position = {
        x: position.x - rect.left,
        y: position.y - rect.top
      };
      
      zone.onDrop(data, relativePosition);
    } else {
      element.classList.add(dropInvalidClass);
      element.classList.remove(dropValidClass);
    }
    
    // フィードバッククラスを一定時間後に削除
    setTimeout(() => {
      element.classList.remove(dropValidClass);
      element.classList.remove(dropInvalidClass);
    }, 300);
  };

  element.addEventListener('touchdrop', handleTouchDrop as EventListener);

  return () => {
    element.removeEventListener('touchdrop', handleTouchDrop as EventListener);
    element.removeAttribute('data-drop-zone');
    element.classList.remove(dragActiveClass);
    element.classList.remove(dropValidClass);
    element.classList.remove(dropInvalidClass);
  };
}

/**
 * 統合ドラッグ&ドロップ設定
 * HTML5とタッチの両方に対応
 */
export function makeUniversalDraggable(
  element: HTMLElement,
  data: DragData,
  options: {
    dragOptions?: DragOptions;
    touchOptions?: TouchDragOptions;
  } = {}
): () => void {
  const cleanupFunctions: (() => void)[] = [];

  // HTML5 Drag and Drop
  cleanupFunctions.push(makeDraggable(element, data, options.dragOptions));

  // タッチドラッグ
  cleanupFunctions.push(makeTouchDraggable(element, data, options.touchOptions));

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * 統合ドロップゾーン設定
 * HTML5とタッチの両方に対応
 */
export function makeUniversalDropZone(
  element: HTMLElement,
  zone: DropZone,
  visualOptions: VisualFeedbackOptions = {}
): () => void {
  const cleanupFunctions: (() => void)[] = [];

  // HTML5 Drop Zone
  cleanupFunctions.push(makeDropZone(element, zone, visualOptions));

  // タッチ Drop Zone
  cleanupFunctions.push(makeTouchDropZone(element, zone, visualOptions));

  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
}

/**
 * ドラッグプレビュー要素を作成
 */
export function createDragPreview(
  element: HTMLElement,
  options: {
    scale?: number;
    opacity?: number;
    className?: string;
  } = {}
): HTMLElement {
  const { scale = 0.8, opacity = 0.8, className = 'drag-preview' } = options;
  
  const preview = element.cloneNode(true) as HTMLElement;
  preview.className = className;
  preview.style.transform = `scale(${scale})`;
  preview.style.opacity = opacity.toString();
  preview.style.pointerEvents = 'none';
  
  return preview;
}

/**
 * ドラッグ可能性を検出
 */
export function isDragSupported(): boolean {
  return 'draggable' in document.createElement('div');
}

/**
 * タッチサポートを検出
 */
export function isTouchSupported(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * 適切なドラッグ方式を選択
 */
export function getPreferredDragMethod(): 'html5' | 'touch' | 'both' {
  const hasTouch = isTouchSupported();
  const hasDrag = isDragSupported();
  
  if (hasTouch && hasDrag) return 'both';
  if (hasTouch) return 'touch';
  if (hasDrag) return 'html5';
  return 'html5'; // フォールバック
}