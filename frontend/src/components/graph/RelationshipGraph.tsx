import React from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useCardStore } from '../../stores/cardStore';
import { DraggableContainer } from '../containers/DraggableContainer';

interface RelationshipGraphProps {
  id: string;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
}

interface GraphData {
  nodes: Array<{
    id: string;
    name: string;
    val: number;
  }>;
  links: Array<{
    source: string;
    target: string;
    value: number;
  }>;
}

export function RelationshipGraph({
  id,
  initialPosition = { x: 800, y: 100 },
  initialSize = { width: 600, height: 400 }
}: RelationshipGraphProps) {
  const cards = useCardStore(state => state.cards);

  const graphData: GraphData = {
    nodes: Object.values(cards)
      .filter(card => card.type === 'atomic' && card.content)
      .map(card => ({
        id: card.id,
        name: card.content.substring(0, 30) + '...',
        val: 1
      })),
    links: Object.values(cards)
      .filter(card => card.type === 'atomic')
      .flatMap(card => 
        Object.entries(card.links || {}).map(([targetId, weight]) => ({
          source: card.id,
          target: targetId,
          value: weight
        }))
      )
  };

  return (
    <DraggableContainer
      id={id}
      title="Relationship Graph"
      initialPosition={initialPosition}
      initialSize={initialSize}
      type="graph"
    >
      <div className="w-full h-full">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          linkWidth={link => (link.value as number) * 2}
          nodeRelSize={6}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          onNodeClick={(node) => {
            const element = document.getElementById(node.id as string);
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      </div>
    </DraggableContainer>
  );
} 