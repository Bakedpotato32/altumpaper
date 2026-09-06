import type { QuestionPaper, Question } from '../types/schema';
import type { PaperCustomization } from '../types/style';

export interface PageItem {
  type: 'section_header' | 'question';
  secIdx: number;
  qIdx?: number;
  sectionName?: string;
  sectionInstructions?: string;
  isCompulsory?: boolean;
  attemptCount?: number;
  question?: Question;
}

export interface A4Page {
  pageNumber: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  items: PageItem[];
}

export function paginatePaper(paper: QuestionPaper, customization: PaperCustomization): A4Page[] {
  const pages: A4Page[] = [];
  let currentPageItems: PageItem[] = [];
  let currentCapacity = 100;

  // Page 1 initial allocation
  let page1Cost = 30;
  if (customization.logoUrl) page1Cost += 12;
  if (customization.showStudentBox) page1Cost += 12;
  if (paper.metadata.general_instructions?.length) page1Cost += 14;

  let pageRemainingUnits = currentCapacity - page1Cost;
  let pageIndex = 1;

  function estimateQuestionUnits(q: Question): number {
    let units = 8;
    if (q.type === 'mcq') units += 6;
    if (q.type === 'match_the_following') units += 10;
    if (q.type === 'case_study') units += 16;
    if (q.image_url) units += 18;
    if (customization.fontSizePx && customization.fontSizePx < 12) units *= 0.85;
    if (customization.fontSizePx && customization.fontSizePx > 14) units *= 1.25;
    if (customization.lineHeight && Number(customization.lineHeight) < 1.3) units *= 0.9;
    if (customization.columns === 2) units *= 0.65;
    return units;
  }

  for (let sIdx = 0; sIdx < paper.sections.length; sIdx++) {
    const sec = paper.sections[sIdx];
    const secHeaderUnits = 7;

    if (pageRemainingUnits < secHeaderUnits + 10 && currentPageItems.length > 0) {
      pages.push({
        pageNumber: pageIndex++,
        isFirstPage: pages.length === 0,
        isLastPage: false,
        items: currentPageItems
      });
      currentPageItems = [];
      pageRemainingUnits = 85;
    }

    currentPageItems.push({
      type: 'section_header',
      secIdx: sIdx,
      sectionName: sec.name,
      sectionInstructions: sec.instructions,
      isCompulsory: sec.is_compulsory,
      attemptCount: sec.attempt_count
    });
    pageRemainingUnits -= secHeaderUnits;

    for (let qIdx = 0; qIdx < sec.questions.length; qIdx++) {
      const q = sec.questions[qIdx];
      const qUnits = estimateQuestionUnits(q);

      if (pageRemainingUnits < qUnits && currentPageItems.length > 0) {
        pages.push({
          pageNumber: pageIndex++,
          isFirstPage: pages.length === 0,
          isLastPage: false,
          items: currentPageItems
        });
        currentPageItems = [];
        pageRemainingUnits = 85;
      }

      currentPageItems.push({
        type: 'question',
        secIdx: sIdx,
        qIdx,
        question: q
      });
      pageRemainingUnits -= qUnits;

      if (q.page_break_after) {
        pages.push({
          pageNumber: pageIndex++,
          isFirstPage: pages.length === 0,
          isLastPage: false,
          items: currentPageItems
        });
        currentPageItems = [];
        pageRemainingUnits = 85;
      }
    }
  }

  if (currentPageItems.length > 0 || pages.length === 0) {
    pages.push({
      pageNumber: pageIndex,
      isFirstPage: pages.length === 0,
      isLastPage: true,
      items: currentPageItems
    });
  }

  if (pages.length > 0) {
    pages[pages.length - 1].isLastPage = true;
  }

  return pages;
}
