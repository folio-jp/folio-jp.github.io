"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MAX_TURNS } from "@/lib/constants";
import { supabase } from "@/lib/supabase-browser";
import { AiTurnOutput, SessionRow, TurnRow } from "@/lib/types";

type HistoryItem = { question: string; answer: string; score?: number };

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const sessionId = params.id;
  const router = useRouter();

  const [session, setSession] = useState<SessionRow | null>(null);
  const [turns, setTurns] = useState<TurnRow[]>([]);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const currentTurn = turns.find((t) => !t.user_answer) ?? null;

  const history = useMemo<HistoryItem[]>(
    () =>
      turns
        .filter((t) => t.user_answer)
        .map((t) => ({
          question: t.question,
          answer: t.user_answer ?? "",
          score: t.score ?? 0
        })),
    [turns]
  );

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push("/auth");
        return;
      }

      const { data: sessionData } = await supabase
        .from("ct_sessions")
        .select("id,theme,status,current_turn,total_score,created_at")
        .eq("id", sessionId)
        .single();

      if (!sessionData) return;
      setSession(sessionData as SessionRow);

      const { data: turnData } = await supabase
        .from("ct_turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("turn_number", { ascending: true });

      const turnsLoaded = (turnData ?? []) as TurnRow[];
      if (turnsLoaded.length === 0) {
        await initializeFirstTurn(sessionData.theme);
        return;
      }

      setTurns(turnsLoaded);
    };

    load();
  }, [router, sessionId]);

  const initializeFirstTurn = async (theme: string) => {
    setBusy(true);
    setError("");
    const ai = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "init",
        theme,
        turn: 1,
        history: []
      })
    });

    if (!ai.ok) {
      setError("初回質問の生成に失敗しました。");
      setBusy(false);
      return;
    }

    const payload = (await ai.json()) as AiTurnOutput;

    await supabase.from("ct_turns").insert({
      session_id: sessionId,
      turn_number: 1,
      question: payload.question,
      thinking_skill: payload.thinking_skill,
      difficulty: payload.difficulty,
      reason: payload.reason,
      evaluation_criteria: payload.evaluation_criteria
    });

    const { data: turnData } = await supabase
      .from("ct_turns")
      .select("*")
      .eq("session_id", sessionId)
      .order("turn_number", { ascending: true });

    setTurns((turnData ?? []) as TurnRow[]);
    setBusy(false);
  };

  const onSubmitAnswer = async (e: FormEvent) => {
    e.preventDefault();
    if (!session || !currentTurn || !answer.trim()) return;
    setBusy(true);
    setError("");

    const ai = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "respond",
        theme: session.theme,
        turn: currentTurn.turn_number,
        currentQuestion: currentTurn.question,
        userAnswer: answer.trim(),
        history
      })
    });

    if (!ai.ok) {
      setError("評価生成に失敗しました。");
      setBusy(false);
      return;
    }

    const payload = (await ai.json()) as AiTurnOutput;
    const updatedTotal = (session.total_score ?? 0) + payload.score;

    await supabase
      .from("ct_turns")
      .update({
        user_answer: answer.trim(),
        score: payload.score,
        feedback: payload.feedback,
        next_question: payload.next_question
      })
      .eq("id", currentTurn.id);

    if (currentTurn.turn_number < MAX_TURNS) {
      await supabase.from("ct_turns").insert({
        session_id: sessionId,
        turn_number: currentTurn.turn_number + 1,
        question: payload.next_question,
        thinking_skill: payload.thinking_skill,
        difficulty: payload.difficulty,
        reason: payload.reason,
        evaluation_criteria: payload.evaluation_criteria
      });
    }

    await supabase
      .from("ct_sessions")
      .update({
        total_score: updatedTotal,
        current_turn: Math.min(currentTurn.turn_number + 1, MAX_TURNS),
        status: currentTurn.turn_number >= MAX_TURNS ? "completed" : "active"
      })
      .eq("id", sessionId);

    const [{ data: sessionData }, { data: turnData }] = await Promise.all([
      supabase
        .from("ct_sessions")
        .select("id,theme,status,current_turn,total_score,created_at")
        .eq("id", sessionId)
        .single(),
      supabase
        .from("ct_turns")
        .select("*")
        .eq("session_id", sessionId)
        .order("turn_number", { ascending: true })
    ]);

    setSession(sessionData as SessionRow);
    setTurns((turnData ?? []) as TurnRow[]);
    setAnswer("");
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {session && (
        <section className="panel space-y-2">
          <h1 className="text-2xl font-semibold text-gold">セッション詳細</h1>
          <p className="text-amber/90">テーマ: {session.theme}</p>
          <p className="text-sm text-amber/75">
            状態: {session.status} / 合計スコア: {session.total_score}
          </p>
        </section>
      )}

      {currentTurn && (
        <section className="panel space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold/80">Turn {currentTurn.turn_number}</p>
            <h2 className="mt-1 text-xl font-semibold text-gold">{currentTurn.question}</h2>
            <p className="mt-2 text-sm text-amber/80">
              観点: {currentTurn.thinking_skill} / 難易度: {currentTurn.difficulty}
            </p>
            <p className="text-sm text-amber/70">採点観点: {currentTurn.evaluation_criteria}</p>
          </div>
          <form onSubmit={onSubmitAnswer} className="space-y-3">
            <textarea
              className="input min-h-28"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="あなたの回答"
            />
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "送信中..." : "回答して次へ"}
            </button>
          </form>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </section>
      )}

      <section className="panel space-y-3">
        <h3 className="text-xl font-semibold text-gold">AI評価履歴</h3>
        <ul className="space-y-2">
          {turns
            .filter((t) => t.user_answer)
            .map((t) => (
              <li key={t.id} className="rounded-xl border border-gold/20 p-4">
                <p className="font-medium">Q{t.turn_number}: {t.question}</p>
                <p className="mt-1 text-sm text-amber/80">回答: {t.user_answer}</p>
                <p className="text-sm text-gold">スコア: {t.score} / 20</p>
                <p className="text-sm text-amber/80">フィードバック: {t.feedback}</p>
              </li>
            ))}
        </ul>
        {!currentTurn && turns.length >= MAX_TURNS && (
          <p className="rounded-xl border border-gold/30 bg-gold/10 p-4 text-gold">
            5ターン完了です。ダッシュボードで別テーマを試せます。
          </p>
        )}
      </section>
    </div>
  );
}
