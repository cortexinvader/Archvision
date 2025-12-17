
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HouseElement } from '../types';
import { GRID_SIZE, SHAPE_PALETTE } from '../constants';

interface Canvas2DProps {
  elements: HouseElement[];
  selectedId: string | null;
  onUpdateElements: (elements: HouseElement[]) => void;
  onSelectElement: (id: string | null) => void;
  showGrid: boolean;
}

const Canvas2D: React.FC<Canvas2DProps> = ({ elements, selectedId, onUpdateElements, onSelectElement, showGrid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    }

    elements.forEach(el => {
      const isSelected = el.id === selectedId;
      const paletteItem = SHAPE_PALETTE.find(p => p.type === el.type);
      
      ctx.save();
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      
      // Shadow
      ctx.shadowBlur = isSelected ? 20 : 5;
      ctx.shadowColor = isSelected ? 'rgba(99, 102, 241, 0.4)' : 'rgba(0,0,0,0.05)';
      
      ctx.fillStyle = el.color || paletteItem?.color || '#ccc';
      ctx.fillRect(-el.width / 2, -el.height / 2, el.width, el.height);
      
      if (isSelected) {
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.strokeRect(-el.width / 2, -el.height / 2, el.width, el.height);
        
        // Resize handle
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(el.width / 2, el.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (el.label || el.type === 'room') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = isSelected ? '#4f46e5' : '#475569';
        ctx.font = 'bold 11px Inter';
        ctx.textAlign = 'center';
        ctx.fillText((el.label || el.type).toUpperCase(), 0, 4);
      }
      
      ctx.restore();
    });
  }, [elements, selectedId, showGrid]);

  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
        draw();
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [draw]);

  useEffect(() => { draw(); }, [elements, selectedId, draw, showGrid]);

  const handleStart = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    if (selectedId) {
      const el = elements.find(item => item.id === selectedId);
      if (el) {
        const rx = el.x + el.width;
        const ry = el.y + el.height;
        if (Math.abs(mx - rx) < 25 && Math.abs(my - ry) < 25) { // Increased hit area for mobile
          setIsResizing(true);
          return;
        }
      }
    }

    const clicked = [...elements].reverse().find(el => 
      mx >= el.x && mx <= el.x + el.width &&
      my >= el.y && my <= el.y + el.height
    );

    if (clicked) {
      onSelectElement(clicked.id);
      setIsDragging(true);
      setDragOffset({ x: mx - clicked.x, y: my - clicked.y });
    } else {
      onSelectElement(null);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging && !isResizing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    if (isResizing && selectedId) {
      onUpdateElements(elements.map(el => {
        if (el.id === selectedId) {
          const newW = Math.max(GRID_SIZE, Math.round((mx - el.x) / GRID_SIZE) * GRID_SIZE);
          const newH = Math.max(GRID_SIZE, Math.round((my - el.y) / GRID_SIZE) * GRID_SIZE);
          return { ...el, width: newW, height: newH };
        }
        return el;
      }));
    } else if (isDragging && selectedId) {
      onUpdateElements(elements.map(el => {
        if (el.id === selectedId) {
          const newX = Math.round((mx - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
          const newY = Math.round((my - dragOffset.y) / GRID_SIZE) * GRID_SIZE;
          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className="w-full h-full relative bg-white overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handleStart(touch.clientX, touch.clientY);
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          handleMove(touch.clientX, touch.clientY);
        }}
        onTouchEnd={handleEnd}
        className="w-full h-full block touch-none"
      />
    </div>
  );
};

export default Canvas2D;
