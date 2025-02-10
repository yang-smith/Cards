import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DraggableContainer } from '../containers/DraggableContainer';
import { cn } from "@/lib/utils";
import { Card, updateCard } from '@/api/cards';
import Vditor from 'vditor';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, RefreshCw } from "lucide-react";
import { updateCard as updateCardApi, getCards } from '@/api/cards';
import { useCardStore } from '@/stores/cardStore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CardListProps {
  inputCards: Card[];
  id: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  className?: string;
  onClose?: () => void;
}

export function CardList({ 
  inputCards, 
  id,
  initialPosition,
  initialSize = { width: 400, height: 600 },
  className,
  onClose
}: CardListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<Card[]>(inputCards);
  
  // 将编辑器相关状态提升到顶层
  const [cardContexts, setCardContexts] = useState<Record<string, string>>({});
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const editorsRef = useRef<Record<string, Vditor | null>>({});

  // 将编辑器初始化逻辑移到顶层
  useEffect(() => {
    if (expandedId) {
      editorsRef.current[expandedId] = new Vditor(`expanded-editor-${expandedId}`, {
        after: () => {
          const card = cards.find(c => c.id === expandedId);
          editorsRef.current[expandedId]?.setValue(card?.content || '');
        },
        input: (value) => {
          setCards(prevCards => prevCards.map(c => 
            c.id === expandedId ? { ...c, content: value } : c
          ));
        },
        height: 'auto',
        mode: 'ir',
        toolbar: [],
        theme: 'classic',
      });

      return () => {
        editorsRef.current[expandedId]?.destroy();
        delete editorsRef.current[expandedId];
      };
    }
  }, [expandedId, cards]);

  // 渲染折叠卡片
  const renderCollapsedCard = (card: Card) => {
    const previewContent = card.content?.split('\n')[0] || 'Empty card';
    
    return (
      <motion.div
        layout
        onClick={() => handleCardClick(card.id)}
        className={cn(
          "p-3 cursor-pointer border-b border-gray-100",
          "hover:bg-gray-50 transition-colors",
          expandedId && "opacity-50"
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 truncate text-sm">
            {previewContent}
          </div>
          {(card.context || Object.keys(card.links || {}).length > 0) && (
            <div className="w-1 h-1 rounded-full bg-blue-400" />
          )}
        </div>
      </motion.div>
    );
  };

  // 渲染展开卡片
  const renderExpandedCard = (card: Card) => {
    const context = cardContexts[card.id] || card.context || '';
    const isSaving = savingStates[card.id] || false;

    const handleWeightChange = async (targetId: string, weight: number) => {

      const newLinks = { ...card.links } || {};
      
      if (weight === 0) {
        delete newLinks[targetId];
      } else {
        newLinks[targetId] = weight;
      }
      setCards(prevCards => prevCards.map(c => 
        c.id === card.id ? { ...c, links: newLinks } : c
      ));
    };

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{
          duration: 0.2
        }}
        style={{ overflow: 'hidden' }}
        className="border-b border-gray-100"
      >
        <div className="p-4">
          <div className="flex justify-end mb-2 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSave(card)}
              disabled={isSaving}
            >
              <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedId(null)}
            >
              收起
            </Button>
          </div>

          <div id={`expanded-editor-${card.id}`} className="mb-4" />
          
          <div className="space-y-2">
            <Label>Context</Label>
            <Input
              value={context}
              onChange={(e) => {
                setCardContexts(prev => ({ ...prev, [card.id]: e.target.value }));
                setCards(prevCards => prevCards.map(c => 
                  c.id === card.id ? { ...c, context: e.target.value } : c
                ));
              }}
            />
          </div>

          <Accordion type="single" collapsible className="mt-4">
            <AccordionItem value="links">
              <AccordionTrigger>Links</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {Object.entries(card.links || {}).map(([targetId, weight]) => (
                    <div key={targetId} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
                    >
                      <div className="flex-1 truncate text-sm">
                        {cards.find(c => c.id === targetId)?.content?.substring(0, 30)}...
                      </div>
                      <Select
                        value={String(weight)}
                        onValueChange={(value) => handleWeightChange(targetId, parseFloat(value))}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">删除</SelectItem>
                          <SelectItem value="0.3">弱</SelectItem>
                          <SelectItem value="0.6">中</SelectItem>
                          <SelectItem value="0.9">强</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-4">
                    <Select
                      onValueChange={(targetId) => handleWeightChange(targetId, 0.6)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="添加新链接..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cards
                          .filter(otherCard => 
                            otherCard.id !== card.id && 
                            !(card.links || {})[otherCard.id] && 
                            otherCard.content
                          )
                          .map(otherCard => (
                            <SelectItem key={otherCard.id} value={otherCard.id}>
                              {otherCard.content?.substring(0, 30)}...
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </motion.div>
    );
  };

  const handleCardClick = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    
    setTimeout(() => {
      const element = document.getElementById(`card-${id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const allCards = await getCards();
      setCards(allCards);
    } catch (error) {
      console.error('Failed to fetch cards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (card: Card) => {
    try {
      setSavingStates(prev => ({ ...prev, [card.id]: true }));
      const cardData: Card = {
        id: card.id,
        content: card.content,
        context: card.context,
        links: card.links,
      };
      await updateCard(cardData);
    } catch (error) {
      console.error('Failed to save card:', error);
    } finally {
      setSavingStates(prev => ({ ...prev, [card.id]: false }));
    }
  };

  return (
    <DraggableContainer
      id={id}
      title={
        <div className="flex items-center justify-between w-full">
          <span>Card List</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isLoading && "animate-spin"
            )} />
          </Button>
        </div>
      }
      initialPosition={initialPosition}
      initialSize={initialSize}
      type="cardList"
      onClose={onClose}
    >
      <div 
        ref={containerRef}
        className={cn(
          "w-full h-full overflow-y-auto bg-white",
          className
        )}
        onMouseDown={handleMouseDown}
      >
        <AnimatePresence mode="wait">
          {cards.map((card) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className={cn(
                expandedId && expandedId !== card.id && "opacity-50"
              )}
            >
              {expandedId === card.id ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.2
                  }}
                  style={{ overflow: 'hidden' }}
                  className="border-b border-gray-100"
                >
                  <div className="p-4">
                    {renderExpandedCard(card)}
                  </div>
                </motion.div>
              ) : (
                <div className="border-b border-gray-100">
                  {renderCollapsedCard(card)}
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>
    </DraggableContainer>
  );
} 