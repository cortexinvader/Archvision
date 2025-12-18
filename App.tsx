
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Canvas2D from './components/Canvas2D';
import Viewer3D from './components/Viewer3D';
import { HouseElement, ShapeType, ViewMode, HistoryState } from './types';
import { SHAPE_PALETTE, GRID_SIZE, DEFAULT_WALL_HEIGHT } from './constants';

const App: React.FC = () => {
  const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: []
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [showGrid, setShowGrid] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      }
      setIsKeyReady(true);
    };
    checkKey();
  }, []);

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
      return { past: prev.past.slice(0, -1), present: previous, future: [prev.present, ...prev.future] };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      return { past: [...prev.past, prev.present], present: prev.future[0], future: prev.future.slice(1) };
    });
  }, []);

  const handleSelect = (id: string | null, openInspector: boolean = false) => {
    setSelectedId(id);
    setShowInspector(openInspector);
  };

  const addElement = (paletteItem: any) => {
    const baseId = Math.random().toString(36).substr(2, 9);
    const newElement: HouseElement = {
      id: baseId,
      type: paletteItem.type,
      variant: paletteItem.variant,
      x: 300,
      y: 300,
      width: paletteItem.defaultSize.w,
      height: paletteItem.defaultSize.h,
      rotation: 0,
      color: paletteItem.color,
      material: paletteItem.material,
      wallHeight: DEFAULT_WALL_HEIGHT,
      label: paletteItem.label
    };

    let updatedElements = [...elements, newElement];

    if (paletteItem.type === 'room' && paletteItem.variant === 'rect') {
      const wallThickness = 12;
      const walls: HouseElement[] = [
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 300, y: 300 - wallThickness, width: paletteItem.defaultSize.w, height: wallThickness, rotation: 0, color: '#334155', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 300, y: 300 + paletteItem.defaultSize.h, width: paletteItem.defaultSize.w, height: wallThickness, rotation: 0, color: '#334155', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 300 - wallThickness, y: 300 - wallThickness, width: wallThickness, height: paletteItem.defaultSize.h + (wallThickness * 2), rotation: 0, color: '#334155', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 300 + paletteItem.defaultSize.w, y: 300 - wallThickness, width: wallThickness, height: paletteItem.defaultSize.h + (wallThickness * 2), rotation: 0, color: '#334155', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' }
      ];
      updatedElements = [...updatedElements, ...walls];
    }

    pushHistory(updatedElements);
    handleSelect(newElement.id, true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const updateElementProps = (id: string, props: Partial<HouseElement>) => {
    pushHistory(elements.map(el => el.id === id ? { ...el, ...props } : el));
  };

  if (!isKeyReady) {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 animate-pulse">Archivision OS Loading</p>
      </div>
    );
  }

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden select-none relative font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          elements={elements} 
          onUpdateElements={pushHistory}
          onCustomAdd={addElement}
          onClear={() => { if (confirm('Clear all structural data?')) pushHistory([]); }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        {/* Navbar */}
        <div className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-6 z-30">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200">
              <button onClick={() => setViewMode('2D')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewMode === '2D' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Draft 2D</button>
              <button onClick={() => setViewMode('3D')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${viewMode === '3D' ? 'bg-white text-indigo-600 shadow-lg shadow-indigo-500/10 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Render 3D</button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
               <div className="bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                {elements.length} Entit{elements.length === 1 ? 'y' : 'ies'} Managed
              </div>
            </div>
            <div className="flex items-center gap-1 ml-4">
              <button onClick={undo} disabled={history.past.length === 0} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-20 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <button onClick={redo} disabled={history.future.length === 0} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl disabled:opacity-20 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Viewports */}
        <div className="flex-1 relative">
          <div className={`w-full h-full absolute transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${viewMode === '2D' ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 z-0 translate-y-8 scale-95 pointer-events-none'}`}>
            <Canvas2D elements={elements} selectedId={selectedId} onUpdateElements={pushHistory} onSelectElement={handleSelect} showGrid={showGrid} />
          </div>
          <div className={`w-full h-full absolute transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) ${viewMode === '3D' ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 z-0 -translate-y-8 scale-105 pointer-events-none'}`}>
            <Viewer3D elements={elements} />
          </div>

          {/* Inspector Panel */}
          {selectedElement && showInspector && (
            <div className="absolute top-6 right-6 w-full max-w-[360px] bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/40 p-8 z-40 animate-in fade-in slide-in-from-right-12 duration-500 max-h-[calc(100%-3rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: selectedElement.color }} />
                   <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-slate-900">Entity Specs</h3>
                </div>
                <button onClick={() => setShowInspector(false)} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-10">
                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-4 tracking-[0.2em]">Alias</label>
                  <input 
                    type="text" 
                    value={selectedElement.label || ''} 
                    onChange={(e) => updateElementProps(selectedId, { label: e.target.value })}
                    className="w-full text-[13px] font-bold p-5 bg-slate-50/50 border border-slate-100 rounded-[24px] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/30 outline-none transition-all"
                    placeholder="e.g. South Wing Wall"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-5">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Angular Rotation</label>
                    <span className="text-[11px] font-mono font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{selectedElement.rotation}°</span>
                  </div>
                  <input type="range" min="0" max="360" step="15" value={selectedElement.rotation} onChange={(e) => updateElementProps(selectedId, { rotation: parseInt(e.target.value) })} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-4 tracking-[0.2em]">Height (cm)</label>
                    <input type="number" value={selectedElement.wallHeight} onChange={(e) => updateElementProps(selectedId, { wallHeight: parseInt(e.target.value) })} className="w-full text-[13px] font-bold p-5 bg-slate-50/50 border border-slate-100 rounded-[24px] outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 block mb-4 tracking-[0.2em]">Chroma</label>
                    <div className="flex items-center gap-4 p-2.5 bg-slate-50/50 border border-slate-100 rounded-[24px]">
                      <input type="color" value={selectedElement.color} onChange={(e) => updateElementProps(selectedId, { color: e.target.value })} className="w-11 h-11 rounded-[18px] border-0 bg-transparent p-0 overflow-hidden cursor-pointer shadow-sm" />
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{selectedElement.color}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-black text-slate-400 block mb-4 tracking-[0.2em]">Material Finish</label>
                  <select value={selectedElement.material} onChange={(e) => updateElementProps(selectedId, { material: e.target.value as any })} className="w-full text-[12px] font-bold p-5 bg-slate-50/50 border border-slate-100 rounded-[24px] appearance-none cursor-pointer outline-none hover:bg-slate-100/50 transition-colors">
                    <option value="plaster">Polished Plaster</option>
                    <option value="wood">Sustainable Oak</option>
                    <option value="glass">Clear Structural Glass</option>
                    <option value="brick">Traditional Red Brick</option>
                    <option value="stone">Carrara Marble</option>
                    <option value="metal">Anodized Aluminum</option>
                  </select>
                </div>

                <div className="pt-6">
                  <button onClick={() => { pushHistory(elements.filter(el => el.id !== selectedId)); handleSelect(null); }} className="w-full py-5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-[0.3em] rounded-[24px] hover:bg-red-100 transition-all flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete Entity
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="h-10 bg-white border-t border-slate-200 text-[9px] text-slate-400 font-black uppercase tracking-[0.3em] flex items-center justify-between px-8">
          <div className="flex gap-8">
            <span className="flex items-center gap-2"><div className="w-1 h-1 bg-indigo-400 rounded-full" /> SI Metric Standard</span>
            <span className="opacity-50">Snap: 20cm</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300">GPU Accelerated Render</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
