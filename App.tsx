
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Canvas2D from './components/Canvas2D';
import Viewer3D from './components/Viewer3D';
import { HouseElement, ShapeType, ViewMode, HistoryState } from './types';
import { SHAPE_PALETTE, GRID_SIZE, DEFAULT_WALL_HEIGHT } from './constants';

const App: React.FC = () => {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: []
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [showGrid, setShowGrid] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const elements = history.present;

  const pushHistory = useCallback((newElements: HouseElement[]) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present].slice(-50),
      present: newElements,
      future: []
    }));
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, prev.past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture
      };
    });
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          pushHistory(elements.filter(el => el.id !== selectedId));
          setSelectedId(null);
        }
      } else if (e.key === 'g') {
        setShowGrid(!showGrid);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedId, elements, pushHistory, showGrid]);

  const addElement = (type: ShapeType) => {
    const paletteItem = SHAPE_PALETTE.find(p => p.type === type);
    const newElement: HouseElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 100,
      y: 100,
      width: paletteItem?.defaultSize.w || 100,
      height: paletteItem?.defaultSize.h || 100,
      rotation: 0,
      color: paletteItem?.color,
      material: paletteItem?.material,
      wallHeight: DEFAULT_WALL_HEIGHT
    };
    pushHistory([...elements, newElement]);
    setSelectedId(newElement.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const updateElementProps = (id: string, props: Partial<HouseElement>) => {
    pushHistory(elements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden font-sans select-none relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          elements={elements} 
          onAddElement={addElement} 
          onUpdateElements={pushHistory}
          onClear={() => { if (confirm('Wipe project?')) pushHistory([]); }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        {/* Pro Toolbar */}
        <div className="h-16 lg:h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 z-30 shadow-sm">
          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('2D')}
                className={`px-3 lg:px-4 py-1 rounded-md text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === '2D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="hidden sm:inline">Draft</span> 2D
              </button>
              <button
                onClick={() => setViewMode('3D')}
                className={`px-3 lg:px-4 py-1 rounded-md text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all ${viewMode === '3D' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <span className="hidden sm:inline">Render</span> 3D
              </button>
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 mx-1 lg:mx-2" />

            <div className="flex gap-0.5 lg:gap-1">
              <button 
                onClick={undo} 
                disabled={history.past.length === 0}
                className="p-1.5 lg:p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="Undo (Ctrl+Z)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <button 
                onClick={redo} 
                disabled={history.future.length === 0}
                className="p-1.5 lg:p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30 rounded-lg transition-colors"
                title="Redo (Ctrl+Y)"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className={`p-2 rounded-lg transition-colors ${showGrid ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
              title="Toggle Grid (G)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
            <div className="hidden md:block text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase">
              {elements.length} Components
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative">
          <div className={`w-full h-full absolute transition-opacity duration-300 ${viewMode === '2D' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <Canvas2D 
              elements={elements} 
              selectedId={selectedId} 
              onUpdateElements={pushHistory} 
              onSelectElement={setSelectedId}
              showGrid={showGrid}
            />
          </div>
          <div className={`w-full h-full absolute transition-opacity duration-300 ${viewMode === '3D' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <Viewer3D elements={elements} />
          </div>

          {/* Floating Property Inspector - Repositioned for mobile */}
          {selectedElement && (
            <div className="absolute top-20 right-4 left-4 lg:left-auto lg:right-6 lg:w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-4 lg:p-5 z-40 animate-in fade-in slide-in-from-right-8 duration-300 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedElement.color }} />
                  Inspector
                </h3>
                <button onClick={() => setSelectedId(null)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">Identifier</label>
                  <input 
                    type="text" 
                    value={selectedElement.label || ''} 
                    onChange={(e) => updateElementProps(selectedId, { label: e.target.value })}
                    className="w-full text-sm lg:text-xs p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium"
                    placeholder="e.g. Living Room Wall"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">Rotation (°)</label>
                    <input 
                      type="number" 
                      value={selectedElement.rotation} 
                      onChange={(e) => updateElementProps(selectedId, { rotation: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm lg:text-xs p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">Height (cm)</label>
                    <input 
                      type="number" 
                      value={selectedElement.wallHeight || DEFAULT_WALL_HEIGHT} 
                      onChange={(e) => updateElementProps(selectedId, { wallHeight: parseInt(e.target.value) || 0 })}
                      className="w-full text-sm lg:text-xs p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 block mb-1.5">Material & Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={selectedElement.color} 
                      onChange={(e) => updateElementProps(selectedId, { color: e.target.value })}
                      className="h-12 w-12 lg:h-10 lg:w-12 cursor-pointer rounded-lg bg-transparent p-0 border-0"
                    />
                    <select 
                      value={selectedElement.material}
                      onChange={(e) => updateElementProps(selectedId, { material: e.target.value as any })}
                      className="flex-1 text-sm lg:text-xs p-3 lg:p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none h-12 lg:h-auto"
                    >
                      <option value="plaster">Smooth Plaster</option>
                      <option value="wood">Polished Wood</option>
                      <option value="glass">Tempered Glass</option>
                      <option value="brick">Rough Brick</option>
                      <option value="stone">Natural Stone</option>
                      <option value="metal">Brushed Metal</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    pushHistory(elements.filter(el => el.id !== selectedId));
                    setSelectedId(null);
                  }}
                  className="w-full py-4 lg:py-3 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Remove Component
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-8 bg-slate-900 text-slate-400 px-4 lg:px-6 flex items-center justify-between text-[9px] lg:text-[10px] font-medium tracking-wide">
          <div className="flex gap-4 lg:gap-6">
            <span>CM UNITS</span>
            <span className="hidden sm:inline">GRID: {GRID_SIZE}PX</span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5 lg:gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="hidden sm:inline">SYSTEM</span> READY
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
