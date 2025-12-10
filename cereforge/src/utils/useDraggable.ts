import { useState, useRef, useEffect } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableReturn {
  position: Position;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
}

export const useDraggable = (initialX = 0, initialY = 0): UseDraggableReturn => {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, currentX: initialX, currentY: initialY });

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current.startX = e.clientX - position.x;
    dragRef.current.startY = e.clientY - position.y;
  };

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    dragRef.current.startX = touch.clientX - position.x;
    dragRef.current.startY = touch.clientY - position.y;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragRef.current.startX;
      const newY = e.clientY - dragRef.current.startY;

      // Boundary constraints
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      dragRef.current.currentX = constrainedX;
      dragRef.current.currentY = constrainedY;

      requestAnimationFrame(() => {
        setPosition({ x: constrainedX, y: constrainedY });
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragRef.current.startX;
      const newY = touch.clientY - dragRef.current.startY;

      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;

      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));

      dragRef.current.currentX = constrainedX;
      dragRef.current.currentY = constrainedY;

      requestAnimationFrame(() => {
        setPosition({ x: constrainedX, y: constrainedY });
      });
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  return {
    position,
    isDragging,
    handleMouseDown,
    handleTouchStart
  };
};