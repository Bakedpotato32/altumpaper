import type { QuestionPaper, Question } from '../types/schema';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateShuffledSet(original: QuestionPaper, setCode: string): QuestionPaper {
  let questionCounter = 1;
  const cloned: QuestionPaper = JSON.parse(JSON.stringify(original));
  cloned.metadata.title = `${original.metadata.title} (Set ${setCode})`;

  cloned.sections = cloned.sections.map((section) => {
    const shuffledQuestions = shuffleArray(section.questions).map((q) => {
      const renumbered: Question = {
        ...q,
        number: questionCounter++
      };
      return renumbered;
    });

    return {
      ...section,
      questions: shuffledQuestions
    };
  });

  return cloned;
}
