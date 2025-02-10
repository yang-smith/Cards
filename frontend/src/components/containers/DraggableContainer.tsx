import React, { useRef, useCallback } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import { cn } from '@/lib/utils';

interface DraggableContainerProps {
  id: string;
  title?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  children: React.ReactNode;
  className?: string;
  type?: string;
  onResize?: (size: { width: number; height: number }) => void;
  onClose?: () => void;
}

export function DraggableContainer({
  id,
  title,
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 400, height: 300 },
  children,
  className = "",
  type = "default",
  onResize,
  onClose
}: DraggableContainerProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id,
    data: {
      type,
      initialPosition,
      initialSize,
    },
  });

  // 使用 ref 跟踪容器状态
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理容器内的鼠标事件
  const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 如果点击的是内容区域，阻止事件冒泡
    if (!target.closest('.card-handle')) {
      e.stopPropagation();
    }
  }, []);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      style={{
        transform: CSS.Translate.toString(transform),
        position: 'absolute',
        left: initialPosition.x,
        top: initialPosition.y,
      }}
      className={`z-10 draggable-container ${className}`}
      onMouseDown={handleContainerMouseDown}
      {...attributes}
    >
      <ResizableBox
        width={initialSize.width}
        height={initialSize.height}
        minConstraints={[200, 200]}
        maxConstraints={[1000, 1000]}
        onResizeStop={(e, { size }) => onResize?.(size)}
        resizeHandles={['se']}
      >
        <Card className="w-full h-full shadow-lg bg-white/80">
          <CardHeader 
            {...listeners} 
            className="cursor-move py-2 card-handle flex justify-between items-center relative"
          >
            <div className="text-sm text-gray-500 flex-1">{title}</div>
            {onClose && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="text-gray-500 hover:text-gray-700 absolute right-2 top-1/2 -translate-y-1/2"
              >
                ×
              </button>
            )}
          </CardHeader>
          <CardContent 
            className="p-0 overflow-auto"
            style={{ 
              height: 'calc(100% - 37px)', 
              width: '100%'
            }}
          >
            {children}
          </CardContent>
        </Card>
      </ResizableBox>
    </div>
  );
}