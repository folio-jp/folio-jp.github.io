import OpenAI from "openai";
import { NextResponse } from "next/server";
import { THINKING_SKILLS } from "@/lib/constants";
import { AiTurnOutput } from "@/lib/types";

type AiRequest = {
  theme: string;
  currentQuestion?: string;
  userAnswer?: string;
  history: { question: string; answer: string; score?: number }[];
  turn: number;
  mode: "init" | "respond";
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: [
    "question",
    "thinking_skill",
    "difficulty",
    "reason",
    "evaluation_criteria",
    "score",
    "feedback",
    "next_question"
  ],
  properties: {
    question: { type: "string" },
    thinking_skill: { type: "string", enum: THINKING_SKILLS },
    difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
    reason: { type: "string" },
    evaluation_criteria: { type: "string" },
    score: { type: "integer", minimum: 0, maximum: 20 },
    feedback: { type: "string" },
    next_question: { type: "string" }
  }
} as const;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AiRequest;

    const prompt = `あなたはクリティカルシンキング指導AIです。\n
ルール:
- 必ずJSONスキーマどおりに出力。
- mode=init のときは score=0, feedbackは「これから最初の回答をお願いします。」系の文にする。
- mode=respond のときは userAnswer を0-20点で評価する。
- question は「今ユーザーに投げる質問」。next_question も同内容で良い。
- thinking_skill は12カテゴリから選ぶ。
- 1セッション5ターン。turnを考慮して難易度を徐々に上げる。
- feedback は具体的・建設的に短く。
- evaluation_criteria はその質問の採点観点を1文で示す。

テーマ: ${body.theme}
turn: ${body.turn}
mode: ${body.mode}
currentQuestion: ${body.currentQuestion ?? "(none)"}
userAnswer: ${body.userAnswer ?? "(none)"}
history: ${JSON.stringify(body.history)}`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [{ role: "system", content: prompt }],
      text: {
        format: {
          type: "json_schema",
          name: "critical_thinking_turn",
          schema,
          strict: true
        }
      }
    });

    const raw = response.output_text;
    const parsed = JSON.parse(raw) as AiTurnOutput;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "AI generation failed" },
      { status: 500 }
    );
  }
}
