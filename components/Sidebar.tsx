
import React, { useState } from 'react';
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
          wallHeight: 120
        }));
        onUpdateElements(processed);
        setAiPrompt('');
      }
    } catch (err) {
      setAiFeedback("Failed to contact the Architect AI.");
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
      setAiFeedback(feedback || "Design looks solid!");
    } catch (err) {
      setAiFeedback("Analysis failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="w-80 bg-slate-900 h-full flex flex-col shadow-2xl overflow-y-auto border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
        <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
          </div>
          ARCHIVISION
        </h1>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white p-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 flex-1 space-y-8">
        {/* Asset Library */}
        <section>
          <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            Components
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {SHAPE_PALETTE.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onCustomAdd(item)}
                className="w-full flex items-center gap-4 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: item.color }} />
                <div className="text-left">
                  <div className="text-[11px] font-black text-slate-200 uppercase tracking-tight">{item.label}</div>
                  <div className="text-[9px] text-slate-500 uppercase font-bold">{item.type} • {item.variant}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Architect AI */}
        <section className="pt-8 border-t border-slate-800">
          <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            AI Designer
          </h3>
          <div className="space-y-3">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. A 3-bedroom villa with a large lounge and central corridor"
              className="w-full text-[11px] p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-24 placeholder:text-slate-600"
            />
            <button
              onClick={handleAiGenerate}
              disabled={isAiLoading}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isAiLoading ? 'Synthesizing...' : 'Generate Plan'}
            </button>
            <button
              onClick={handleAiAnalyze}
              disabled={isAiLoading || elements.length === 0}
              className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors disabled:opacity-30"
            >
              Analyze Current Design
            </button>
          </div>

          {aiFeedback && (
            <div className="mt-4 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-100 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
              <div className="font-black mb-1 text-indigo-400">ARCHITECT'S NOTE:</div>
              {aiFeedback}
            </div>
          )}
        </section>
      </div>

      <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex gap-3">
        <button onClick={onClear} className="flex-1 py-4 bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600/20 transition-all">Clear Canvas</button>
      </div>
    </div>
  );
};

export default Sidebar;
