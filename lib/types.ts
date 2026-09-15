export type ThinkingSkill =
  | "前提確認"
  | "定義確認"
  | "因果分解"
  | "反証"
  | "代替仮説"
  | "利害関係者"
  | "時間軸"
  | "比較対象"
  | "測定可能性"
  | "バイアス"
  | "境界条件"
  | "実務変換";

export type AiTurnOutput = {
  question: string;
  thinking_skill: ThinkingSkill;
  difficulty: "easy" | "medium" | "hard";
  reason: string;
  evaluation_criteria: string;
  score: number;
  feedback: string;
  next_question: string;
};

export type SessionRow = {
  id: string;
  theme: string;
  status: "active" | "completed";
  current_turn: number;
  total_score: number;
  created_at: string;
};

export type TurnRow = {
  id: string;
  session_id: string;
  turn_number: number;
  question: string;
  thinking_skill: string;
  difficulty: string;
  reason: string;
  evaluation_criteria: string;
  user_answer: string | null;
  score: number | null;
  feedback: string | null;
  next_question: string | null;
  created_at: string;
};
