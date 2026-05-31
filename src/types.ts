/**
 * Shared types for the AI Quiz Generator.
 */

export interface QuizSettings {
  totalPoints: number;
  targetDifficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeLimit: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'essay' | 'short-answer' | 'true-false';
  text: string;
  options?: string[];
  correctOptionIndex?: number; // for multiple choice
  correctAnswer?: string; // for essays or short answer, or true-false string
  points: number;
  required: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  settings: QuizSettings;
}

export interface CourseItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz';
  content?: string; // For lessons
  quiz?: Quiz; // For quizzes
  quizScope?: 'lesson' | 'module' | 'course'; // Scope classifications
  parentLessonId?: string; // Links this quiz to a specific lesson if scope is 'lesson'
}

export interface Module {
  id: string;
  title: string;
  items: CourseItem[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  updatedAt: string;
  progress: number; // percentage completed
  modules: Module[];
  courseQuizzes?: CourseItem[]; // Dynamic comprehensive course-level quizzes!
}

export interface GenerationConfig {
  files: { name: string; size: string }[];
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  primaryQuestionType: 'mixed' | 'mcq' | 'tf' | 'short';
  includeCitations: boolean;
}
