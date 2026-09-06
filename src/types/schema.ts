import { z } from "zod";

export const QuestionTypeEnum = z.enum([
  "mcq",
  "true_false",
  "fill_in_the_blanks",
  "match_the_following",
  "assertion_reasoning",
  "short_answer",
  "long_answer",
  "case_study",
  "diagram_based"
]);

export const MatchPairSchema = z.object({
  left: z.string(),
  right: z.string()
});

export const SubQuestionSchema = z.object({
  number: z.string(),
  text: z.string(),
  marks: z.number().default(1)
});

export const QuestionSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  number: z.number(),
  type: QuestionTypeEnum.default("short_answer"),
  marks: z.number().min(0.5).default(1),
  text: z.string().min(1, "Question text cannot be empty"),
  options: z.array(z.string()).optional(),
  match_pairs: z.array(MatchPairSchema).optional(),
  subquestions: z.array(SubQuestionSchema).optional(),
  passage: z.string().optional(),
  image_url: z.string().optional(),
  image_caption: z.string().optional(),
  answer: z.string().optional(),
  solution: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  chapter: z.string().optional(),
  page_break_after: z.boolean().optional()
});

export const SectionSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  name: z.string().min(1, "Section name is required"),
  instructions: z.string().optional(),
  total_marks: z.number().default(0),
  is_compulsory: z.boolean().default(true),
  attempt_count: z.number().optional(),
  questions: z.array(QuestionSchema).default([])
});

export const PaperMetadataSchema = z.object({
  title: z.string().default("Periodic Assessment"),
  school_name: z.string().default("School / Coaching Center"),
  class_grade: z.string().default("10"),
  subject: z.string().default("Science"),
  exam_type: z.string().default("Unit Test"),
  academic_year: z.string().default("2026-2027"),
  duration_minutes: z.number().default(90),
  total_marks: z.number().default(40),
  general_instructions: z.array(z.string()).default([
    "All questions are compulsory unless internal choice is specified.",
    "The question paper consists of structured sections.",
    "Use of calculators is prohibited."
  ])
});

export const QuestionPaperSchema = z.object({
  schema_version: z.string().default("1.1"),
  metadata: PaperMetadataSchema,
  sections: z.array(SectionSchema)
});

export type Question = z.infer<typeof QuestionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type PaperMetadata = z.infer<typeof PaperMetadataSchema>;
export type QuestionPaper = z.infer<typeof QuestionPaperSchema>;
export type MatchPair = z.infer<typeof MatchPairSchema>;
export type SubQuestion = z.infer<typeof SubQuestionSchema>;
