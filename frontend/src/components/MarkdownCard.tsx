import { useEffect, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import { Rnd } from "react-rnd";
import React from 'react';

interface MarkdownCardProps {
  id: string;
  initialContent?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export function MarkdownCard({ 
  id, 
  initialContent = " ", 
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 400, height: 300 }
}: MarkdownCardProps) {
  const [vd, setVd] = useState<Vditor>();
  const [size, setSize] = useState(initialSize);

  useEffect(() => {
    if (vd) {
      vd.destroy();
    }
    
    const vditor = new Vditor(id, {
      after: () => {
        vditor.setValue(initialContent);
        setVd(vditor);
      },
      height: size.height - 30, 
      width: size.width,
      mode: 'ir',
      toolbar: [], 
      toolbarConfig: {
        hide: true, 
      },
    });

    return () => {
      vditor.destroy();
    };
  }, [id, size]); // 依赖项添加 size

  return (
    <Rnd
      default={{
        x: initialPosition.x,
        y: initialPosition.y,
        width: initialSize.width,
        height: initialSize.height
      }}
      minWidth={200}
      minHeight={200}
      dragHandleClassName="drag-handle"
      onResize={(e, direction, ref) => {
        setSize({
          width: ref.offsetWidth,
          height: ref.offsetHeight,
        });
      }}
      className="bg-white rounded-lg shadow-lg"
    >
      <div className="h-full flex flex-col">
        <div className="drag-handle h-6 bg-gray-100 rounded-t-lg cursor-move flex items-center justify-center">
          ⋮⋮
        </div>
        <div id={id} className="vditor flex-1" />
      </div>
    </Rnd>
  );
}