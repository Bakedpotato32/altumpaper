import React from 'react';
import { Trash2 } from 'lucide-react';
import { MathText } from '../MathText';
import type { BankQuestion } from '../../utils/db';

interface Props {
  bankQuestions: BankQuestion[];
  onDeleteQuestion: (id: number) => void;
}

export const BankTab: React.FC<Props> = ({
  bankQuestions,
  onDeleteQuestion
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900">Question Bank ({bankQuestions.length})</h2>
        <div className="divide-y divide-slate-100">
          {bankQuestions.map((bq) => (
            <div key={bq.id} className="py-2.5 space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-blue-600 uppercase">{bq.type} [{bq.marks}M]</span>
                <button onClick={() => bq.id && onDeleteQuestion(bq.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="text-xs text-slate-800">
                <MathText content={bq.text} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
