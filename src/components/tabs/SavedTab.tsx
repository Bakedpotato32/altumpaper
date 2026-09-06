import React from 'react';
import type { SavedPaper } from '../../utils/db';

interface Props {
  savedPapers: SavedPaper[];
  onLoadPaper: (paper: SavedPaper) => void;
}

export const SavedTab: React.FC<Props> = ({
  savedPapers,
  onLoadPaper
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900">Saved Question Papers</h2>
        <div className="divide-y divide-slate-100">
          {savedPapers.map((p) => (
            <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
              <div>
                <div className="font-bold text-slate-800">{p.title}</div>
                <div className="text-slate-400 text-[10px]">{p.subject} • {p.total_marks} Marks</div>
              </div>
              <button onClick={() => onLoadPaper(p)} className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg active:scale-95">
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
