export interface BlueprintSection {
  id: string;
  name: string;
  type: string;
  count: number;
  marksEach: number;
}

export interface PromptConfig {
  schoolName: string;
  grade: string;
  subject: string;
  chapters: string;
  examType: string;
  totalMarks: number;
  durationMinutes: number;
  difficulty: 'easy' | 'balanced' | 'hard';
  strictlyTextbook: boolean;
  includeDiagrams: boolean;
  includeAnswerKey: boolean;
  sections: BlueprintSection[];
}

export function buildAIPrompt(config: PromptConfig): string {
  const sectionsDescription = config.sections.map((sec, idx) => {
    const subtotal = sec.count * sec.marksEach;
    return `Section ${String.fromCharCode(65 + idx)}: ${sec.count} Questions of type "${sec.type}" (${sec.marksEach} Mark${sec.marksEach > 1 ? 's' : ''} each) = ${subtotal} Marks.`;
  }).join('\n');

  const calculatedTotal = config.sections.reduce((sum, s) => sum + (s.count * s.marksEach), 0);

  return `You are an expert school examination setter and curriculum specialist.
Analyze the attached textbook page photos and generate a complete question paper strictly formatted according to the following blueprint.

### EXAM METADATA
- School Name: ${config.schoolName || 'Academic Institution'}
- Class / Grade: Class ${config.grade}
- Subject: ${config.subject}
- Chapter(s) / Syllabus: ${config.chapters}
- Examination Type: ${config.examType}
- Target Total Marks: ${calculatedTotal} Marks (Specified: ${config.totalMarks})
- Duration: ${config.durationMinutes} Minutes
- Overall Difficulty: ${config.difficulty.toUpperCase()}
- Strict Mode: ${config.strictlyTextbook ? 'Adhere strictly to attached textbook images. Do not introduce outside concepts.' : 'Allow creative standard curriculum variations.'}
- Include Diagrams/Figures: ${config.includeDiagrams ? 'Yes, include diagram-based or visual questions where applicable.' : 'Text questions only.'}
- Generate Complete Solutions/Answers: ${config.includeAnswerKey ? 'Yes, provide full step-wise solutions or answers in the "solution" and "answer" fields.' : 'No.'}

### STRUCTURE BLUEPRINT
${sectionsDescription}

### MANDATORY JSON FORMAT
Return ONLY valid raw JSON adhering strictly to this schema:
{
  "schema_version": "1.1",
  "metadata": {
    "title": "${config.examType} - ${config.subject}",
    "school_name": "${config.schoolName}",
    "class_grade": "${config.grade}",
    "subject": "${config.subject}",
    "exam_type": "${config.examType}",
    "academic_year": "2026-2027",
    "duration_minutes": ${config.durationMinutes},
    "total_marks": ${calculatedTotal},
    "general_instructions": [
      "All questions are compulsory unless internal choice is given.",
      "Marks are indicated against each question."
    ]
  },
  "sections": [
    ${config.sections.map((s, idx) => `{
      "name": "Section ${String.fromCharCode(65 + idx)}",
      "instructions": "${s.type.replace(/_/g, ' ').toUpperCase()} Questions (${s.marksEach} Mark${s.marksEach > 1 ? 's' : ''} Each)",
      "total_marks": ${s.count * s.marksEach},
      "is_compulsory": true,
      "questions": []
    }`).join(',\n    ')}
  ]
}

### CRITICAL RULES:
1. Every question must have an accurate "marks" value and sequential "number".
2. Format all mathematical and chemical equations using LaTeX inside single dollar signs, such as $x^2 + y^2 = r^2$ or $\\text{H}_2\\text{SO}_4$.
3. For MCQ questions, provide 4 options in an "options" array and specify "answer".
4. For match_the_following, provide a "match_pairs" array of {"left": "...", "right": "..."}.
5. For case_study, provide a "passage" string and "subquestions" array.
6. Return purely valid JSON with zero Markdown conversational chatter.`;
}
