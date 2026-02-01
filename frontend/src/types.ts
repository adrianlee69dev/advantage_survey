export type UserRole = 'admin' | 'answerer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
}

export type QuestionType = 'rank' | 'true_false' | 'text';

export interface Question {
  id: string;
  survey_id: string;
  text: string;
  type: QuestionType;
  rank_max: number | null;
  order_index: number;
}

export interface Survey {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  questions?: Question[];
}

export interface Answer {
  id: string;
  question_id: string;
  text_value: string | null;
  bool_value: boolean | null;
  rank_value: number | null;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  answerer_id: string;
  submitted_at: string;
  answers: Answer[];
}

export interface QuestionAggregate {
  question_id: string;
  question_text: string;
  question_type: QuestionType;
  total_responses: number;
  true_count?: number;
  false_count?: number;
  true_percentage?: number;
  average_rank?: number;
  rank_distribution?: Record<number, number>;
  text_responses?: string[];
}

export interface AggregateResponse {
  survey_id: string;
  total_responses: number;
  questions: QuestionAggregate[];
}
