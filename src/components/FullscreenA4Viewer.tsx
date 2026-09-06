import React from 'react';
import { X, Download } from 'lucide-react';
import type { QuestionPaper } from '../types/schema';
import type { PaperCustomization } from '../types/style';
import { PrintSheet } from './PrintSheet';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper;
  customization: PaperCustomization;
  previewMode: 'paper' | 'marking_scheme';
  activeSet: string;
  onDownloadPdf: () => void;
}

export const FullscreenA4Viewer: React.FC<Props> = ({
  isOpen,
  onClose,
  paper,
  customization,
  previewMode,
  activeSet,
  onDownloadPdf
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col no-print">
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xs shadow-md">
            A4
          </div>
          <div>
            <h2 className="text-xs font-bold leading-tight truncate max-w-[180px] sm:max-w-xs">
              {paper.metadata.title} (Set {activeSet})
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Physical Print Preview • A4 Dimensions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onDownloadPdf}
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md active:scale-95 transition"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Reader Desk Background — width now matches the main preview (794px)
          so the page keeps its correct A4 shape instead of getting squeezed
          into the old 672px (max-w-2xl) box. */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-900/60">
        <div className="w-full max-w-[794px]">
          <PrintSheet
            paper={paper}
            customization={customization}
            previewMode={previewMode}
            activeSet={activeSet}
          />
        </div>
      </div>
    </div>
  );
};
