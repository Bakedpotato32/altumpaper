import { QuestionPaperSchema } from '../types/schema';
import type { QuestionPaper } from '../types/schema';

export interface ValidationResult {
  success: boolean;
  data?: QuestionPaper;
  errors?: string[];
  repaired?: boolean;
}

export function sanitizeAndValidateJSON(rawInput: string): ValidationResult {
  let cleaned = rawInput.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  let parsed: any;
  let repaired = false;

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    try {
      const fixedCommas = cleaned.replace(/,\s*([\]}])/g, '$1');
      parsed = JSON.parse(fixedCommas);
      repaired = true;
    } catch {
      return {
        success: false,
        errors: [
          "Invalid JSON syntax. Check for unclosed brackets or unescaped quotes."
        ]
      };
    }
  }

  const result = QuestionPaperSchema.safeParse(parsed);

  if (!result.success) {
    const errorMessages = result.error.issues.map((e: any) => {
      const path = e.path.join(' ➔ ');
      return `[${path || 'Root'}]: ${e.message}`;
    });
    return {
      success: false,
      errors: errorMessages,
      repaired
    };
  }

  const totalAllocatedMarks = result.data.sections.reduce(
    (acc, sec) => acc + sec.questions.reduce((qAcc, q) => qAcc + (q.marks || 0), 0),
    0
  );

  const errors: string[] = [];
  if (totalAllocatedMarks !== result.data.metadata.total_marks) {
    errors.push(
      `Mark warning: Target is ${result.data.metadata.total_marks} marks, but questions total ${totalAllocatedMarks} marks.`
    );
  }

  return {
    success: true,
    data: result.data,
    errors: errors.length > 0 ? errors : undefined,
    repaired
  };
}
