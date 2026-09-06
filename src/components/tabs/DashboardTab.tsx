import React from 'react';
import { Edit3, Sparkles, Bookmark, Eye, Upload, ChevronRight } from 'lucide-react';
import type { QuestionPaper } from '../../types/schema';

interface Props {
  paper: QuestionPaper;
  totalAllocatedMarks: number;
  bankQuestionsCount: number;
  onNavigate: (tab: 'editor' | 'prompt' | 'import' | 'bank' | 'preview') => void;
}

export const DashboardTab: React.FC<Props> = ({
  paper,
  totalAllocatedMarks,
  bankQuestionsCount,
  onNavigate
}) => {
  return (
    <div className="space-y-4">
      {/* Active Exam Status Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-blue-500/15 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white">
            Active Draft
          </span>
          <span className="text-xs font-semibold text-white/80">
            {paper.metadata.class_grade}th • {paper.metadata.subject}
          </span>
        </div>
        <h2 className="text-lg font-black mt-2 leading-tight">{paper.metadata.title}</h2>
        <div className="mt-4 flex items-center justify-between text-xs font-semibold bg-white/10 backdrop-blur-md px-3 py-2 rounded-2xl">
          <span>Target: {paper.metadata.total_marks}M</span>
          <span className={totalAllocatedMarks === paper.metadata.total_marks ? 'text-emerald-300' : 'text-amber-300'}>
            Allocated: {totalAllocatedMarks} Marks
          </span>
        </div>
      </div>

      {/* Prominent Import JSON Banner */}
      <button
        onClick={() => onNavigate('import')}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-4 text-left text-white shadow-lg shadow-purple-500/20 active:scale-[0.98] transition flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
            <Upload size={20} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-sm leading-tight">Import AI JSON</h3>
              <span className="bg-white/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Fast</span>
            </div>
            <p className="text-[11px] text-white/80 font-medium mt-0.5">
              Paste raw JSON from ChatGPT, Claude, or Gemini
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-white/70" />
      </button>

      {/* Grid of Studio Cards */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => onNavigate('editor')}
          className="bg-gradient-to-br from-sky-400 to-blue-600 rounded-3xl p-4 text-left text-white shadow-lg shadow-sky-500/20 active:scale-[0.98] transition flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Edit3 size={18} />
            </div>
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
              SECTIONS
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-tight">Visual Editor</h3>
            <p className="text-[10px] text-white/80 font-medium mt-0.5">
              {paper.sections.length} Sections • Diagrams
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('prompt')}
          className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-3xl p-4 text-left text-white shadow-lg shadow-rose-500/20 active:scale-[0.98] transition flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles size={18} />
            </div>
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
              AI GEN
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-tight">Prompt Builder</h3>
            <p className="text-[10px] text-white/80 font-medium mt-0.5">
              Full Blueprints
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('bank')}
          className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-4 text-left text-white shadow-lg shadow-amber-500/20 active:scale-[0.98] transition flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Bookmark size={18} />
            </div>
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
              BANK
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-tight">Question Bank</h3>
            <p className="text-[10px] text-white/80 font-medium mt-0.5">
              {bankQuestionsCount} Questions Saved
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigate('preview')}
          className="bg-gradient-to-br from-cyan-400 to-teal-600 rounded-3xl p-4 text-left text-white shadow-lg shadow-teal-500/20 active:scale-[0.98] transition flex flex-col justify-between h-36"
        >
          <div className="flex items-center justify-between w-full">
            <div className="w-9 h-9 rounded-2xl bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Eye size={18} />
            </div>
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold uppercase">
              PRINT
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm leading-tight">A4 Preview</h3>
            <p className="text-[10px] text-white/80 font-medium mt-0.5">
              Real A4 Sheet & PDF
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
