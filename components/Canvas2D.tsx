import React, { useRef, useEffect, useState, useCallback } from 'react';
import { HouseElement, ShapeVariant } from '../types';
import { GRID_SIZE, SHAPE_PALETTE } from '../constants';

interface Canvas2DProps {
  elements: HouseElement[];
  selectedId: string | null;
  onUpdateElements: (elements: HouseElement[]) => void;
  onSelectElement: (id: string | null, openInspector?: boolean) => void;
  showGrid: boolean;
}

const Canvas2D: React.FC<Canvas2DProps> = ({ elements, selectedId, onUpdateElements, onSelectElement, showGrid }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<number | null>(null);
  const [isMovingMode, setIsMovingMode] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === 'Space') setSpacePressed(true); 
    };
    const handleKeyUp = (e: KeyboardEvent) => { 
      if (e.code === 'Space') setSpacePressed(false); 
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const drawShape = (ctx: CanvasRenderingContext2D, variant: ShapeVariant, w: number, h: number) => {
    ctx.beginPath();
    if (variant === 'l-shape') {
      const thick = Math.min(w, h) * 0.35;
      ctx.moveTo(-w/2, -h/2);
      ctx.lineTo(-w/2 + thick, -h/2);
      ctx.lineTo(-w/2 + thick, h/2 - thick);
      ctx.lineTo(w/2, h/2 - thick);
      ctx.lineTo(w/2, h/2);
      ctx.lineTo(-w/2, h/2);
    } else if (variant === 't-shape') {
      const thick = Math.min(w, h) * 0.35;
      ctx.moveTo(-w/2, -h/2);
      ctx.lineTo(w/2, -h/2);
      ctx.lineTo(w/2, -h/2 + thick);
      ctx.lineTo(thick/2, -h/2 + thick);
      ctx.lineTo(thick/2, h/2);
      ctx.lineTo(-thick/2, h/2);
      ctx.lineTo(-thick/2, -h/2 + thick);
      ctx.lineTo(-w/2, -h/2 + thick);
    } else {
      ctx.rect(-w / 2, -h / 2, w, h);
    }
    ctx.closePath();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    if (showGrid) {
      const startX = -transform.x / transform.scale;
      const startY = -transform.y / transform.scale;
      const endX = (canvas.width - transform.x) / transform.scale;
      const endY = (canvas.height - transform.y) / transform.scale;

      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.5 / transform.scale;
      for (let x = Math.floor(startX / GRID_SIZE) * GRID_SIZE; x <= endX; x += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
      }
      for (let y = Math.floor(startY / GRID_SIZE) * GRID_SIZE; y <= endY; y += GRID_SIZE) {
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
      }
    }

    elements.forEach(el => {
      const isSelected = el.id === selectedId;
      const paletteItem = SHAPE_PALETTE.find(p => p.type === el.type && p.variant === el.variant);
      
      ctx.save();
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      
      // Shadow effect
      ctx.shadowBlur = isSelected ? 30 / transform.scale : 4 / transform.scale;
      ctx.shadowColor = isSelected ? 'rgba(79, 70, 229, 0.4)' : 'rgba(0,0,0,0.05)';
      
      ctx.fillStyle = el.color || paletteItem?.color || '#cbd5e1';
      drawShape(ctx, el.variant || 'rect', el.width, el.height);
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3 / transform.scale;
        ctx.stroke();
        
        // Resize handle indicator
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 2 / transform.scale;
        ctx.beginPath();
        ctx.arc(el.width / 2, el.height / 2, 10 / transform.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Measurement Lines
        ctx.strokeStyle = '#4f46e5';
        ctx.setLineDash([5 / transform.scale, 5 / transform.scale]);
        ctx.lineWidth = 1 / transform.scale;
        
        // Horizontal Dim
        ctx.beginPath();
        ctx.moveTo(-el.width/2, el.height/2 + 20/transform.scale);
        ctx.lineTo(el.width/2, el.height/2 + 20/transform.scale);
        ctx.stroke();
        
        // Vertical Dim
        ctx.beginPath();
        ctx.moveTo(el.width/2 + 20/transform.scale, -el.height/2);
        ctx.lineTo(el.width/2 + 20/transform.scale, el.height/2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dimension Text
        ctx.fillStyle = '#4f46e5';
        ctx.font = `bold ${12 / transform.scale}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText(`${el.width}cm`, 0, el.height/2 + 40/transform.scale);
        
        ctx.save();
        ctx.translate(el.width/2 + 40/transform.scale, 0);
        ctx.rotate(Math.PI/2);
        ctx.fillText(`${el.height}cm`, 0, 0);
        ctx.restore();
      }

      // Labeling
      if (el.label || el.type === 'room') {
        ctx.shadowBlur = 0;
        ctx.fillStyle = isSelected ? '#4f46e5' : '#1e293b';
        ctx.font = `bold ${Math.max(10, 13 / transform.scale)}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillText((el.label || el.type).toUpperCase(), 0, 5 / transform.scale);
      }
      
      ctx.restore();
    });
    ctx.restore();
  }, [elements, selectedId, showGrid, transform, isMovingMode]);

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

  useEffect(() => { draw(); }, [elements, selectedId, draw, showGrid, transform]);

  const screenToWorld = (sx: number, sy: number) => {
    return {
      x: (sx - transform.x) / transform.scale,
      y: (sy - transform.y) / transform.scale
    };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const zoomIntensity = 0.05;
    const wheel = e.deltaY < 0 ? 1 : -1;
    const zoom = Math.exp(wheel * zoomIntensity);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.min(Math.max(0.05, transform.scale * zoom), 10);
    
    setTransform(prev => ({
      scale: newScale,
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale)
    }));
  };

  const handleStart = (clientX: number, clientY: number, button: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    if (button === 2 || spacePressed) {
      setIsPanning(true);
      setDragOffset({ x: mx - transform.x, y: my - transform.y });
      return;
    }

    const world = screenToWorld(mx, my);

    const el = selectedId ? elements.find(item => item.id === selectedId) : null;
    if (el) {
      // Rotation logic for simplicity: check handle at bottom right
      const rx = el.x + el.width;
      const ry = el.y + el.height;
      const handleSize = 30 / transform.scale;
      if (Math.abs(world.x - rx) < handleSize && Math.abs(world.y - ry) < handleSize) {
        setIsResizing(true);
        return;
      }
    }

    const clicked = [...elements].reverse().find(el => 
      world.x >= el.x && world.x <= el.x + el.width &&
      world.y >= el.y && world.y <= el.y + el.height
    );

    if (clicked) {
      const timer = window.setTimeout(() => {
        setIsDragging(true);
        setIsMovingMode(true);
        onSelectElement(clicked.id, false);
      }, 200);
      setLongPressTimer(timer);
      setDragOffset({ x: world.x - clicked.x, y: world.y - clicked.y });
    } else {
      onSelectElement(null);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    if (isPanning) {
      setTransform(prev => ({ ...prev, x: mx - dragOffset.x, y: my - dragOffset.y }));
      return;
    }

    const world = screenToWorld(mx, my);

    if (!isDragging && !isResizing && longPressTimer) {
      const startWorld = screenToWorld(mx - (dragOffset.x * transform.scale), my - (dragOffset.y * transform.scale));
      if (Math.abs(world.x - startWorld.x) > 5) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
    }

    if (isResizing && selectedId) {
      onUpdateElements(elements.map(el => {
        if (el.id === selectedId) {
          const newW = Math.max(GRID_SIZE, Math.round((world.x - el.x) / GRID_SIZE) * GRID_SIZE);
          const newH = Math.max(GRID_SIZE, Math.round((world.y - el.y) / GRID_SIZE) * GRID_SIZE);
          return { ...el, width: newW, height: newH };
        }
        return el;
      }));
    } else if (isDragging && selectedId) {
      onUpdateElements(elements.map(el => {
        if (el.id === selectedId) {
          const newX = Math.round((world.x - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
          const newY = Math.round((world.y - dragOffset.y) / GRID_SIZE) * GRID_SIZE;
          return { ...el, x: newX, y: newY };
        }
        return el;
      }));
    }
  };

  const handleEnd = (clientX: number, clientY: number) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      if (!isMovingMode) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const world = screenToWorld(clientX - rect.left, clientY - rect.top);
          const clicked = [...elements].reverse().find(el => 
            world.x >= el.x && world.x <= el.x + el.width &&
            world.y >= el.y && world.y <= el.y + el.height
          );
          if (clicked) onSelectElement(clicked.id, true);
        }
      }
    }
    setIsDragging(false);
    setIsResizing(false);
    setIsMovingMode(false);
    setIsPanning(false);
  };

  return (
    <div className="w-full h-full relative bg-slate-50 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <canvas
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY, e.button)}
        onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
        onMouseUp={(e) => handleEnd(e.clientX, e.clientY)}
        onMouseLeave={() => handleEnd(0,0)}
        className={`w-full h-full block touch-none ${isPanning || spacePressed ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      />
      
      <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl px-5 py-3 rounded-3xl shadow-2xl border border-slate-200 flex items-center gap-6 pointer-events-auto">
          <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.max(0.1, prev.scale - 0.2) }))} className="text-slate-400 hover:text-indigo-600 font-black p-2 bg-slate-50 rounded-xl transition-all active:scale-90">－</button>
          <span className="text-[12px] font-black text-slate-800 uppercase tracking-widest min-w-[50px] text-center">
            {Math.round(transform.scale * 100)}%
          </span>
          <button onClick={() => setTransform(prev => ({ ...prev, scale: Math.min(10, prev.scale + 0.2) }))} className="text-slate-400 hover:text-indigo-600 font-black p-2 bg-slate-50 rounded-xl transition-all active:scale-90">＋</button>
          <div className="w-px h-6 bg-slate-200" />
          <button onClick={() => setTransform({ x: 0, y: 0, scale: 0.8 })} className="text-[10px] font-black text-indigo-600 uppercase hover:underline p-2">Zoom Fit</button>
        </div>
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white/70 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
          Space + Drag to Pan • Long Press to Select
        </div>
      </div>

      {isMovingMode && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl pointer-events-none animate-pulse">
          Precision Mode Active
        </div>
      )}
    </div>
  );
};

export default Canvas2D;