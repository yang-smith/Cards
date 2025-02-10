import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext, 
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useCardStore } from '@/stores/cardStore';
import { AtomicCard } from '../cards/AtomicCard';
import { ChatCard } from '../cards/ChatCard';
import { MarkdownCard } from '../cards/MarkdownCard';
import { RelationshipGraph } from '../graph/RelationshipGraph';
import { CardList } from '../cards/CardList';
import { cn } from '@/lib/utils';

export function Canvas() {
  const { uicards, updateCard, removeCard } = useCardStore();
  const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // 使用 ref 避免不必要的重渲染
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0
  });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const id = active.id as string;
    const card = uicards[id];
    
    if (card) {
      const newPosition = {
        x: (card.position?.x || 0) + delta.x,
        y: (card.position?.y || 0) + delta.y,
      };
      updateCard(id, { position: newPosition });
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // 更精确的判断：确保点击的是画布背景，而不是其他元素
    if (!target.closest('.draggable-container') && 
        target.classList.contains('canvas-background') && 
        e.button === 0) {
      
      dragStateRef.current = {
        isDragging: true,
        startX: e.clientX - canvasPosition.x,
        startY: e.clientY - canvasPosition.y
      };
      
      setIsDragging(true);
      setDragStart({
        x: e.clientX - canvasPosition.x,
        y: e.clientY - canvasPosition.y
      });
    }
  }, [canvasPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragStateRef.current.isDragging) {
      // 使用 ref 中的状态，避免闭包问题
      setCanvasPosition({
        x: e.clientX - dragStateRef.current.startX,
        y: e.clientY - dragStateRef.current.startY
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    setIsDragging(false);
  }, []);

  // 使用事件委托，减少事件监听器数量
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseUp]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    setCanvasPosition(prev => ({
      x: prev.x - e.deltaX,
      y: prev.y - e.deltaY
    }));
  }, []);

  const handleResize = (id: string, size: { width: number; height: number }) => {
    updateCard(id, { size });
  };

  return (
    <div 
      className="w-screen h-screen overflow-hidden bg-slate-100"
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
      >
        <div 
          className={cn(
            "w-[5000px] h-[5000px] relative bg-slate-50 canvas-background",
            isDragging && "dragging"
          )}
          style={{
            transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)`,
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {Object.values(uicards).map((card) => {
            const commonProps = {
              id: card.id,
              initialPosition: card.position,
              initialSize: card.size,
              onResize: (size: { width: number; height: number }) => handleResize(card.id, size)
            };

            switch (card.type) {
              case 'atomic':
                return (
                  <AtomicCard
                    key={card.id}
                    {...commonProps}
                    initialContent={card.content}
                    initialContext={card.context}
                  />
                );
              case 'cardList':
                return (
                  <CardList
                    key={card.id}
                    {...commonProps}
                    inputCards={card.cards || []}
                    onClose={() => removeCard(card.id)}
                  />
                );
              case 'chat':
                return (
                  <ChatCard
                    key={card.id}
                    {...commonProps}
                  />
                );
              case 'markdown':
                return (
                  <MarkdownCard
                    key={card.id}
                    {...commonProps}
                    initialContent={card.content}
                  />
                );
              case 'graph':
                return (
                  <RelationshipGraph
                    key={card.id}
                    {...commonProps}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      </DndContext>
    </div>
  );
}