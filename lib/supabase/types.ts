export type Stage = "pregnant" | "postpartum" | "ttc";

export type Mood = "great" | "okay" | "meh" | "rough" | "anxious";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  stage: Stage | null;
  due_date: string | null;
  week: number | null;
  baby_age_months: number | null;
  baby_name: string | null;
  baby_sex: string | null;
  months_trying: number | null;
  first_pregnancy: boolean;
  concerns: string[];
  tone_preference: string;
  created_at: string;
  updated_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
};

export type MoodLog = {
  id: string;
  user_id: string;
  mood: Mood;
  created_at: string;
};

type ProfileInsert = {
  id: string;
  email?: string | null;
  name?: string | null;
  stage?: Stage | null;
  due_date?: string | null;
  week?: number | null;
  baby_age_months?: number | null;
  baby_name?: string | null;
  baby_sex?: string | null;
  months_trying?: number | null;
  first_pregnancy?: boolean;
  concerns?: string[];
  tone_preference?: string;
  created_at?: string;
  updated_at?: string;
};

type ConversationInsert = {
  id?: string;
  user_id: string;
  title?: string;
  messages?: ChatMessage[];
  created_at?: string;
  updated_at?: string;
};

type MoodLogInsert = {
  id?: string;
  user_id: string;
  mood: Mood;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: Partial<ProfileInsert>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: Partial<ConversationInsert>;
        Relationships: [];
      };
      mood_logs: {
        Row: MoodLog;
        Insert: MoodLogInsert;
        Update: Partial<MoodLogInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
