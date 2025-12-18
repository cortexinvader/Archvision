import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Canvas2D from './components/Canvas2D';
import Viewer3D from './components/Viewer3D';
import { HouseElement, ShapeType, ViewMode, HistoryState } from './types';
import { SHAPE_PALETTE, GRID_SIZE, DEFAULT_WALL_HEIGHT } from './constants';

const App: React.FC = () => {
  const [isKeyReady, setIsKeyReady] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryState>(() => {
    const saved = localStorage.getItem('archivision_project');
    const initialElements = saved ? JSON.parse(saved) : [];
    return {
      past: [],
      present: initialElements,
      future: []
    };
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

  useEffect(() => {
    localStorage.setItem('archivision_project', JSON.stringify(history.present));
  }, [history.present]);

  const pushHistory = useCallback((newElements: HouseElement[]) => {
    setHistory(prev => ({
      past: [...prev.past, prev.present].slice(-30),
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

  const elements = history.present;

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
          pushHistory(elements.filter(el => el.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [undo, redo, selectedId, elements, pushHistory]);

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
      x: 400,
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

    // Auto-generate surrounding walls for rooms
    if (paletteItem.type === 'room' && paletteItem.variant === 'rect') {
      const t = 12;
      const walls: HouseElement[] = [
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 400, y: 300 - t, width: paletteItem.defaultSize.w, height: t, rotation: 0, color: '#1e293b', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 400, y: 300 + paletteItem.defaultSize.h, width: paletteItem.defaultSize.w, height: t, rotation: 0, color: '#1e293b', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 400 - t, y: 300 - t, width: t, height: paletteItem.defaultSize.h + (t * 2), rotation: 0, color: '#1e293b', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' },
        { id: Math.random().toString(36).substr(2, 9), type: 'wall', x: 400 + paletteItem.defaultSize.w, y: 300 - t, width: t, height: paletteItem.defaultSize.h + (t * 2), rotation: 0, color: '#1e293b', wallHeight: DEFAULT_WALL_HEIGHT, material: 'brick' }
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
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-white p-12 text-center">
        <div className="relative mb-12">
           <div className="w-24 h-24 border-8 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg animate-pulse shadow-[0_0_30px_rgba(79,70,229,0.5)]" />
           </div>
        </div>
        <h2 className="text-2xl font-black tracking-tighter mb-2">ARCHIVISION OS 2.5</h2>
        <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Initializing Neural Architectures</p>
      </div>
    );
  }

  const selectedElement = elements.find(el => el.id === selectedId);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden select-none relative font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-700 cubic-bezier(0.19, 1, 0.22, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          elements={elements} 
          onUpdateElements={pushHistory}
          onCustomAdd={addElement}
          onClear={() => { if (confirm('Purge all project structural data?')) pushHistory([]); }}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
        <header className="h-20 bg-white/90 backdrop-blur-2xl border-b border-slate-200 flex items-center justify-between px-10 z-30">
          <div className="flex items-center gap-10">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200/50 shadow-inner">
              <button onClick={() => setViewMode('2D')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${viewMode === '2D' ? 'bg-white text-indigo-600 shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Blueprint 2D</button>
              <button onClick={() => setViewMode('3D')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${viewMode === '3D' ? 'bg-white text-indigo-600 shadow-2xl scale-105' : 'text-slate-400 hover:text-slate-600'}`}>Visualizer 3D</button>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
               <div className="bg-indigo-50 border border-indigo-100 rounded-full px-5 py-2 text-[10px] font-black text-indigo-700 uppercase tracking-widest shadow-sm">
                {elements.length} Nodes Active
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={undo} disabled={history.past.length === 0} title="Undo (Ctrl+Z)" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl disabled:opacity-20 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <button onClick={redo} disabled={history.future.length === 0} title="Redo (Ctrl+Y)" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl disabled:opacity-20 transition-all active:scale-90">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 relative">
          <div className={`w-full h-full absolute transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${viewMode === '2D' ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 z-0 translate-y-20 scale-90 pointer-events-none'}`}>
            <Canvas2D elements={elements} selectedId={selectedId} onUpdateElements={pushHistory} onSelectElement={handleSelect} showGrid={showGrid} />
          </div>
          <div className={`w-full h-full absolute transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${viewMode === '3D' ? 'opacity-100 z-10 translate-y-0 scale-100' : 'opacity-0 z-0 -translate-y-20 scale-110 pointer-events-none'}`}>
            <Viewer3D elements={elements} />
          </div>

          {selectedElement && showInspector && (
            <div className="absolute top-10 right-10 w-full max-w-[400px] bg-white/80 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] border border-white/50 p-10 z-40 animate-in fade-in slide-in-from-right-20 duration-700 max-h-[calc(100%-5rem)] overflow-y-auto">
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-5">
                   <div className="w-5 h-5 rounded-full shadow-lg ring-4 ring-slate-100" style={{ backgroundColor: selectedElement.color }} />
                   <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-slate-950">Specifications</h3>
                </div>
                <button onClick={() => setShowInspector(false)} className="p-3 text-slate-400 hover:text-slate-950 transition-all hover:rotate-90">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-12">
                <section>
                  <label className="text-[11px] uppercase font-black text-slate-400 block mb-5 tracking-[0.3em]">Identity</label>
                  <input 
                    type="text" 
                    value={selectedElement.label || ''} 
                    onChange={(e) => updateElementProps(selectedId, { label: e.target.value })}
                    className="w-full text-[15px] font-bold p-6 bg-slate-100/50 border border-slate-200/50 rounded-[28px] focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500/40 outline-none transition-all"
                    placeholder="Enter designation..."
                  />
                </section>

                <section>
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-[11px] uppercase font-black text-slate-400 tracking-[0.3em]">Axis Rotation</label>
                    <span className="text-[12px] font-mono font-black text-indigo-700 bg-indigo-50 px-4 py-2 rounded-2xl">{selectedElement.rotation}°</span>
                  </div>
                  <input type="range" min="0" max="360" step="1" value={selectedElement.rotation} onChange={(e) => updateElementProps(selectedId, { rotation: parseInt(e.target.value) })} className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600 shadow-inner" />
                </section>

                <div className="grid grid-cols-2 gap-8">
                  <section>
                    <label className="text-[11px] uppercase font-black text-slate-400 block mb-5 tracking-[0.3em]">Height (cm)</label>
                    <input type="number" step="10" value={selectedElement.wallHeight} onChange={(e) => updateElementProps(selectedId, { wallHeight: parseInt(e.target.value) })} className="w-full text-[15px] font-bold p-6 bg-slate-100/50 border border-slate-200/50 rounded-[28px] outline-none hover:bg-white transition-all focus:bg-white" />
                  </section>
                  <section>
                    <label className="text-[11px] uppercase font-black text-slate-400 block mb-5 tracking-[0.3em]">Colorways</label>
                    <div className="flex items-center gap-4 p-3 bg-slate-100/50 border border-slate-200/50 rounded-[28px] hover:bg-white transition-all">
                      <input type="color" value={selectedElement.color} onChange={(e) => updateElementProps(selectedId, { color: e.target.value })} className="w-12 h-12 rounded-2xl border-0 bg-transparent p-0 overflow-hidden cursor-pointer shadow-xl" />
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">{selectedElement.color}</span>
                    </div>
                  </section>
                </div>

                <section>
                  <label className="text-[11px] uppercase font-black text-slate-400 block mb-5 tracking-[0.3em]">Material Finish</label>
                  <select value={selectedElement.material} onChange={(e) => updateElementProps(selectedId, { material: e.target.value as any })} className="w-full text-[14px] font-bold p-6 bg-slate-100/50 border border-slate-200/50 rounded-[28px] appearance-none cursor-pointer outline-none hover:bg-white transition-all">
                    <option value="plaster">Executive Plaster</option>
                    <option value="wood">Nordic Ash Wood</option>
                    <option value="glass">Reinforced Glass</option>
                    <option value="brick">Aged Industrial Brick</option>
                    <option value="stone">Polished Granite</option>
                    <option value="metal">Brushed Titanium</option>
                  </select>
                </section>

                <div className="pt-10">
                  <button onClick={() => { pushHistory(elements.filter(el => el.id !== selectedId)); handleSelect(null); }} className="w-full py-6 bg-red-50 text-red-600 text-[11px] font-black uppercase tracking-[0.4em] rounded-[28px] hover:bg-red-100 transition-all flex items-center justify-center gap-4 shadow-sm active:scale-95">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Terminate Entity
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="h-12 bg-white border-t border-slate-200 text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] flex items-center justify-between px-10">
          <div className="flex gap-12">
            <span className="flex items-center gap-3"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" /> Real-time CAD Active</span>
            <span className="opacity-40">Precision Snap: 200mm</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-slate-300">GPU Accelerated Visuals</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;