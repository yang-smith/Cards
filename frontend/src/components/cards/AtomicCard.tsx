import React, { useEffect, useState } from 'react';
import Vditor from 'vditor';
import { DraggableContainer } from '../containers/DraggableContainer';
import { useCardStore } from '../../stores/cardStore';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";
import { createCard, updateCard as updateCardApi } from '@/api/cards';
import { Button } from "@/components/ui/button";

interface AtomicCardProps {
  id: string;
  initialContent?: string;
  initialContext?: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

export function AtomicCard({
  id,
  initialContent = '',
  initialContext = '',
  initialPosition,
  initialSize,
}: AtomicCardProps) {
  const [context, setContext] = useState(initialContext);
  const [isSaving, setIsSaving] = useState(false);
  const { updateCard, removeCard } = useCardStore();
  const uicards = useCardStore(state => state.uicards);

  useEffect(() => {
    const vditor = new Vditor(`editor-${id}`, {
      after: () => {
        vditor.setValue(initialContent);
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
  }, [id, initialContent]);

  const handleWeightChange = (targetId: string, weight: number) => {
    const newLinks = { ...uicards[id].links };
    if (weight === 0) {
      delete newLinks[targetId];
    } else {
      newLinks[targetId] = weight;
    }
    updateCard(id, { links: newLinks });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const cardData = {
        id: id,
        content: uicards[id].content,
        context: context,
        links: uicards[id].links,
      };

      await updateCardApi(cardData);
    } catch (error) {
      console.error('Failed to save card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DraggableContainer
      id={id}
      title={`Card ${id}`}
      initialPosition={initialPosition}
      initialSize={initialSize}
      type="atomic"
      onClose={() => removeCard(id)}
    >
      <div className="space-y-4 p-4">
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-pulse' : ''}`} />
          </Button>
        </div>

        <div id={`editor-${id}`} className="w-full" />
        
        <div className="space-y-2">
          <Label>Context</Label>
          <Input
            value={context}
            onChange={(e) => {
              setContext(e.target.value);
              updateCard(id, { context: e.target.value });
            }}
          />
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="links">
            <AccordionTrigger>Links</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {Object.entries(uicards[id]?.links || {}).map(([targetId, weight]) => (
                  <div key={targetId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm truncate w-32">
                        {uicards[targetId]?.content.substring(0, 20)}...
                      </Label>
                      <span className="text-sm text-gray-500">
                        {weight.toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      value={[weight * 100]}
                      onValueChange={([value]) => handleWeightChange(targetId, value / 100)}
                      max={100}
                      step={10}
                    />
                  </div>
                ))}

                <Select
                  onValueChange={(value) => handleWeightChange(value, 0.5)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add new link..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(uicards)
                      .filter(card => 
                        card.id !== id && 
                        !uicards[id].links[card.id] && 
                        card.type === 'atomic' && 
                        card.content
                      )
                      .map(card => (
                        <SelectItem key={card.id} value={card.id}>
                          {card.content?.substring(0, 30)}...
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </DraggableContainer>
  );
} 