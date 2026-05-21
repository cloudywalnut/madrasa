export interface Class {
  id: string;
  name: string;
  description: string | null;
  teacher_id: string;
  created_at: string;
}

export interface Subject {
  id: string;
  class_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  subject_id: string;
  class_id: string;
  title: string;
  description: string | null;
  drive_link: string;
  submission_date: string;
  created_at: string;
}

export interface Question {
  id: string;
  task_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'a' | 'b' | 'c' | 'd';
  order_index: number;
}

export interface StudentSubmission {
  id: string;
  task_id: string;
  student_id: string;
  submitted_at: string | null;
  score: number | null;
  total_questions: number | null;
  completed: boolean;
}

export interface StudentAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option: 'a' | 'b' | 'c' | 'd';
  is_correct: boolean;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  student_email: string;
  enrolled_at: string;
}

export type AnswerOption = 'a' | 'b' | 'c' | 'd';
