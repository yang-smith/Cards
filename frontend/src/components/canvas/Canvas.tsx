import React, { useRef } from 'react';
import Draggable from 'react-draggable';
import { MarkdownCard } from '../MarkdownCard.tsx';

export function Canvas() {
  const nodeRef = useRef(null);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-50">
      <Draggable 
        nodeRef={nodeRef}
        cancel=".markdown-card"
      >
        <div 
          ref={nodeRef}
          className="w-[5000px] h-[5000px] relative cursor-grab active:cursor-grabbing"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.8,
          }}
        >
          <div className="markdown-card">
            <MarkdownCard 
              id="editor-1"
              initialContent="# Hello World"
              initialPosition={{ x: 100, y: 100 }}
            />
          </div>
        </div>
      </Draggable>
    </div>
  );
}