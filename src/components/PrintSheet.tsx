import React, { useMemo } from 'react';
import type { QuestionPaper } from '../types/schema';
import type { PaperCustomization } from '../types/style';
import { MathText } from './MathText';
import { paginatePaper } from '../utils/paginator';

interface Props {
  paper: QuestionPaper;
  customization: PaperCustomization;
  previewMode: 'paper' | 'marking_scheme';
  activeSet: string;
}

export const PrintSheet: React.FC<Props> = ({
  paper,
  customization,
  previewMode,
  activeSet
}) => {
  const pages = useMemo(() => {
    return paginatePaper(paper, customization);
  }, [paper, customization]);

  const formatQNum = (num: number) => {
    if (customization.questionNumberFormat === '1.') return `${num}.`;
    if (customization.questionNumberFormat === 'Q.1)') return `Q.${num})`;
    return `Q${num}.`;
  };

  const gapStyle: React.CSSProperties = { marginBottom: `${customization.questionGapPx}px` };

  return (
    <div className="w-full flex flex-col items-center space-y-8 pb-12">
      {pages.map((page) => (
        <div key={page.pageNumber} className="w-full max-w-[794px] space-y-2">
          <div className="flex items-center justify-between px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider no-print">
            <span>A4 SHEET — PAGE {page.pageNumber} OF {pages.length}</span>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">
              {page.isFirstPage ? 'Page 1' : 'Continuation Page'}
            </span>
          </div>

          <div
            id={`exam-page-${page.pageNumber}`}
            data-page-number={page.pageNumber}
            style={{
              wordSpacing: `${customization.wordSpacingPx}px`,
              fontSize: `${customization.fontSizePx}px`,
              lineHeight: customization.lineHeight,
              width: '100%',
              aspectRatio: '210 / 297',
              padding: `${customization.pageMarginPx}px`,
              boxSizing: 'border-box'
            }}
            className={`a4-page-sheet relative bg-white text-black shadow-2xl rounded-none border border-slate-300 flex flex-col justify-between transition-all ${
              customization.fontFamily === 'serif' ? 'font-serif' : customization.fontFamily === 'mono' ? 'font-mono' : 'font-sans'
            } ${
              customization.borderStyle === 'single' ? 'ring-2 ring-black' : customization.borderStyle === 'double' ? 'ring-4 ring-double ring-black' : ''
            }`}
          >
            {customization.showWatermark && customization.watermarkText && (
              <div
                style={{ opacity: customization.watermarkOpacity }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none z-0"
              >
                <span className="text-black text-6xl font-black uppercase rotate-[-35deg] tracking-widest text-center whitespace-nowrap">
                  {customization.watermarkText}
                </span>
              </div>
            )}

            <div className="relative z-10 space-y-4 flex-1">
              {page.isFirstPage ? (
                <div>
                  <div className="text-center pb-2 mb-3">
                    {customization.logoUrl && (
                      <img src={customization.logoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-1.5" />
                    )}
                    <h1 style={{ fontSize: '1.9em' }} className="font-black uppercase tracking-wider text-black leading-tight mb-1">
                      {paper.metadata.school_name}
                    </h1>
                    {customization.affiliationText && (
                      <p style={{ fontSize: '0.8em' }} className="text-slate-700 font-medium italic mb-1 leading-normal">
                        {customization.affiliationText}
                      </p>
                    )}
                    <h2 style={{ fontSize: '1.05em' }} className="font-bold uppercase mt-1 mb-2 tracking-wide leading-snug">
                      {previewMode === 'marking_scheme' ? '[MARKING SCHEME & ANSWER KEY] ' : ''}
                      {paper.metadata.title} (SET - {activeSet})
                    </h2>

                    {/* Isolated Divider Lines for Exam Meta Bar */}
                    <div className="mt-2.5 mb-1.5">
                      <div className="border-t-2 border-black w-full mb-1"></div>
                      <div className="flex justify-between items-center font-bold px-1 py-0.5 leading-normal">
                        <span>TIME ALLOWED: {paper.metadata.duration_minutes} MINUTES</span>
                        <span>MAXIMUM MARKS: {paper.metadata.total_marks}</span>
                      </div>
                      <div className="border-b border-black w-full mt-1"></div>
                    </div>

                    <div style={{ fontSize: '0.92em' }} className="flex justify-between items-center font-bold px-1 pt-1 text-slate-800 leading-normal">
                      <span>CLASS: {paper.metadata.class_grade}</span>
                      <span>SUBJECT: {paper.metadata.subject.toUpperCase()}</span>
                      <span>ACADEMIC YEAR: {paper.metadata.academic_year}</span>
                    </div>
                    <div className="border-b-2 border-black w-full mt-2"></div>
                  </div>

                  {previewMode === 'paper' && customization.showStudentBox && (
                    <div style={{ fontSize: '0.92em' }} className="border border-black p-2.5 mb-3 flex justify-between items-center">
                      <div className="flex items-center space-x-2 flex-1 mr-4">
                        <span className="font-bold shrink-0">Candidate Name:</span>
                        <div className="border-b border-black flex-1 self-end mb-1"></div>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0">
                        <span className="font-bold mr-1">Roll No:</span>
                        {[...Array(6)].map((_, i) => (
                          <span key={i} className="w-5 h-5 border border-black inline-block"></span>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewMode === 'paper' && (
                    <div style={{ fontSize: '0.92em' }} className="border border-black p-2.5 mb-4 bg-slate-50/50">
                      <span className="font-bold underline uppercase block mb-1">General Instructions:</span>
                      <ol className="list-decimal list-outside pl-4 space-y-1 text-slate-900">
                        {paper.metadata.general_instructions.map((inst, i) => (
                          <li key={i} className="pl-1 leading-normal">{inst}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.92em' }} className="mb-3">
                  <div className="flex items-center justify-between font-bold uppercase pb-1 leading-normal">
                    <span>{paper.metadata.school_name} — {paper.metadata.subject}</span>
                    <span>Set {activeSet} • Page {page.pageNumber}</span>
                  </div>
                  <div className="border-b border-black w-full mt-1"></div>
                </div>
              )}

              <div className={customization.columns === 2 ? 'columns-2 gap-6' : ''}>
                {page.items.map((item, idx) => {
                  if (item.type === 'section_header') {
                    return (
                      <div key={idx} style={gapStyle} className="text-center mt-3 mb-2">
                        <div className="font-bold uppercase tracking-wide leading-normal pb-1">
                          {item.sectionName} {item.sectionInstructions && `— ${item.sectionInstructions}`}
                          {!item.isCompulsory && item.attemptCount && (
                            <span style={{ fontSize: '0.85em' }} className="block lowercase font-normal italic mt-0.5 leading-normal">
                              (attempt any {item.attemptCount} questions)
                            </span>
                          )}
                        </div>
                        <div className="border-b border-black w-full mt-1 mb-1.5"></div>
                      </div>
                    );
                  }

                  const q = item.question;
                  if (!q) return null;

                  return (
                    <div key={idx} style={gapStyle} className="break-inside-avoid flex justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="leading-normal">
                          <span className="font-bold mr-1.5">{formatQNum(q.number)}</span>
                          <MathText content={q.text} />
                        </div>

                        {q.image_url && (
                          <div className="my-1.5">
                            <img src={q.image_url} alt="Diagram" className="max-h-40 object-contain rounded border border-slate-300" />
                          </div>
                        )}

                        {/* Match Pairs with Separate Line Dividers */}
                        {q.match_pairs && q.match_pairs.length > 0 && (
                          <div style={{ fontSize: '0.92em' }} className="grid grid-cols-2 gap-x-4 gap-y-1 pl-4 my-2">
                            <div>
                              <div className="font-bold leading-normal pb-1">Column I</div>
                              <div className="border-b border-black w-full mb-1"></div>
                            </div>
                            <div>
                              <div className="font-bold leading-normal pb-1">Column II</div>
                              <div className="border-b border-black w-full mb-1"></div>
                            </div>
                            {q.match_pairs.map((pair, pIdx) => (
                              <div key={pIdx} className="contents">
                                <div className="py-0.5 leading-normal">({pIdx + 1}) <MathText content={pair.left} /></div>
                                <div className="py-0.5 leading-normal">({String.fromCharCode(97 + pIdx)}) <MathText content={pair.right} /></div>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1 pl-4 pt-1">
                            {q.options.map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-start space-x-1 leading-normal">
                                <span className="font-bold">{String.fromCharCode(65 + optIdx)})</span>
                                <MathText content={opt} />
                              </div>
                            ))}
                          </div>
                        )}

                        {previewMode === 'marking_scheme' && (
                          <div style={{ fontSize: '0.92em' }} className="mt-1.5 p-2 bg-slate-100 border border-slate-300 rounded space-y-0.5">
                            {q.answer && (
                              <div className="font-bold text-black leading-normal">
                                Correct Answer: <span className="font-normal">{q.answer}</span>
                              </div>
                            )}
                            {q.solution && (
                              <div className="text-slate-800 leading-normal">
                                <strong>Rubric:</strong> {q.solution}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="font-bold whitespace-nowrap text-right">[{q.marks}]</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="relative z-10 pt-6 mt-auto">
              <div className="border-t border-black w-full mb-3"></div>
              {page.isLastPage && customization.showSignatures && (
                <div style={{ fontSize: '1em' }} className="grid grid-cols-3 text-center font-bold text-black mb-3">
                  <div className="flex flex-col items-center">
                    <div className="border-b border-black w-24 mb-1.5"></div>
                    <span className="leading-normal">Signature of Examiner</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="border-b border-black w-24 mb-1.5"></div>
                    <span className="leading-normal">Signature of Invigilator</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="border-b border-black w-24 mb-1.5"></div>
                    <span className="leading-normal">Center Superintendent</span>
                  </div>
                </div>
              )}
              <div style={{ fontSize: '0.83em' }} className="flex justify-between items-center font-bold text-slate-600 uppercase">
                <span>{paper.metadata.title} (Set {activeSet})</span>
                <span>Page {page.pageNumber} of {pages.length}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
