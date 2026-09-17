export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type QuestionTypeEnum =
  | 'crossword'
  | 'wordsearch'
  | 'spell_the_word'
  | 'anagram'
  | 'true_false'
  | 'labelled_diagram'
  | 'unjumble'
  | 'hangman';

export interface DatabaseProfile {
  id: string;
  full_name: string;
  email: string;
  school_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface DatabaseProfileInsert {
  id: string;
  full_name: string;
  email: string;
  school_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface DatabaseProfileUpdate {
  id?: string;
  full_name?: string;
  email?: string;
  school_name?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface DatabaseQuiz {
  id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseQuizInsert {
  id?: string;
  teacher_id: string;
  title: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseQuizUpdate {
  id?: string;
  teacher_id?: string;
  title?: string;
  description?: string | null;
  cover_image_url?: string | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseQuestion {
  id: string;
  quiz_id: string;
  question_type: QuestionTypeEnum;
  order_index: number;
  title_prompt: string;
  media_url: string | null;
  content: Json;
  created_at: string;
}

export interface DatabaseQuestionInsert {
  id?: string;
  quiz_id: string;
  question_type: QuestionTypeEnum;
  order_index?: number;
  title_prompt: string;
  media_url?: string | null;
  content: Json;
  created_at?: string;
}

export interface DatabaseQuestionUpdate {
  id?: string;
  quiz_id?: string;
  question_type?: QuestionTypeEnum;
  order_index?: number;
  title_prompt?: string;
  media_url?: string | null;
  content?: Json;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: DatabaseProfile;
        Insert: DatabaseProfileInsert;
        Update: DatabaseProfileUpdate;
      };
      quizzes: {
        Row: DatabaseQuiz;
        Insert: DatabaseQuizInsert;
        Update: DatabaseQuizUpdate;
      };
      questions: {
        Row: DatabaseQuestion;
        Insert: DatabaseQuestionInsert;
        Update: DatabaseQuestionUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      question_type_enum: QuestionTypeEnum;
    };
  };
}
