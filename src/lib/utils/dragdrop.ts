/**
 * ドラッグ&ドロップユーティリティ
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

/**
 * ドラッグ可能な要素を設定
 */
export function makeDraggable(
  element: HTMLElement,
  data: DragData,
  options: {
    dragImage?: HTMLElement;
    onDragStart?: (event: DragEvent) => void;
    onDragEnd?: (event: DragEvent) => void;
  } = {}
): () => void {
  element.draggable = true;
  
  const handleDragStart = (event: DragEvent) => {
    if (!event.dataTransfer) return;
    
    // ドラッグデータを設定
    event.dataTransfer.setData('application/json', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
    
    // カスタムドラッグイメージを設定
    if (options.dragImage) {
      event.dataTransfer.setDragImage(options.dragImage, 0, 0);
    }
    
    // ドラッグ開始時のスタイル
    element.classList.add('dragging');
    
    options.onDragStart?.(event);
  };
  
  const handleDragEnd = (event: DragEvent) => {
    element.classList.remove('dragging');
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
  };
}

/**
 * ドロップゾーンを設定
 */
export function makeDropZone(
  element: HTMLElement,
  zone: DropZone
): () => void {
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    
    if (!event.dataTransfer) return;
    
    try {
      const dragData: DragData = JSON.parse(
        event.dataTransfer.getData('application/json')
      );
      
      // 受け入れ可能なタイプかチェック
      if (zone.accepts.includes(dragData.type)) {
        event.dataTransfer.dropEffect = 'move';
        element.classList.add('drag-over');
        zone.onDragOver?.(dragData);
      } else {
        event.dataTransfer.dropEffect = 'none';
      }
    } catch (error) {
      event.dataTransfer.dropEffect = 'none';
    }
  };
  
  const handleDragLeave = (event: DragEvent) => {
    // 子要素への移動でない場合のみ処理
    if (!element.contains(event.relatedTarget as Node)) {
      element.classList.remove('drag-over');
      zone.onDragLeave?.();
    }
  };
  
  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    element.classList.remove('drag-over');
    
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
  
  element.addEventListener('dragover', handleDragOver);
  element.addEventListener('dragleave', handleDragLeave);
  element.addEventListener('drop', handleDrop);
  
  // クリーンアップ関数を返す
  return () => {
    element.removeEventListener('dragover', handleDragOver);
    element.removeEventListener('dragleave', handleDragLeave);
    element.removeEventListener('drop', handleDrop);
    element.classList.remove('drag-over');
  };
}

/**
 * タッチデバイス用のドラッグ&ドロップ
 */
export function makeTouchDraggable(
  element: HTMLElement,
  data: DragData,
  options: {
    onDragStart?: (position: Position) => void;
    onDragMove?: (position: Position) => void;
    onDragEnd?: (position: Position) => void;
  } = {}
): () => void {
  let isDragging = false;
  let startPosition: Position = { x: 0, y: 0 };
  let currentPosition: Position = { x: 0, y: 0 };
  
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    isDragging = true;
    const touch = event.touches[0];
    startPosition = { x: touch.clientX, y: touch.clientY };
    currentPosition = { ...startPosition };
    
    element.classList.add('touch-dragging');
    options.onDragStart?.(startPosition);
    
    // スクロールを防ぐ
    event.preventDefault();
  };
  
  const handleTouchMove = (event: TouchEvent) => {
    if (!isDragging || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    currentPosition = { x: touch.clientX, y: touch.clientY };
    
    options.onDragMove?.(currentPosition);
    
    event.preventDefault();
  };
  
  const handleTouchEnd = (event: TouchEvent) => {
    if (!isDragging) return;
    
    isDragging = false;
    element.classList.remove('touch-dragging');
    
    // ドロップ先の要素を取得
    const elementBelow = document.elementFromPoint(
      currentPosition.x,
      currentPosition.y
    );
    
    if (elementBelow) {
      // カスタムイベントを発火してドロップを通知
      const dropEvent = new CustomEvent('touchdrop', {
        detail: { data, position: currentPosition }
      });
      elementBelow.dispatchEvent(dropEvent);
    }
    
    options.onDragEnd?.(currentPosition);
  };
  
  element.addEventListener('touchstart', handleTouchStart, { passive: false });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd);
  
  // クリーンアップ関数を返す
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
    element.classList.remove('touch-dragging');
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