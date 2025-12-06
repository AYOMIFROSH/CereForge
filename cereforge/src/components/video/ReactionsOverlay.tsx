// src/components/video/ReactionsOverlay.tsx
import React, { useState, useEffect } from 'react';
import { Reaction } from '@/types/video.types';

interface ReactionsOverlayProps {
  reactions: Reaction[];
  onReactionComplete: (reactionId: string) => void;
}

const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ 
  reactions, 
  onReactionComplete 
}) => {
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    setActiveReactions(reactions);

    reactions.forEach((reaction) => {
      setTimeout(() => {
        onReactionComplete(reaction.id);
      }, 3000);
    });
  }, [reactions, onReactionComplete]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {activeReactions.map((reaction) => (
        <ReactionBubble key={reaction.id} reaction={reaction} />
      ))}
    </div>
  );
};

interface ReactionBubbleProps {
  reaction: Reaction;
}

const ReactionBubble: React.FC<ReactionBubbleProps> = ({ reaction }) => {
  const [position, setPosition] = useState({ x: reaction.x, y: reaction.y });

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      const animate = () => {
        setPosition((prev) => ({
          x: prev.x + (Math.random() - 0.5) * 2,
          y: prev.y - 2
        }));
      };

      const interval = setInterval(animate, 16);
      return () => clearInterval(interval);
    });

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      className="absolute text-4xl animate-in zoom-in-50 fade-in duration-300"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        animation: 'float 3s ease-out forwards, fadeOut 3s ease-out forwards'
      }}
    >
      {reaction.emoji}
    </div>
  );
};

export default ReactionsOverlay;