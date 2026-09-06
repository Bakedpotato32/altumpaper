import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Upload, Save, Download, Maximize2, ZoomIn, ZoomOut,
  Shuffle, Sliders
} from 'lucide-react';
import type { QuestionPaper, Section, Question } from './types/schema';
import { db } from './utils/db';
import type { SavedPaper, BankQuestion } from './utils/db';
import { sanitizeAndValidateJSON } from './utils/jsonValidator';
import { buildAIPrompt } from './utils/promptGenerator';
import type { PromptConfig, BlueprintSection } from './utils/promptGenerator';
import { generateShuffledSet } from './utils/setRandomizer';
import { DEFAULT_STYLE, PaperCustomization } from './types/style';
import { StyleCustomizer } from './components/StyleCustomizer';
import { PrintSheet } from './components/PrintSheet';
import { downloadPaperAsPdf } from './utils/pdfDownloader';

// Modular Tab Components
import { DashboardTab } from './components/tabs/DashboardTab';
import { EditorTab } from './components/tabs/EditorTab';
import { PromptTab } from './components/tabs/PromptTab';
import { ImportTab } from './components/tabs/ImportTab';
import { BankTab } from './components/tabs/BankTab';
import { SavedTab } from './components/tabs/SavedTab';
import { Navbar } from './components/Navbar';

const DEFAULT_PAPER: QuestionPaper = {
  schema_version: "1.1",
  metadata: {
    title: "Science Periodic Assessment",
    school_name: "WINNER'S ACADEMY",
    class_grade: "10",
    subject: "Science",
    exam_type: "Unit Test",
    academic_year: "2026-2027",
    duration_minutes: 90,
    total_marks: 40,
    general_instructions: [
      "All questions are compulsory unless stated otherwise.",
      "Section A consists of Objective Questions carrying 1 mark each.",
      "Section B contains Match the Following and Short Answer Questions."
    ]
  },
  sections: [
    {
      id: "sec-1",
      name: "SECTION A (OBJECTIVE)",
      instructions: "All questions are compulsory",
      total_marks: 5,
      is_compulsory: true,
      questions: [
        {
          id: "q1",
          number: 1,
          type: "mcq",
          marks: 1,
          text: "What is the chemical formula of rust?",
          options: ["$Fe_2O_3 \\cdot xH_2O$", "$FeO$", "$Fe_3O_4$", "$Fe(OH)_3$"],
          answer: "$Fe_2O_3 \\cdot xH_2O$",
          solution: "Rust is hydrated iron(III) oxide with the formula Fe2O3.xH2O.",
          difficulty: "easy"
        }
      ]
    },
    {
      id: "sec-2",
      name: "SECTION B (MATCH & SHORT)",
      instructions: "Answer all questions",
      total_marks: 15,
      is_compulsory: true,
      questions: [
        {
          id: "q2",
          number: 2,
          type: "match_the_following",
          marks: 3,
          text: "Match Column I with Column II correctly:",
          match_pairs: [
            { left: "Bleaching Powder", right: "$CaOCl_2$" },
            { left: "Baking Soda", right: "$NaHCO_3$" },
            { left: "Washing Soda", right: "$Na_2CO_3 \\cdot 10H_2O$" }
          ],
          answer: "1 -> CaOCl2, 2 -> NaHCO3, 3 -> Na2CO3.10H2O",
          solution: "Each correct match awards 1 mark.",
          difficulty: "medium"
        }
      ]
    }
  ]
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'editor' | 'prompt' | 'import' | 'preview' | 'bank' | 'saved'>('home');
  const [paper, setPaper] = useState<QuestionPaper>(DEFAULT_PAPER);
  const [currentPaperId, setCurrentPaperId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);

  const [customization, setCustomization] = useState<PaperCustomization>(DEFAULT_STYLE);
  const [showStylePanel, setShowStylePanel] = useState(false);

  const [activeSet, setActiveSet] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [generatedSets, setGeneratedSets] = useState<Record<string, QuestionPaper>>({});
  const [previewMode, setPreviewMode] = useState<'paper' | 'marking_scheme'>('paper');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ secIdx: number; qIdx: number } | null>(null);

  const [promptConfig, setPromptConfig] = useState<PromptConfig>({
    schoolName: "WINNER'S ACADEMY",
    grade: "10",
    subject: "Science",
    chapters: "Chemical Reactions, Acids Bases & Salts",
    examType: "Unit Test",
    totalMarks: 40,
    durationMinutes: 90,
    difficulty: 'balanced',
    strictlyTextbook: true,
    includeDiagrams: true,
    includeAnswerKey: true,
    sections: [
      { id: '1', name: 'Section A', type: 'mcq', count: 10, marksEach: 1 },
      { id: '2', name: 'Section B', type: 'short_answer', count: 5, marksEach: 2 },
      { id: '3', name: 'Section C', type: 'long_answer', count: 4, marksEach: 5 }
    ]
  });

  const savedPapers = useLiveQuery(() => db.papers.orderBy('updatedAt').reverse().toArray());
  const bankQuestions = useLiveQuery(() => db.questionBank.orderBy('createdAt').reverse().toArray());

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const currentViewPaper: QuestionPaper = activeSet === 'A' 
    ? paper 
    : (generatedSets[activeSet] || paper);

  const totalAllocatedMarks = paper.sections.reduce(
    (acc, sec) => acc + sec.questions.reduce((qAcc, q) => qAcc + (Number(q.marks) || 0), 0),
    0
  );

  const promptCalculatedTotal = promptConfig.sections.reduce(
    (acc, s) => acc + (s.count * s.marksEach),
    0
  );

  // DYNAMIC BLUEPRINT AUTO-BALANCER (Accurate for 10M up to 100M+)
  const autoBalanceBlueprintToTarget = (target: number) => {
    const t = Math.max(5, target);
    let secs: BlueprintSection[] = [];

    if (t <= 15) {
      const mcqCount = Math.min(5, Math.max(1, Math.floor(t * 0.4)));
      const shortCount = Math.floor((t - mcqCount) / 2);
      const rem = t - (mcqCount + shortCount * 2);
      secs = [
        { id: '1', name: 'Section A (MCQ)', type: 'mcq', count: mcqCount + rem, marksEach: 1 },
        { id: '2', name: 'Section B (Short)', type: 'short_answer', count: Math.max(1, shortCount), marksEach: 2 }
      ];
    } else if (t <= 35) {
      const longCount = 1;
      const longMarks = t >= 25 ? 5 : 4;
      const rem = t - (longCount * longMarks);
      const mcqCount = Math.floor(rem * 0.4);
      const shortCount = Math.floor((rem - mcqCount) / 2);
      const extra = rem - (mcqCount + shortCount * 2);
      secs = [
        { id: '1', name: 'Section A (MCQ)', type: 'mcq', count: mcqCount + extra, marksEach: 1 },
        { id: '2', name: 'Section B (Short Answer)', type: 'short_answer', count: Math.max(1, shortCount), marksEach: 2 },
        { id: '3', name: 'Section C (Long Answer)', type: 'long_answer', count: longCount, marksEach: longMarks }
      ];
    } else if (t <= 60) {
      const mcqCount = Math.floor(t * 0.25);
      const short2m = Math.floor((t * 0.25) / 2);
      const long5m = Math.max(1, Math.floor((t * 0.25) / 5));
      const rem = t - (mcqCount * 1 + short2m * 2 + long5m * 5);
      const short3m = Math.floor(rem / 3);
      const extra = rem - (short3m * 3);
      secs = [
        { id: '1', name: 'Section A (Objective)', type: 'mcq', count: mcqCount + extra, marksEach: 1 },
        { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: short2m, marksEach: 2 },
        { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: Math.max(1, short3m), marksEach: 3 },
        { id: '4', name: 'Section D (Long Answer)', type: 'long_answer', count: long5m, marksEach: 5 }
      ];
    } else if (t < 90) {
      if (t === 80) {
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: 20, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: 6, marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: 7, marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: 3, marksEach: 5 },
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: 3, marksEach: 4 }
        ];
      } else {
        const mcqCount = Math.floor(t * 0.25);
        const caseStudy = 2;
        const long5m = 3;
        const rem = t - (mcqCount * 1 + caseStudy * 4 + long5m * 5);
        const short2m = Math.floor((rem * 0.45) / 2);
        const short3m = Math.floor((rem - short2m * 2) / 3);
        const extra = rem - (short2m * 2 + short3m * 3);
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: mcqCount + extra, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: short2m, marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: short3m, marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: long5m, marksEach: 5 },
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: caseStudy, marksEach: 4 }
        ];
      }
    } else {
      // 90 to 100+ Marks
      if (t === 100) {
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: 20, marksEach: 1 },       // 20M
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: 10, marksEach: 2 }, // 20M
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: 8, marksEach: 3 }, // 24M
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: 4, marksEach: 5 },     // 20M
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: 4, marksEach: 4 }  // 16M
        ]; // Total = 100M
      } else {
        const mcqCount = 20;
        const caseStudy = 4;
        const long5m = Math.max(3, Math.floor((t * 0.2) / 5));
        const rem = t - (mcqCount * 1 + caseStudy * 4 + long5m * 5);
        const short2m = Math.floor((rem * 0.45) / 2);
        const short3m = Math.floor((rem - short2m * 2) / 3);
        const extra = rem - (short2m * 2 + short3m * 3);
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: mcqCount + extra, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: short2m, marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: short3m, marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: long5m, marksEach: 5 },
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: caseStudy, marksEach: 4 }
        ];
      }
    }

    // Safety balance verification: guarantees Section A absorbs any remaining difference
    const currentSum = secs.reduce((acc, s) => acc + s.count * s.marksEach, 0);
    if (currentSum !== t && secs.length > 0) {
      secs[0].count += (t - currentSum);
    }

    setPromptConfig(prev => ({
      ...prev,
      totalMarks: target,
      sections: secs
    }));
    showToast(`⚡ Balanced sections to ${target} Marks!`);
  };

  const handleQuickMarkSelect = (marks: number, duration: number) => {
    setPromptConfig(prev => ({
      ...prev,
      totalMarks: marks,
      durationMinutes: duration
    }));
    autoBalanceBlueprintToTarget(marks);
  };

  const syncTargetToSections = () => {
    setPromptConfig(prev => ({
      ...prev,
      totalMarks: promptCalculatedTotal
    }));
    showToast(`Target set to ${promptCalculatedTotal} Marks!`);
  };

  const handleAddSectionWithPreset = (name: string, type: string, count: number, marksEach: number) => {
    const nextLetter = String.fromCharCode(65 + promptConfig.sections.length);
    const newSec: BlueprintSection = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Section ${nextLetter} (${name})`,
      type,
      count,
      marksEach
    };
    setPromptConfig(prev => ({
      ...prev,
      sections: [...prev.sections, newSec]
    }));
    showToast(`Added ${name} section`);
  };

  const handleDirectPdfDownload = async () => {
    setIsGeneratingPdf(true);
    showToast("Generating high-resolution A4 PDF file...");
    try {
      const sanitizedName = `${paper.metadata.title.replace(/\s+/g, '_')}_Class${paper.metadata.class_grade}_Set${activeSet}`;
      await downloadPaperAsPdf(sanitizedName);
      showToast("PDF saved to your Downloads folder!");
    } catch {
      showToast("Download failed. Check browser permissions.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateSets = () => {
    const setB = generateShuffledSet(paper, 'B');
    const setC = generateShuffledSet(paper, 'C');
    const setD = generateShuffledSet(paper, 'D');
    setGeneratedSets({ B: setB, C: setC, D: setD });
    showToast("Generated Sets A, B, C, and D!");
  };

  const handleSaveToBank = async (q: Question) => {
    const item: BankQuestion = {
      text: q.text,
      type: q.type,
      marks: q.marks,
      subject: paper.metadata.subject,
      class_grade: paper.metadata.class_grade,
      chapter: q.chapter,
      difficulty: q.difficulty || 'medium',
      options: q.options,
      match_pairs: q.match_pairs,
      passage: q.passage,
      subquestions: q.subquestions,
      image_url: q.image_url,
      answer: q.answer,
      solution: q.solution,
      isStarred: false,
      usedCount: 1,
      createdAt: new Date()
    };
    await db.questionBank.add(item);
    showToast("Saved to Question Bank!");
  };

  const handleCopyPrompt = () => {
    const prompt = buildAIPrompt(promptConfig);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    showToast("AI prompt copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportJSON = () => {
    setImportErrors([]);
    const res = sanitizeAndValidateJSON(importText);
    if (!res.success) {
      setImportErrors(res.errors || ["Failed to validate JSON."]);
      return;
    }
    if (res.data) {
      setPaper(res.data);
      setCurrentPaperId(null);
      setGeneratedSets({});
      setActiveSet('A');
      setActiveTab('editor');
      showToast(res.repaired ? "Imported with auto-repairs!" : "Paper imported cleanly!");
    }
  };

  const handleSaveToDatabase = async () => {
    const record: SavedPaper = {
      uuid: Math.random().toString(36).substring(2, 9),
      title: paper.metadata.title,
      subject: paper.metadata.subject,
      class_grade: paper.metadata.class_grade,
      total_marks: paper.metadata.total_marks,
      updatedAt: new Date(),
      data: paper
    };

    if (currentPaperId) {
      await db.papers.put({ ...record, id: currentPaperId });
      showToast("Updated existing paper!");
    } else {
      const id = await db.papers.add(record);
      setCurrentPaperId(Number(id));
      showToast("Saved as new paper!");
    }
  };

  const handleLoadPaper = (item: SavedPaper) => {
    setPaper(item.data);
    setCurrentPaperId(item.id || null);
    setGeneratedSets({});
    setActiveSet('A');
    setActiveTab('editor');
    showToast(`Loaded: ${item.title}`);
  };

  const handleAddSection = () => {
    const nextLetter = String.fromCharCode(65 + paper.sections.length);
    const newSection: Section = {
      id: Math.random().toString(36).substring(2, 9),
      name: `SECTION ${nextLetter}`,
      instructions: "Answer questions as directed",
      total_marks: 10,
      is_compulsory: true,
      questions: []
    };
    setPaper({ ...paper, sections: [...paper.sections, newSection] });
    showToast(`Added Section ${nextLetter}`);
  };

  const handleRemoveSection = (secIdx: number) => {
    if (paper.sections.length <= 1) {
      showToast("Paper must have at least one section.");
      return;
    }
    const updated = [...paper.sections];
    updated.splice(secIdx, 1);
    setPaper({ ...paper, sections: updated });
  };

  const handleAddQuestion = (secIdx: number, type: Question['type'] = 'short_answer') => {
    const nextNum = paper.sections.reduce((acc, s) => acc + s.questions.length, 0) + 1;
    let newQ: Question = {
      id: Math.random().toString(36).substring(2, 9),
      number: nextNum,
      type,
      marks: type === 'mcq' || type === 'true_false' ? 1 : 2,
      text: "New question statement with math like $x^2 + y^2 = r^2$",
      difficulty: "medium"
    };

    if (type === 'mcq' || type === 'assertion_reasoning') {
      newQ.options = ["Option A", "Option B", "Option C", "Option D"];
    } else if (type === 'true_false') {
      newQ.options = ["True", "False"];
    } else if (type === 'match_the_following') {
      newQ.match_pairs = [
        { left: "Item 1", right: "Match 1" },
        { left: "Item 2", right: "Match 2" }
      ];
    } else if (type === 'case_study') {
      newQ.passage = "Read the passage context here...";
      newQ.subquestions = [
        { number: "i", text: "Sub-question A", marks: 1 },
        { number: "ii", text: "Sub-question B", marks: 2 }
      ];
    }

    const newSections = [...paper.sections];
    newSections[secIdx].questions.push(newQ);
    setPaper({ ...paper, sections: newSections });
  };

  const handleRemoveQuestion = (secIdx: number, qIdx: number) => {
    const newSections = [...paper.sections];
    newSections[secIdx].questions.splice(qIdx, 1);
    setPaper({ ...paper, sections: newSections });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = [...paper.sections];
      updated[uploadTarget.secIdx].questions[uploadTarget.qIdx].image_url = dataUrl;
      setPaper({ ...paper, sections: updated });
      showToast("Diagram attached successfully!");
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans ${isFullscreenPreview ? 'p-0 pb-0' : 'pb-32'}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {notification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl transition-all border border-white/10">
          {notification}
        </div>
      )}

      {/* TOP BAR */}
      {!isFullscreenPreview && (
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-40 px-4 sm:px-5 py-3.5 flex items-center justify-between no-print shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
                ALTUM<span className="text-blue-600">CORE</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Exam Studio
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
                activeTab === 'import'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
              }`}
            >
              <Upload size={13} />
              <span>Import</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              disabled={isGeneratingPdf}
              onClick={handleDirectPdfDownload}
              className="flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isGeneratingPdf ? "Building..." : "PDF"}</span>
            </button>
          </div>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className={`flex-1 w-full mx-auto ${isFullscreenPreview ? 'p-0 max-w-none bg-slate-900' : 'max-w-lg px-4 pt-4'}`}>
        {activeTab === 'home' && (
          <DashboardTab
            paper={paper}
            totalAllocatedMarks={totalAllocatedMarks}
            bankQuestionsCount={bankQuestions?.length || 0}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'editor' && (
          <EditorTab
            paper={paper}
            setPaper={setPaper}
            totalAllocatedMarks={totalAllocatedMarks}
            handleAddSection={handleAddSection}
            handleRemoveSection={handleRemoveSection}
            handleAddQuestion={handleAddQuestion}
            handleRemoveQuestion={handleRemoveQuestion}
            handleSaveToBank={handleSaveToBank}
            onOpenBankModal={() => setActiveTab('bank')}
            onTriggerUpload={(secIdx, qIdx) => {
              setUploadTarget({ secIdx, qIdx });
              fileInputRef.current?.click();
            }}
            showToast={showToast}
          />
        )}

        {activeTab === 'prompt' && (
          <PromptTab
            promptConfig={promptConfig}
            setPromptConfig={setPromptConfig}
            promptCalculatedTotal={promptCalculatedTotal}
            copied={copied}
            onCopyPrompt={handleCopyPrompt}
            autoBalanceBlueprintToTarget={autoBalanceBlueprintToTarget}
            handleQuickMarkSelect={handleQuickMarkSelect}
            syncTargetToSections={syncTargetToSections}
            handleAddSectionWithPreset={handleAddSectionWithPreset}
          />
        )}

        {activeTab === 'import' && (
          <ImportTab
            importText={importText}
            setImportText={setImportText}
            importErrors={importErrors}
            onImportJSON={handleImportJSON}
            showToast={showToast}
          />
        )}

        {activeTab === 'bank' && (
          <BankTab
            bankQuestions={bankQuestions || []}
            onDeleteQuestion={(id) => db.questionBank.delete(id)}
          />
        )}

        {activeTab === 'saved' && (
          <SavedTab
            savedPapers={savedPapers || []}
            onLoadPaper={handleLoadPaper}
          />
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className={`bg-white/95 backdrop-blur-md p-3.5 rounded-3xl border border-slate-200 shadow-sm space-y-3 no-print ${isFullscreenPreview ? 'sticky top-0 z-50 rounded-none bg-slate-900 border-slate-800 text-white' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">SET:</span>
                  {(['A', 'B', 'C', 'D'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSet(s)}
                      className={`w-7 h-7 rounded-xl text-xs font-bold transition ${
                        activeSet === s 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                  <button
                    onClick={handleGenerateSets}
                    className="ml-2 p-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold"
                  >
                    <Shuffle size={12} />
                  </button>
                </div>

                <button
                  disabled={isGeneratingPdf}
                  onClick={handleDirectPdfDownload}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white text-xs font-extrabold rounded-full flex items-center space-x-1.5 shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>{isGeneratingPdf ? "Building..." : "Download PDF"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                <div className="flex bg-slate-100 p-0.5 rounded-xl">
                  <button
                    onClick={() => setPreviewMode('paper')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold ${previewMode === 'paper' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Student Paper
                  </button>
                  <button
                    onClick={() => setPreviewMode('marking_scheme')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold ${previewMode === 'marking_scheme' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Answer Key
                  </button>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setPreviewZoom(z => Math.max(0.6, z - 0.1))}
                    className="p-1 rounded-lg bg-slate-100 text-slate-600"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-bold text-slate-500">{Math.round(previewZoom * 100)}%</span>
                  <button
                    onClick={() => setPreviewZoom(z => Math.min(1.4, z + 0.1))}
                    className="p-1 rounded-lg bg-slate-100 text-slate-600"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    onClick={() => setIsFullscreenPreview(!isFullscreenPreview)}
                    className="p-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center space-x-1"
                  >
                    <Maximize2 size={12} />
                    <span className="hidden sm:inline">{isFullscreenPreview ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowStylePanel(!showStylePanel)}
                className="w-full pt-1 text-center text-[11px] font-bold text-blue-600 flex items-center justify-center space-x-1"
              >
                <Sliders size={12} />
                <span>{showStylePanel ? 'Hide Options' : 'Layout & Typography Studio'}</span>
              </button>
            </div>

            {showStylePanel && (
              <StyleCustomizer
                customization={customization}
                onChange={setCustomization}
              />
            )}

            <div className={`overflow-x-auto flex justify-center ${isFullscreenPreview ? 'p-4 sm:p-8' : ''}`}>
              <div style={{ transform: `scale(${previewZoom})`, transformOrigin: 'top center' }} className="w-full flex justify-center transition-transform">
                <PrintSheet
                  paper={currentViewPaper}
                  customization={customization}
                  previewMode={previewMode}
                  activeSet={activeSet}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING NAVIGATION */}
      {!isFullscreenPreview && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}
