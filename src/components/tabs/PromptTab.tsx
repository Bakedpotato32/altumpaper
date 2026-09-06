import React from 'react';
import { Plus, Minus, Trash2, Check, Copy, Zap, RefreshCw } from 'lucide-react';
import type { PromptConfig, BlueprintSection } from '../../utils/promptGenerator';

const EXAM_PRESETS = [
  "Class Test", "Unit Test", "Weekly Test", "Monthly Test",
  "Mid-Term", "Half-Yearly", "Pre-Board", "Annual Examination",
  "Practice Paper", "Revision Paper", "Custom Exam"
];

interface Props {
  promptConfig: PromptConfig;
  setPromptConfig: React.Dispatch<React.SetStateAction<PromptConfig>>;
  promptCalculatedTotal: number;
  copied: boolean;
  onCopyPrompt: () => void;
  autoBalanceBlueprintToTarget: (target: number) => void;
  handleQuickMarkSelect: (marks: number, duration: number) => void;
  syncTargetToSections: () => void;
  handleAddSectionWithPreset: (name: string, type: string, count: number, marksEach: number) => void;
}

export const PromptTab: React.FC<Props> = ({
  promptConfig,
  setPromptConfig,
  promptCalculatedTotal,
  copied,
  onCopyPrompt,
  autoBalanceBlueprintToTarget,
  handleQuickMarkSelect,
  syncTargetToSections,
  handleAddSectionWithPreset
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-extrabold text-slate-900">AI Prompt Generator</h2>
          <p className="text-xs text-slate-500 font-medium">
            Tap any mark to auto-balance, or adjust questions and points directly!
          </p>
        </div>

        {/* QUICK BLUEPRINT PRESETS */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Quick Blueprints</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickMarkSelect(20, 45)}
              className="py-2.5 px-2 rounded-2xl bg-sky-50 text-sky-800 border border-sky-200 text-center active:scale-95 transition"
            >
              <div className="text-xs font-black">20 Marks</div>
              <div className="text-[9px] text-sky-600 font-medium">Quick Test (45m)</div>
            </button>
            <button
              onClick={() => handleQuickMarkSelect(40, 90)}
              className="py-2.5 px-2 rounded-2xl bg-indigo-50 text-indigo-800 border border-indigo-200 text-center active:scale-95 transition"
            >
              <div className="text-xs font-black">40 Marks</div>
              <div className="text-[9px] text-indigo-600 font-medium">Unit Test (90m)</div>
            </button>
            <button
              onClick={() => handleQuickMarkSelect(80, 180)}
              className="py-2.5 px-2 rounded-2xl bg-purple-50 text-purple-800 border border-purple-200 text-center active:scale-95 transition"
            >
              <div className="text-xs font-black">80 Marks</div>
              <div className="text-[9px] text-purple-600 font-medium">Board Exam (3h)</div>
            </button>
          </div>
        </div>

        {/* QUICK TARGET CHIPS */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Target Marks (1-Tap Auto-Balance)</label>
            <span className="text-[10px] font-bold text-blue-600">Tap to auto-balance</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { m: 10, d: 25 },
              { m: 20, d: 45 },
              { m: 25, d: 60 },
              { m: 30, d: 60 },
              { m: 40, d: 90 },
              { m: 50, d: 120 },
              { m: 70, d: 180 },
              { m: 80, d: 180 },
              { m: 100, d: 180 }
            ].map((item) => (
              <button
                key={item.m}
                onClick={() => handleQuickMarkSelect(item.m, item.d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 ${
                  promptConfig.totalMarks === item.m
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.m}M
              </button>
            ))}
          </div>
        </div>

        {/* EXAM PARAMETERS */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
          <div className="col-span-2">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Exam Type</label>
            <select
              value={promptConfig.examType}
              onChange={(e) => setPromptConfig({ ...promptConfig, examType: e.target.value })}
              className="w-full mt-1 p-2 text-xs font-bold bg-white border border-slate-200 rounded-xl"
            >
              {EXAM_PRESETS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Target Total Marks</label>
            <input
              type="number"
              value={promptConfig.totalMarks === 0 ? '' : promptConfig.totalMarks}
              placeholder="40"
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setPromptConfig({ ...promptConfig, totalMarks: val });
              }}
              className="w-full mt-1 p-2 text-xs font-black text-blue-600 bg-white border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase">Duration (Minutes)</label>
            <input
              type="number"
              value={promptConfig.durationMinutes === 0 ? '' : promptConfig.durationMinutes}
              placeholder="90"
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setPromptConfig({ ...promptConfig, durationMinutes: val });
              }}
              className="w-full mt-1 p-2 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-blue-500"
            />
          </div>
        </div>

        {/* SCHOOL & CLASS METADATA */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-slate-700">School / Coaching Name</label>
            <input
              type="text"
              value={promptConfig.schoolName}
              onChange={(e) => setPromptConfig({ ...promptConfig, schoolName: e.target.value })}
              placeholder="e.g. WINNER'S ACADEMY"
              className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">Class</label>
            <input
              type="text"
              value={promptConfig.grade}
              onChange={(e) => setPromptConfig({ ...promptConfig, grade: e.target.value })}
              className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500">Subject</label>
            <input
              type="text"
              value={promptConfig.subject}
              onChange={(e) => setPromptConfig({ ...promptConfig, subject: e.target.value })}
              className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[11px] font-bold text-slate-500">Chapters / Topics</label>
            <input
              type="text"
              value={promptConfig.chapters}
              onChange={(e) => setPromptConfig({ ...promptConfig, chapters: e.target.value })}
              className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-blue-500"
            />
          </div>
        </div>

        {/* BLUEPRINT SECTIONS */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
            <div>
              <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
                Sections Breakdown
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Sections Sum: <strong className={promptCalculatedTotal === promptConfig.totalMarks ? 'text-emerald-600' : 'text-amber-600'}>{promptCalculatedTotal} Marks</strong>
              </span>
            </div>

            {promptCalculatedTotal !== promptConfig.totalMarks && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => autoBalanceBlueprintToTarget(promptConfig.totalMarks)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-sm active:scale-95 transition"
                >
                  <Zap size={12} />
                  <span>Auto-Balance Sections to {promptConfig.totalMarks}M</span>
                </button>

                <button
                  onClick={syncTargetToSections}
                  className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold active:scale-95 transition"
                >
                  <RefreshCw size={11} />
                  <span>Set Target = {promptCalculatedTotal}M</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {promptConfig.sections.map((sec, idx) => (
              <div key={sec.id || idx} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={sec.name}
                    onChange={(e) => {
                      const updated = [...promptConfig.sections];
                      updated[idx].name = e.target.value;
                      setPromptConfig({ ...promptConfig, sections: updated });
                    }}
                    className="font-black text-xs text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-xl">
                      {sec.count} Qs × {sec.marksEach}m = {sec.count * sec.marksEach} Marks
                    </span>
                    <button
                      onClick={() => {
                        const updated = [...promptConfig.sections];
                        updated.splice(idx, 1);
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-extrabold text-slate-400 block uppercase mb-1">Question Type</label>
                  <select
                    value={sec.type}
                    onChange={(e) => {
                      const updated = [...promptConfig.sections];
                      updated[idx].type = e.target.value;
                      setPromptConfig({ ...promptConfig, sections: updated });
                    }}
                    className="w-full text-xs font-bold p-2 bg-white border border-slate-200 rounded-xl"
                  >
                    <option value="mcq">MCQ (Multiple Choice)</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="long_answer">Long Answer</option>
                    <option value="match_the_following">Match The Following</option>
                    <option value="assertion_reasoning">Assertion & Reasoning</option>
                    <option value="case_study">Case Study / Passage</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase">Question Count</label>
                    <div className="flex gap-1">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          onClick={() => {
                            const updated = [...promptConfig.sections];
                            updated[idx].count = num;
                            setPromptConfig({ ...promptConfig, sections: updated });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            sec.count === num ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => {
                        const updated = [...promptConfig.sections];
                        updated[idx].count = Math.max(1, updated[idx].count - 1);
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={sec.count === 0 ? '' : sec.count}
                      placeholder="1"
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(1, Number(e.target.value));
                        const updated = [...promptConfig.sections];
                        updated[idx].count = val;
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="flex-1 text-center font-black text-sm text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = [...promptConfig.sections];
                        updated[idx].count += 1;
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase">Marks Per Question</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((m) => (
                        <button
                          key={m}
                          onClick={() => {
                            const updated = [...promptConfig.sections];
                            updated[idx].marksEach = m;
                            setPromptConfig({ ...promptConfig, sections: updated });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sec.marksEach === m ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200 rounded-xl p-1">
                    <button
                      onClick={() => {
                        const updated = [...promptConfig.sections];
                        updated[idx].marksEach = Math.max(1, updated[idx].marksEach - 1);
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={sec.marksEach === 0 ? '' : sec.marksEach}
                      placeholder="1"
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(1, Number(e.target.value));
                        const updated = [...promptConfig.sections];
                        updated[idx].marksEach = val;
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="flex-1 text-center font-black text-sm text-slate-800 bg-transparent focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const updated = [...promptConfig.sections];
                        updated[idx].marksEach += 1;
                        setPromptConfig({ ...promptConfig, sections: updated });
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Quick Add Section Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => handleAddSectionWithPreset('MCQs', 'mcq', 5, 1)}
                className="py-1.5 px-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-200 hover:bg-blue-100 active:scale-95 transition"
              >
                + MCQ (1m)
              </button>
              <button
                onClick={() => handleAddSectionWithPreset('Short I', 'short_answer', 4, 2)}
                className="py-1.5 px-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 hover:bg-indigo-100 active:scale-95 transition"
              >
                + Short (2m)
              </button>
              <button
                onClick={() => handleAddSectionWithPreset('Short II', 'short_answer', 3, 3)}
                className="py-1.5 px-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 hover:bg-purple-100 active:scale-95 transition"
              >
                + Short (3m)
              </button>
              <button
                onClick={() => handleAddSectionWithPreset('Long', 'long_answer', 2, 5)}
                className="py-1.5 px-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 hover:bg-rose-100 active:scale-95 transition"
              >
                + Long (5m)
              </button>
            </div>
          </div>
        </div>

        {/* DIFFICULTY & FOCUS */}
        <div className="space-y-2 pt-2">
          <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Difficulty & Focus</label>
          <div className="flex gap-2">
            {(['easy', 'balanced', 'hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setPromptConfig({ ...promptConfig, difficulty: lvl })}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                  promptConfig.difficulty === lvl 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={promptConfig.includeDiagrams}
                onChange={(e) => setPromptConfig({ ...promptConfig, includeDiagrams: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-[11px] font-medium text-slate-700">Include Diagrams</span>
            </label>
            <label className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={promptConfig.includeAnswerKey}
                onChange={(e) => setPromptConfig({ ...promptConfig, includeAnswerKey: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="text-[11px] font-medium text-slate-700">Include Answers</span>
            </label>
          </div>
        </div>

        {/* COPY PROMPT BUTTON */}
        <button
          onClick={onCopyPrompt}
          className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20 active:scale-95 transition"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? "Copied Prompt to Clipboard!" : "Copy Formatted AI Prompt"}</span>
        </button>
      </div>
    </div>
  );
};
