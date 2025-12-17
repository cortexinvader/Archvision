
import React, { useState } from 'react';
import { HouseElement, ShapeType } from '../types';
import { SHAPE_PALETTE } from '../constants';
import { getAISuggestions, generateNewLayout } from '../services/geminiService';

interface SidebarProps {
  elements: HouseElement[];
  onAddElement: (type: ShapeType) => void;
  onUpdateElements: (elements: HouseElement[]) => void;
  onClear: () => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ elements, onAddElement, onUpdateElements, onClear, onClose }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<{ text: string, type: 'info' | 'success' } | null>(null);

  const handleAnalyze = async () => {
    setAiThinking(true);
    try {
      const advice = await getAISuggestions(elements);
      setAiAdvice({ text: advice || "All looks good!", type: 'info' });
    } catch (e) {
      setAiAdvice({ text: "Architect AI unreachable.", type: 'info' });
    } finally {
      setAiThinking(false);
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setAiThinking(true);
    try {
      const newLayout = await generateNewLayout(aiPrompt);
      if (newLayout) {
        const processed = newLayout.map((el: any) => ({
          ...el,
          id: Math.random().toString(36).substr(2, 9),
          rotation: 0,
          wallHeight: 120
        }));
        onUpdateElements(processed);
        setAiAdvice({ text: "Layout synthesized successfully.", type: 'success' });
      }
    } catch (e) {
      setAiAdvice({ text: "Failed to dream up layout.", type: 'info' });
    } finally {
      setAiThinking(false);
      setAiPrompt('');
    }
  };

  const exportPNG = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'archivision-blueprint.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto overflow-x-hidden">
      <div className="p-6 lg:p-8 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl lg:text-2xl font-black text-white tracking-tighter flex items-center gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          ARCHIVISION
        </h1>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6 lg:p-8 flex-1 space-y-10">
        <section>
          <h3 className="text-[10px] font-black text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            Asset Library
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {SHAPE_PALETTE.map((item) => (
              <button
                key={item.type}
                onClick={() => onAddElement(item.type)}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-800/30 hover:bg-indigo-600/10 hover:border-indigo-500/50 transition-all group text-left h-16 lg:h-auto"
              >
                <div 
                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl shadow-inner flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0" 
                  style={{ backgroundColor: item.color }}
                />
                <div className="overflow-hidden">
                  <div className="text-xs font-black text-slate-200 uppercase tracking-tight truncate">{item.label}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase truncate">{item.material} variant</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="pt-8 border-t border-slate-800">
          <h3 className="text-[10px] font-black text-slate-500 mb-5 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
            Architect AI
          </h3>
          <div className="space-y-4">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Prompt the architect..."
              className="w-full text-sm lg:text-xs p-4 rounded-2xl bg-slate-800/50 border border-slate-800 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-28 placeholder:text-slate-600"
            />
            <button
              disabled={aiThinking}
              onClick={handleGenerate}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {aiThinking ? 'CONSULTING...' : 'GENERATE BLUEPRINT'}
            </button>
            <button
              onClick={handleAnalyze}
              className="w-full py-3 bg-slate-800 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-colors"
            >
              ANALYZE DESIGN
            </button>
          </div>
          
          {aiAdvice && (
            <div className={`mt-6 p-5 rounded-2xl border text-[11px] leading-relaxed relative ${aiAdvice.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-100'}`}>
              <button 
                onClick={() => setAiAdvice(null)}
                className="absolute top-3 right-3 text-white/30 hover:text-white"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="font-black mb-2 flex items-center gap-2">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" /></svg>
                AI ARCHITECT FEEDBACK
              </div>
              {aiAdvice.text}
            </div>
          )}
        </section>
      </div>

      <div className="p-6 lg:p-8 border-t border-slate-800 bg-slate-900/80 sticky bottom-0 flex gap-3">
        <button 
          onClick={exportPNG}
          className="flex-1 py-4 rounded-xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 active:scale-95 transition-all"
        >
          EXPORT PNG
        </button>
        <button 
          onClick={onClear}
          className="px-4 py-4 rounded-xl bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 transition-all"
        >
          RESET
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
