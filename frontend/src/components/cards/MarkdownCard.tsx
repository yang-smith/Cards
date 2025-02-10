import { useEffect, useRef, useState } from "react";
import Vditor from "vditor";
import "vditor/dist/index.css";
import { DraggableContainer } from '../containers/DraggableContainer';
import { useCardStore } from '../../stores/cardStore';
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { atomizeContent } from "@/api/chat";
import { generateCardId, Card } from "@/api/cards";

interface MarkdownCardProps {
  id: string;
  initialContent?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}


export function MarkdownCard({ 
  id, 
  initialContent = "", 
  initialPosition = { x: 0, y: 0 },
  initialSize = { width: 400, height: 300 }
}: MarkdownCardProps) {
  const { addCard, updateCard } = useCardStore();
  const vditorRef = useRef<Vditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAtomizing, setIsAtomizing] = useState(false);

  useEffect(() => {
    addCard({
      id,
      type: 'markdown',
      content: initialContent,
      position: initialPosition,
      size: initialSize
    });
  }, []);

  useEffect(() => {
    const vditor = new Vditor(id, {
      after: () => {
        vditor.setValue(initialContent);
        vditorRef.current = vditor; 
      },
      input: (value) => {
        updateCard(id, { content: value });
      },
      height: 'auto',
      mode: 'ir',
      toolbar: [],
      theme: 'classic',
    });

    return () => {
      vditor.destroy();
    };
  }, [id]);

  const handleAtomize = async () => {
    try {
      setIsAtomizing(true);
      const content = vditorRef.current?.getValue() || '';
      const response = await atomizeContent(content);
      
      // Parse response into separate cards
      const cardContents = response.match(/<content>([\s\S]*?)<\/content>/g)
        ?.map(match => match.replace(/<\/?content>/g, '').trim()) || [];

        const cards: Card[] = cardContents.map((content, index) => ({
          id: generateCardId(index),
          content,
          context: '',
          links: {}
        }));


        addCard({
          id: generateCardId(),
          type: 'cardList',
          position: {
            x: initialPosition.x + initialSize.width + 100,
            y: initialPosition.y
          },
          size: { width: 400, height: 600 },
          cards: cards
        });


    } catch (error) {
      console.error('Failed to atomize content:', error);
    } finally {
      setIsAtomizing(false);
    }
  };

  return (
    <DraggableContainer
      id={id}
      title="Markdown"
      initialPosition={initialPosition}
      initialSize={initialSize}
      type="markdown"
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-end p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAtomize}
            disabled={isAtomizing}
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isAtomizing ? 'Atomizing...' : 'Atomize'}
          </Button>
        </div>
        <div id={id} className="vditor flex-1" />
      </div>
    </DraggableContainer>
  );
}