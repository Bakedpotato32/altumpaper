import React from 'react';
import { 
  CheckCircle2, AlertCircle, Trash2, Bookmark, Plus, Star, 
  Image as ImageIcon, ArrowRight, RefreshCw 
} from 'lucide-react';
import type { QuestionPaper, Question } from '../../types/schema';
import { MathText } from '../MathText';

interface Props {
  paper: QuestionPaper;
  setPaper: React.Dispatch<React.SetStateAction<QuestionPaper>>;
  totalAllocatedMarks: number;
  handleAddSection: () => void;
  handleRemoveSection: (secIdx: number) => void;
  handleAddQuestion: (secIdx: number, type?: Question['type']) => void;
  handleRemoveQuestion: (secIdx: number, qIdx: number) => void;
  handleSaveToBank: (q: Question) => void;
  onOpenBankModal: (secIdx: number) => void;
  onTriggerUpload: (secIdx: number, qIdx: number) => void;
  showToast: (msg: string) => void;
}

export const EditorTab: React.FC<Props> = ({
  paper,
  setPaper,
  totalAllocatedMarks,
  handleAddSection,
  handleRemoveSection,
  handleAddQuestion,
  handleRemoveQuestion,
  handleSaveToBank,
  onOpenBankModal,
  onTriggerUpload,
  showToast
}) => {
  const targetMarks = paper.metadata.total_marks || 0;
  const percentage = targetMarks > 0 ? Math.min(100, Math.round((totalAllocatedMarks / targetMarks) * 100)) : 0;
  const isBalanced = totalAllocatedMarks === targetMarks;
  const isOver = totalAllocatedMarks > targetMarks;
  const diff = Math.abs(targetMarks - totalAllocatedMarks);

  return (
    <div className="space-y-4">
      {/* POLISHED EXAM COMPLETION PROGRESS CARD */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isBalanced 
          ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900' 
          : isOver
            ? 'bg-rose-500/10 border-rose-300 text-rose-900'
            : 'bg-white/90 border-slate-200 text-slate-800 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isBalanced ? (
              <CheckCircle2 size={16} className="text-emerald-600" />
            ) : isOver ? (
              <AlertCircle size={16} className="text-rose-600" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            )}
            <span className="text-xs font-black uppercase tracking-wider">
              {isBalanced ? 'Exam Blueprint Complete' : isOver ? 'Marks Over-Allocated' : 'Drafting Progress'}
            </span>
          </div>

          <span className="text-xs font-black">
            {totalAllocatedMarks} / {targetMarks} Marks ({percentage}%)
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div 
            style={{ width: `${percentage}%` }}
            className={`h-full transition-all duration-300 ${
              isBalanced ? 'bg-emerald-500' : isOver ? 'bg-rose-500' : 'bg-blue-600'
            }`}
          />
        </div>

        <div className="flex justify-between items-center text-[11px] font-medium">
          <span>
            {isBalanced ? (
              'All marks accounted for.'
            ) : isOver ? (
              <span className="text-rose-600 font-bold">Exceeded by {diff} Marks</span>
            ) : (
              <span className="text-slate-500">Need <strong>{diff} more Marks</strong> to complete paper</span>
            )}
          </span>

          {!isBalanced && (
            <button
              onClick={() => {
                setPaper(prev => ({
                  ...prev,
                  metadata: { ...prev.metadata, total_marks: totalAllocatedMarks }
                }));
                showToast(`Target marks updated to ${totalAllocatedMarks}M!`);
              }}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <RefreshCw size={10} />
              <span>Set target to {totalAllocatedMarks}M</span>
            </button>
          )}
        </div>
      </div>

      {/* EXAM PARAMETERS */}
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Exam Parameters</h2>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500">School / Coaching Name</label>
            <input
              type="text"
              value={paper.metadata.school_name}
              onChange={(e) => setPaper({ ...paper, metadata: { ...paper.metadata, school_name: e.target.value } })}
              className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-500">Subject</label>
              <input
                type="text"
                value={paper.metadata.subject}
                onChange={(e) => setPaper({ ...paper, metadata: { ...paper.metadata, subject: e.target.value } })}
                className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500">Total Marks</label>
              <input
                type="number"
                value={paper.metadata.total_marks === 0 ? '' : paper.metadata.total_marks}
                placeholder="40"
                onChange={(e) => {
                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                  setPaper({ ...paper, metadata: { ...paper.metadata, total_marks: val } });
                }}
                className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 focus:bg-white focus:outline-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS & QUESTIONS */}
      {paper.sections.map((sec, secIdx) => (
        <div key={sec.id || secIdx} className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={sec.name}
                onChange={(e) => {
                  const updated = [...paper.sections];
                  updated[secIdx].name = e.target.value;
                  setPaper({ ...paper, sections: updated });
                }}
                className="font-black text-sm text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {sec.questions.reduce((a, q) => a + (Number(q.marks) || 0), 0)} Marks
                </span>
                <button
                  onClick={() => handleRemoveSection(secIdx)}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-xl">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sec.is_compulsory}
                  onChange={(e) => {
                    const updated = [...paper.sections];
                    updated[secIdx].is_compulsory = e.target.checked;
                    setPaper({ ...paper, sections: updated });
                  }}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] font-semibold text-slate-600">All Compulsory</span>
              </label>

              {!sec.is_compulsory && (
                <div className="flex items-center space-x-1 text-[11px] text-slate-600">
                  <span>Attempt any:</span>
                  <input
                    type="number"
                    value={sec.attempt_count === 0 ? '' : (sec.attempt_count || '')}
                    placeholder="1"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                      const updated = [...paper.sections];
                      updated[secIdx].attempt_count = val;
                      setPaper({ ...paper, sections: updated });
                    }}
                    className="w-10 px-1 py-0.5 bg-white border border-slate-200 rounded text-center font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {sec.questions.map((q, qIdx) => (
              <div key={q.id || qIdx} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/60 space-y-2.5 overflow-hidden">
                <div className="flex items-center justify-between gap-1.5 flex-nowrap">
                  <div className="flex items-center space-x-1.5 min-w-0 flex-1">
                    <span className="font-extrabold text-[11px] bg-blue-600 text-white px-2 py-1 rounded-lg shrink-0 shadow-sm">
                      Q{q.number}
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        const newType = e.target.value as any;
                        updated[secIdx].questions[qIdx].type = newType;
                        if ((newType === 'mcq' || newType === 'assertion_reasoning') && !updated[secIdx].questions[qIdx].options) {
                          updated[secIdx].questions[qIdx].options = ["Option A", "Option B", "Option C", "Option D"];
                        } else if (newType === 'match_the_following' && !updated[secIdx].questions[qIdx].match_pairs) {
                          updated[secIdx].questions[qIdx].match_pairs = [{ left: "Item 1", right: "Match 1" }, { left: "Item 2", right: "Match 2" }];
                        } else if (newType === 'case_study' && !updated[secIdx].questions[qIdx].subquestions) {
                          updated[secIdx].questions[qIdx].passage = "Reading context...";
                          updated[secIdx].questions[qIdx].subquestions = [{ number: "i", text: "Sub-question 1", marks: 1 }];
                        }
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="text-[10px] font-bold bg-white border border-slate-200 rounded-xl px-2 py-1 uppercase text-slate-700 truncate min-w-0 flex-1 focus:outline-none"
                    >
                      <option value="short_answer">Short Answer</option>
                      <option value="long_answer">Long Answer</option>
                      <option value="mcq">MCQ</option>
                      <option value="true_false">True / False</option>
                      <option value="match_the_following">Match Pairs</option>
                      <option value="assertion_reasoning">Assertion</option>
                      <option value="case_study">Case Study</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleSaveToBank(q)}
                      title="Save to Question Bank"
                      className="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 active:scale-95 transition"
                    >
                      <Bookmark size={13} />
                    </button>

                    <div className="flex items-center bg-white border border-slate-200 rounded-xl px-1.5 py-0.5 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Marks</span>
                      <input
                        type="number"
                        value={q.marks === 0 ? '' : q.marks}
                        placeholder="1"
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : Number(e.target.value);
                          const updated = [...paper.sections];
                          updated[secIdx].questions[qIdx].marks = val;
                          setPaper({ ...paper, sections: updated });
                        }}
                        className="w-8 text-xs text-center font-black bg-transparent focus:outline-none"
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveQuestion(secIdx, qIdx)}
                      className="p-1.5 text-red-400 hover:text-red-600 active:scale-95 transition"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={q.text}
                  onChange={(e) => {
                    const updated = [...paper.sections];
                    updated[secIdx].questions[qIdx].text = e.target.value;
                    setPaper({ ...paper, sections: updated });
                  }}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:outline-blue-500"
                  placeholder="Question statement (KaTeX: $E = mc^2$)"
                />

                <div className="p-2 bg-white rounded-xl border border-slate-100 text-xs">
                  <span className="text-[9px] font-black text-slate-400 uppercase block mb-0.5">MATH PREVIEW</span>
                  <MathText content={q.text} />
                </div>

                {/* DIAGRAM ATTACHMENT */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    <ImageIcon size={13} /> Diagram / Image
                  </span>
                  {q.image_url ? (
                    <button
                      onClick={() => {
                        const updated = [...paper.sections];
                        delete updated[secIdx].questions[qIdx].image_url;
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="text-[10px] text-red-500 font-bold"
                    >
                      Remove Diagram
                    </button>
                  ) : (
                    <button
                      onClick={() => onTriggerUpload(secIdx, qIdx)}
                      className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg active:scale-95"
                    >
                      + Attach Image
                    </button>
                  )}
                </div>

                {q.image_url && (
                  <div className="space-y-1">
                    <img
                      src={q.image_url}
                      alt="Diagram"
                      className="max-h-36 rounded-lg object-contain bg-slate-50 border border-slate-100 mx-auto"
                    />
                    <input
                      type="text"
                      placeholder="Diagram caption (e.g. Fig 1.2: Ray diagram)"
                      value={q.image_caption || ''}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        updated[secIdx].questions[qIdx].image_caption = e.target.value;
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded focus:bg-white"
                    />
                  </div>
                )}

                {/* OPTIONS FOR MCQ */}
                {(q.type === 'mcq' || q.type === 'assertion_reasoning' || q.type === 'true_false') && q.options && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Options:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-black text-slate-400">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...paper.sections];
                              updated[secIdx].questions[qIdx].options![optIdx] = e.target.value;
                              setPaper({ ...paper, sections: updated });
                            }}
                            className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:outline-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MATCH PAIRS */}
                {q.type === 'match_the_following' && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Match Pairs:</span>
                    {(q.match_pairs || []).map((pair, pIdx) => (
                      <div key={pIdx} className="grid grid-cols-2 gap-2 items-center">
                        <input
                          type="text"
                          value={pair.left}
                          placeholder={`Column I (${pIdx + 1})`}
                          onChange={(e) => {
                            const updated = [...paper.sections];
                            updated[secIdx].questions[qIdx].match_pairs![pIdx].left = e.target.value;
                            setPaper({ ...paper, sections: updated });
                          }}
                          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium focus:bg-white"
                        />
                        <input
                          type="text"
                          value={pair.right}
                          placeholder={`Column II (${String.fromCharCode(97 + pIdx)})`}
                          onChange={(e) => {
                            const updated = [...paper.sections];
                            updated[secIdx].questions[qIdx].match_pairs![pIdx].right = e.target.value;
                            setPaper({ ...paper, sections: updated });
                          }}
                          className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium focus:bg-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const updated = [...paper.sections];
                        const currentPairs = updated[secIdx].questions[qIdx].match_pairs || [];
                        updated[secIdx].questions[qIdx].match_pairs = [
                          ...currentPairs,
                          { left: "Item", right: "Match" }
                        ];
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="text-[10px] text-blue-600 font-bold"
                    >
                      + Add Match Pair
                    </button>
                  </div>
                )}

                {/* CASE STUDY */}
                {q.type === 'case_study' && (
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Passage / Reading Context:</span>
                    <textarea
                      rows={3}
                      value={q.passage || ''}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        updated[secIdx].questions[qIdx].passage = e.target.value;
                        setPaper({ ...paper, sections: updated });
                      }}
                      placeholder="Enter passage context..."
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white"
                    />

                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sub-Questions:</span>
                    {(q.subquestions || []).map((sub, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">({sub.number})</span>
                        <input
                          type="text"
                          value={sub.text}
                          onChange={(e) => {
                            const updated = [...paper.sections];
                            updated[secIdx].questions[qIdx].subquestions![sIdx].text = e.target.value;
                            setPaper({ ...paper, sections: updated });
                          }}
                          className="flex-1 p-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white"
                        />
                        <input
                          type="number"
                          value={sub.marks === 0 ? '' : sub.marks}
                          placeholder="1"
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            const updated = [...paper.sections];
                            updated[secIdx].questions[qIdx].subquestions![sIdx].marks = val;
                            setPaper({ ...paper, sections: updated });
                          }}
                          className="w-10 p-1 text-xs text-center border border-slate-200 rounded font-bold focus:bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* ANSWER & RUBRIC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-0.5">Expected Answer / Key</label>
                    <input
                      type="text"
                      placeholder="Correct Answer"
                      value={q.answer || ''}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        updated[secIdx].questions[qIdx].answer = e.target.value;
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="w-full p-2 text-xs bg-emerald-50/50 border border-emerald-200 rounded-lg focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Step-wise Marking Rubric</label>
                    <input
                      type="text"
                      placeholder="Step 1: 1m, Step 2: 1m"
                      value={q.solution || ''}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        updated[secIdx].questions[qIdx].solution = e.target.value;
                        setPaper({ ...paper, sections: updated });
                      }}
                      className="w-full p-2 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:bg-white"
                    />
                  </div>
                </div>

                {/* PAGE BREAK CONTROL */}
                <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">Pagination:</span>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.page_break_after || false}
                      onChange={(e) => {
                        const updated = [...paper.sections];
                        updated[secIdx].questions[qIdx].page_break_after = e.target.checked;
                        setPaper({ ...paper, sections: updated });
                        showToast(e.target.checked ? `Page break set after Q${q.number}` : "Page break removed");
                      }}
                      className="rounded text-blue-600"
                    />
                    <span className="text-[10px] font-bold text-slate-600">Break to Next Page after Q{q.number}</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleAddQuestion(secIdx, 'short_answer')}
              className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl text-xs font-bold flex items-center justify-center space-x-1.5"
            >
              <Plus size={14} />
              <span>Add Question</span>
            </button>
            <button
              onClick={() => handleAddQuestion(secIdx, 'mcq')}
              className="px-3 py-2.5 bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold"
            >
              + MCQ
            </button>
            <button
              onClick={() => onOpenBankModal(secIdx)}
              className="px-3 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl text-xs font-bold flex items-center space-x-1"
            >
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>From Bank</span>
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={handleAddSection}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl text-xs font-bold flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20"
      >
        <Plus size={16} />
        <span>Create New Section</span>
      </button>
    </div>
  );
};
