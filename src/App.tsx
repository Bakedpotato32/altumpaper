import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Home, Edit3, Sparkles, Upload, Eye, BookOpen, 
  Plus, Minus, Trash2, Save, Check, Copy, ChevronRight, 
  AlertTriangle, Image as ImageIcon,
  Sliders, Star, Bookmark, KeyRound, Shuffle, 
  Search, X, ClipboardPaste, Download, Maximize2, ZoomIn, ZoomOut,
  RefreshCw, Zap
} from 'lucide-react';
import type { QuestionPaper, Section, Question } from './types/schema';
import { db } from './utils/db';
import type { SavedPaper, BankQuestion } from './utils/db';
import { sanitizeAndValidateJSON } from './utils/jsonValidator';
import { buildAIPrompt } from './utils/promptGenerator';
import type { PromptConfig, BlueprintSection } from './utils/promptGenerator';
import { generateShuffledSet } from './utils/setRandomizer';
import { MathText } from './components/MathText';
import { DEFAULT_STYLE, PaperCustomization } from './types/style';
import { StyleCustomizer } from './components/StyleCustomizer';
import { PrintSheet } from './components/PrintSheet';
import { downloadPaperAsPdf } from './utils/pdfDownloader';

const EXAM_PRESETS = [
  "Class Test", "Unit Test", "Weekly Test", "Monthly Test",
  "Mid-Term", "Half-Yearly", "Pre-Board", "Annual Examination",
  "Practice Paper", "Revision Paper", "Custom Exam"
];

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

  const [bankSearch, setBankSearch] = useState('');
  const [bankFilterStarred, setBankFilterStarred] = useState(false);
  const [bankTargetSecIdx, setBankTargetSecIdx] = useState<number>(0);
  const [showBankModal, setShowBankModal] = useState(false);

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

  // AUTO-BALANCE ALGORITHM: Automatically creates standard section distributions matching target
  const autoBalanceBlueprintToTarget = (target: number) => {
    const t = Math.max(5, target);
    let secs: BlueprintSection[] = [];

    if (t <= 15) {
      const mcqCount = Math.min(5, Math.max(1, Math.floor(t / 2)));
      const rem = t - mcqCount;
      const shortCount = Math.floor(rem / 2);
      const rem2 = rem - shortCount * 2;
      secs = [
        { id: '1', name: 'Section A (MCQ)', type: 'mcq', count: mcqCount + rem2, marksEach: 1 },
        { id: '2', name: 'Section B (Short)', type: 'short_answer', count: Math.max(1, shortCount), marksEach: 2 }
      ];
    } else if (t <= 30) {
      const mcqs = Math.floor(t * 0.3);
      const longMarks = t >= 25 ? 5 : 4;
      const longCount = 1;
      const rem = t - mcqs - (longCount * longMarks);
      const shortCount = Math.floor(rem / 2);
      const finalMcqs = mcqs + (rem - shortCount * 2);
      secs = [
        { id: '1', name: 'Section A (MCQ)', type: 'mcq', count: finalMcqs, marksEach: 1 },
        { id: '2', name: 'Section B (Short Answer)', type: 'short_answer', count: shortCount, marksEach: 2 },
        { id: '3', name: 'Section C (Long Answer)', type: 'long_answer', count: longCount, marksEach: longMarks }
      ];
    } else if (t <= 50) {
      const mcqs = Math.round(t * 0.25);
      const short2m = Math.round((t * 0.25) / 2);
      const long5m = Math.max(1, Math.floor((t * 0.2) / 5));
      const rem = t - (mcqs * 1 + short2m * 2 + long5m * 5);
      const short3m = Math.floor(rem / 3);
      const extraMcq = rem - (short3m * 3);
      secs = [
        { id: '1', name: 'Section A (Objective)', type: 'mcq', count: mcqs + extraMcq, marksEach: 1 },
        { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: short2m, marksEach: 2 },
        { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: Math.max(1, short3m), marksEach: 3 },
        { id: '4', name: 'Section D (Long Answer)', type: 'long_answer', count: long5m, marksEach: 5 }
      ];
    } else if (t <= 80) {
      if (t === 80) {
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: 20, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: 6, marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: 7, marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: 3, marksEach: 5 },
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: 3, marksEach: 4 }
        ];
      } else if (t === 70) {
        secs = [
          { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: 16, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: 8, marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: 6, marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: 4, marksEach: 5 }
        ];
      } else {
        const mcqs = 15;
        const caseStudy = 2;
        const long5m = 3;
        const rem = t - (mcqs * 1 + caseStudy * 4 + long5m * 5);
        const short2m = Math.floor((rem * 0.4) / 2);
        const short3m = Math.floor((rem - short2m * 2) / 3);
        const extra = rem - (short2m * 2 + short3m * 3);
        secs = [
          { id: '1', name: 'Section A (Objective)', type: 'mcq', count: mcqs + extra, marksEach: 1 },
          { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: Math.max(1, short2m), marksEach: 2 },
          { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: Math.max(1, short3m), marksEach: 3 },
          { id: '4', name: 'Section D (Long)', type: 'long_answer', count: long5m, marksEach: 5 },
          { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: caseStudy, marksEach: 4 }
        ];
      }
    } else {
      const mcqs = 20;
      const caseStudy = 4;
      const long5m = 4;
      const rem = t - (20 + 16 + 20);
      const short2m = 10;
      const short3m = Math.floor((rem - 20) / 3);
      const extra = rem - (20 + short3m * 3);
      secs = [
        { id: '1', name: 'Section A (MCQs)', type: 'mcq', count: mcqs + extra, marksEach: 1 },
        { id: '2', name: 'Section B (Short I)', type: 'short_answer', count: short2m, marksEach: 2 },
        { id: '3', name: 'Section C (Short II)', type: 'short_answer', count: Math.max(1, short3m), marksEach: 3 },
        { id: '4', name: 'Section D (Long)', type: 'long_answer', count: long5m, marksEach: 5 },
        { id: '5', name: 'Section E (Case Study)', type: 'case_study', count: caseStudy, marksEach: 4 }
      ];
    }

    setPromptConfig(prev => ({
      ...prev,
      totalMarks: target,
      sections: secs
    }));
    showToast(`⚡ Balanced sections to ${target} Marks!`);
  };

  // Quick Marks Chip Click: Automatically updates Target Marks AND auto-balances sections
  const handleQuickMarkSelect = (marks: number, duration: number) => {
    setPromptConfig(prev => ({
      ...prev,
      totalMarks: marks,
      durationMinutes: duration
    }));
    autoBalanceBlueprintToTarget(marks);
  };

  // Sync Direction 2: Sync Target Total to Sections Sum
  const syncTargetToSections = () => {
    setPromptConfig(prev => ({
      ...prev,
      totalMarks: promptCalculatedTotal
    }));
    showToast(`Target set to ${promptCalculatedTotal} Marks!`);
  };

  // Add section with preset values
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

  const handleInsertFromBank = (bq: BankQuestion) => {
    const nextNum = paper.sections.reduce((acc, s) => acc + s.questions.length, 0) + 1;
    const newQ: Question = {
      id: Math.random().toString(36).substring(2, 9),
      number: nextNum,
      type: bq.type,
      marks: bq.marks,
      text: bq.text,
      options: bq.options,
      match_pairs: bq.match_pairs,
      passage: bq.passage,
      subquestions: bq.subquestions,
      image_url: bq.image_url,
      answer: bq.answer,
      solution: bq.solution,
      difficulty: bq.difficulty,
      chapter: bq.chapter
    };

    const updated = [...paper.sections];
    if (!updated[bankTargetSecIdx]) return;
    updated[bankTargetSecIdx].questions.push(newQ);
    setPaper({ ...paper, sections: updated });

    if (bq.id) {
      db.questionBank.update(bq.id, { usedCount: (bq.usedCount || 0) + 1 });
    }
    showToast(`Added question to ${updated[bankTargetSecIdx].name}`);
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

  const handleDeletePaper = async (id: number) => {
    await db.papers.delete(id);
    if (currentPaperId === id) setCurrentPaperId(null);
    showToast("Paper deleted.");
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

  const filteredBankQuestions = (bankQuestions || []).filter((q) => {
    const matchesSearch = bankSearch === '' || 
      q.text.toLowerCase().includes(bankSearch.toLowerCase()) || 
      (q.chapter && q.chapter.toLowerCase().includes(bankSearch.toLowerCase()));
    const matchesStar = !bankFilterStarred || q.isStarred;
    return matchesSearch && matchesStar;
  });

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
        <header className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-40 px-5 py-3.5 flex items-center justify-between no-print shadow-sm">
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
              onClick={handleSaveToDatabase}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
            >
              <Save size={13} />
              <span className="hidden sm:inline">Save</span>
            </button>

            <button
              disabled={isGeneratingPdf}
              onClick={handleDirectPdfDownload}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:opacity-95 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Download size={13} />
              <span>{isGeneratingPdf ? "Building PDF..." : "Download PDF"}</span>
            </button>
          </div>
        </header>
      )}

      {/* MAIN CONTAINER */}
      <main className={`flex-1 w-full mx-auto ${isFullscreenPreview ? 'p-0 max-w-none bg-slate-900' : 'max-w-lg px-4 pt-4'}`}>

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'home' && (
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => setActiveTab('editor')}
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
                onClick={() => setActiveTab('prompt')}
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
                onClick={() => setActiveTab('bank')}
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
                    {bankQuestions?.length || 0} Questions Saved
                  </p>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('preview')}
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
        )}

        {/* TAB 2: VISUAL EDITOR (WITH SYNC ACTION BUTTON ON MISMATCH) */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            {/* Mark Balance Card with instant 1-tap Sync */}
            <div className={`p-4 rounded-3xl border flex flex-col gap-2.5 ${
              totalAllocatedMarks === paper.metadata.total_marks 
                ? 'bg-emerald-500/10 border-emerald-300 text-emerald-800' 
                : 'bg-amber-500/10 border-amber-300 text-amber-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-2">
                  <AlertTriangle size={16} />
                  <span>Blueprint Balance</span>
                </div>
                <span>{totalAllocatedMarks === paper.metadata.total_marks ? '✓ Balanced' : '⚠️ Mark Mismatch'}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-medium">
                <span>Sum of Questions: <strong>{totalAllocatedMarks} Marks</strong></span>
                <span>Target: <strong>{paper.metadata.total_marks} Marks</strong></span>
              </div>

              {/* Instant 1-tap sync button when marks don't match */}
              {totalAllocatedMarks !== paper.metadata.total_marks && (
                <div className="flex justify-end pt-1 border-t border-amber-200/60">
                  <button
                    onClick={() => {
                      setPaper(prev => ({
                        ...prev,
                        metadata: { ...prev.metadata, total_marks: totalAllocatedMarks }
                      }));
                      showToast(`Paper target synced to ${totalAllocatedMarks} Marks!`);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition"
                  >
                    <RefreshCw size={13} />
                    <span>Set Target to {totalAllocatedMarks} Marks</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">Exam Parameters</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500">School / Coaching Name</label>
                  <input
                    type="text"
                    value={paper.metadata.school_name}
                    onChange={(e) => setPaper({ ...paper, metadata: { ...paper.metadata, school_name: e.target.value } })}
                    className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Subject</label>
                    <input
                      type="text"
                      value={paper.metadata.subject}
                      onChange={(e) => setPaper({ ...paper, metadata: { ...paper.metadata, subject: e.target.value } })}
                      className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500">Total Marks</label>
                    <input
                      type="number"
                      value={paper.metadata.total_marks}
                      onChange={(e) => setPaper({ ...paper, metadata: { ...paper.metadata, total_marks: Number(e.target.value) } })}
                      className="w-full mt-0.5 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sections */}
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
                      className="font-black text-sm text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none"
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

                  {/* Section Choice Rules */}
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
                          value={sec.attempt_count || 1}
                          onChange={(e) => {
                            const updated = [...paper.sections];
                            updated[secIdx].attempt_count = Number(e.target.value);
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
                              value={q.marks}
                              onChange={(e) => {
                                const updated = [...paper.sections];
                                updated[secIdx].questions[qIdx].marks = Number(e.target.value);
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
                            onClick={() => {
                              setUploadTarget({ secIdx, qIdx });
                              fileInputRef.current?.click();
                            }}
                            className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg"
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
                            className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded"
                          />
                        </div>
                      )}

                      {/* MCQ OPTIONS */}
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
                                  className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
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
                                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium"
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
                                className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium"
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
                            className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium"
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
                                className="flex-1 p-1 text-xs bg-slate-50 border border-slate-200 rounded"
                              />
                              <input
                                type="number"
                                value={sub.marks}
                                onChange={(e) => {
                                  const updated = [...paper.sections];
                                  updated[secIdx].questions[qIdx].subquestions![sIdx].marks = Number(e.target.value);
                                  setPaper({ ...paper, sections: updated });
                                }}
                                className="w-10 p-1 text-xs text-center border border-slate-200 rounded font-bold"
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
                            className="w-full p-2 text-xs bg-emerald-50/50 border border-emerald-200 rounded-lg"
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
                            className="w-full p-2 text-xs bg-slate-100 border border-slate-200 rounded-lg"
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
                    onClick={() => {
                      setBankTargetSecIdx(secIdx);
                      setShowBankModal(true);
                    }}
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
        )}

        {/* TAB 3: PROMPT GENERATOR WITH AUTO-BALANCER & DIRECT INPUT CONTROLS */}
        {activeTab === 'prompt' && (
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

              {/* QUICK TARGET CHIPS (AUTOMATICALLY REBALANCES BLUEPRINT!) */}
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

              {/* TARGET MARKS & EXAM TYPE INPUTS */}
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
                    value={promptConfig.totalMarks}
                    onChange={(e) => setPromptConfig({ ...promptConfig, totalMarks: Number(e.target.value) })}
                    className="w-full mt-1 p-2 text-xs font-black text-blue-600 bg-white border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={promptConfig.durationMinutes}
                    onChange={(e) => setPromptConfig({ ...promptConfig, durationMinutes: Number(e.target.value) })}
                    className="w-full mt-1 p-2 text-xs font-black text-slate-700 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Class</label>
                  <input
                    type="text"
                    value={promptConfig.grade}
                    onChange={(e) => setPromptConfig({ ...promptConfig, grade: e.target.value })}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={promptConfig.subject}
                    onChange={(e) => setPromptConfig({ ...promptConfig, subject: e.target.value })}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-500">Chapters / Topics</label>
                  <input
                    type="text"
                    value={promptConfig.chapters}
                    onChange={(e) => setPromptConfig({ ...promptConfig, chapters: e.target.value })}
                    className="w-full mt-1 p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              {/* SECTIONS BLUEPRINT BUILDER WITH DIRECT INPUTS & CHIPS */}
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

                  {/* TWO-WAY SYNC CONTROLS */}
                  {promptCalculatedTotal !== promptConfig.totalMarks && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Direction 1: Auto-balance sections to match target marks */}
                      <button
                        onClick={() => autoBalanceBlueprintToTarget(promptConfig.totalMarks)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-sm active:scale-95 transition"
                      >
                        <Zap size={12} />
                        <span>Auto-Balance Sections to {promptConfig.totalMarks}M</span>
                      </button>

                      {/* Direction 2: Sync target marks to match sections sum */}
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

                {/* REDESIGNED SECTION CARDS WITH QUICK CHIPS & DIRECT NUMBER INPUTS */}
                <div className="space-y-3">
                  {promptConfig.sections.map((sec, idx) => (
                    <div key={sec.id || idx} className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      {/* Header with Title and Section Subtotal */}
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

                      {/* Question Type Selector */}
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

                      {/* Number of Questions: Direct Input + Steppers + Quick Chips */}
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
                            value={sec.count}
                            onChange={(e) => {
                              const updated = [...promptConfig.sections];
                              updated[idx].count = Math.max(1, Number(e.target.value));
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

                      {/* Marks Each: 1-Tap Chips + Stepper + Direct Input */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase">Marks Per Question</label>
                          {/* 1-TAP MARKS CHIPS */}
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
                            value={sec.marksEach}
                            onChange={(e) => {
                              const updated = [...promptConfig.sections];
                              updated[idx].marksEach = Math.max(1, Number(e.target.value));
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

                {/* 1-TAP QUICK ADD SECTION PRESETS */}
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

              {/* DIFFICULTY & CHIPS */}
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
                onClick={handleCopyPrompt}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-rose-500/20 active:scale-95 transition"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? "Copied Prompt to Clipboard!" : "Copy Formatted AI Prompt"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: IMPORT JSON */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900">Import AI JSON</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      const text = await navigator.clipboard.readText();
                      setImportText(text);
                    }}
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold"
                  >
                    Paste
                  </button>
                  <button
                    onClick={() => setImportText('')}
                    className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <textarea
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl"
              />
              <button
                onClick={handleImportJSON}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/20 active:scale-95 transition"
              >
                <Upload size={16} />
                <span>Validate & Load into Editor</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: A4 PREVIEW */}
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

        {/* TAB 6: QUESTION BANK */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Question Bank ({bankQuestions?.length || 0})</h2>
              <div className="divide-y divide-slate-100">
                {filteredBankQuestions.map((bq) => (
                  <div key={bq.id} className="py-2.5 space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-blue-600 uppercase">{bq.type} [{bq.marks}M]</span>
                      <button onClick={() => bq.id && db.questionBank.delete(bq.id)} className="text-red-400">
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
        )}

        {/* TAB 7: SAVED PAPERS */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Saved Question Papers</h2>
              <div className="divide-y divide-slate-100">
                {savedPapers?.map((p) => (
                  <div key={p.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{p.title}</div>
                      <div className="text-slate-400 text-[10px]">{p.subject} • {p.total_marks} Marks</div>
                    </div>
                    <button onClick={() => handleLoadPaper(p)} className="px-2.5 py-1 bg-blue-50 text-blue-600 font-bold rounded">
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FLOATING FROSTED NAVIGATION BAR */}
      {!isFullscreenPreview && (
        <nav className="fixed bottom-4 left-4 right-4 max-w-sm mx-auto bg-white/75 backdrop-blur-xl border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-3xl p-1.5 flex items-center justify-around z-50 no-print">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'editor', icon: Edit3, label: 'Editor' },
            { id: 'bank', icon: Bookmark, label: 'Bank' },
            { id: 'prompt', icon: Sparkles, label: 'AI' },
            { id: 'preview', icon: Eye, label: 'Preview' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-500/15 text-blue-600 font-bold shadow-sm' 
                    : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-0.5 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
