import React, { useState, useRef } from 'react';
import { HouseElement, ShapeType } from '../types';
import { SHAPE_PALETTE } from '../constants';
import { getAISuggestions, generateNewLayout } from '../services/geminiService';

interface SidebarProps {
  elements: HouseElement[];
  onCustomAdd: (paletteItem: any) => void;
  onUpdateElements: (elements: HouseElement[]) => void;
  onClear: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ elements, onCustomAdd, onUpdateElements, onClear, onClose }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiFeedback(null);
    try {
      const result = await generateNewLayout(aiPrompt);
      if (result && Array.isArray(result)) {
        const processed = result.map(el => ({
          ...el,
          id: Math.random().toString(36).substr(2, 9),
          wallHeight: 240
        }));
        onUpdateElements(processed);
        setAiPrompt('');
      }
    } catch (err) {
      setAiFeedback("System Override: AI unavailable. Check network.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (elements.length === 0) return;
    setIsAiLoading(true);
    setAiFeedback(null);
    try {
      const feedback = await getAISuggestions(elements);
      setAiFeedback(feedback || "Analysis complete. Design within safety parameters.");
    } catch (err) {
      setAiFeedback("Analysis failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archivision_plan_${new Date().getTime()}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) onUpdateElements(json);
      } catch (err) {
        alert("Invalid project file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-80 bg-slate-900 h-full flex flex-col shadow-2xl overflow-y-auto border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
          </div>
          ARCHIVISION
        </h1>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 flex-1 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              Structural Palette
            </h3>
            <button onClick={handleExport} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Backup</button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {SHAPE_PALETTE.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onCustomAdd(item)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group relative overflow-hidden"
              >
                <div className="w-10 h-10 rounded-xl shadow-lg group-hover:scale-110 transition-transform flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div className="text-left">
                  <div className="text-[12px] font-black text-slate-100 uppercase tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.type} • {item.variant}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="pt-8 border-t border-slate-800">
          <h3 className="text-[10px] font-black text-slate-500 mb-5 uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            Architect AI Core
          </h3>
          <div className="space-y-4">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Design a luxury penthouse with glass walls and central foyer..."
              className="w-full text-[12px] font-bold p-5 rounded-2xl bg-slate-950/50 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-600 outline-none resize-none h-32 placeholder:text-slate-700 transition-all"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50"
              >
                {isAiLoading ? 'Synthesizing...' : 'Autoplan'}
              </button>
              <button
                onClick={handleAiAnalyze}
                disabled={isAiLoading || elements.length === 0}
                className="w-14 py-4 bg-slate-800 text-slate-400 rounded-2xl hover:text-white transition-all flex items-center justify-center"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            </div>
          </div>

          {aiFeedback && (
            <div className="mt-5 p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-indigo-200 leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
              <div className="font-black mb-2 text-indigo-400 uppercase tracking-widest">Consultant Output:</div>
              {aiFeedback}
            </div>
          )}
        </section>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex flex-col gap-3">
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-4 bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition-all">Import</button>
          <button onClick={onClear} className="flex-1 py-4 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600/20 transition-all">Format</button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
      </div>
    </div>
  );
};

export default Sidebar;