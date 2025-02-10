import React from 'react';
import { useCardStore } from '../../stores/cardStore.ts';

interface WeightControlProps {
  sourceId: string;
  targetId: string;
  initialWeight: number;
}

export function WeightControl({ sourceId, targetId, initialWeight }: WeightControlProps) {
  const updateCard = useCardStore(state => state.updateCard);

  const handleWeightChange = (weight: number) => {
    updateCard(sourceId, {
      links: {
        outgoing: {
          [targetId]: weight
        }
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={initialWeight}
        onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
        className="w-24"
      />
      <span className="text-sm text-gray-500">
        {initialWeight.toFixed(1)}
      </span>
    </div>
  );
} 