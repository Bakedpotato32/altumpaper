import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { QuestionPaper, Question } from '../types/schema';

export interface SavedPaper {
  id?: number;
  uuid: string;
  title: string;
  subject: string;
  class_grade: string;
  total_marks: number;
  updatedAt: Date;
  data: QuestionPaper;
}

export interface BankQuestion {
  id?: number;
  text: string;
  type: Question['type'];
  marks: number;
  subject: string;
  class_grade: string;
  chapter?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options?: string[];
  match_pairs?: { left: string; right: string }[];
  passage?: string;
  subquestions?: { number: string; text: string; marks: number }[];
  image_url?: string;
  answer?: string;
  solution?: string;
  isStarred?: boolean;
  usedCount: number;
  createdAt: Date;
}

export class ExamDatabase extends Dexie {
  papers!: Table<SavedPaper>;
  questionBank!: Table<BankQuestion>;

  constructor() {
    super('QuestionPaperDB');
    this.version(2).stores({
      papers: '++id, uuid, title, subject, class_grade, updatedAt',
      questionBank: '++id, text, subject, class_grade, difficulty, isStarred, usedCount, createdAt'
    });
  }
}

export const db = new ExamDatabase();
