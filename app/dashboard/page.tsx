"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { SessionRow } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        router.push("/auth");
        return;
      }

      const { data } = await supabase
        .from("ct_sessions")
        .select("id,theme,status,current_turn,total_score,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setSessions((data ?? []) as SessionRow[]);
      setLoading(false);
    };

    load();
  }, [router]);

  const createSession = async (e: FormEvent) => {
    e.preventDefault();
    if (!theme.trim()) return;

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      router.push("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("ct_sessions")
      .insert({ user_id: user.id, theme: theme.trim(), status: "active" })
      .select("id")
      .single();

    if (error || !data) return;

    router.push(`/session/${data.id}`);
  };

  return (
    <div className="space-y-6">
      <section className="panel space-y-3">
        <h1 className="text-2xl font-semibold text-gold">テーマ入力</h1>
        <form onSubmit={createSession} className="space-y-3">
          <textarea
            className="input min-h-28"
            placeholder="例：リモートワークは生産性を上げる"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            5ターンセッション開始
          </button>
        </form>
      </section>

      <section className="panel space-y-3">
        <h2 className="text-xl font-semibold text-gold">過去セッション一覧</h2>
        {loading ? (
          <p>読み込み中...</p>
        ) : sessions.length === 0 ? (
          <p className="text-amber/80">セッションはまだありません。</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="rounded-xl border border-gold/25 bg-black/30 p-4"
              >
                <p className="font-semibold text-amber">{session.theme}</p>
                <p className="text-sm text-amber/70">
                  状態: {session.status} / ターン: {session.current_turn} / 合計スコア: {session.total_score}
                </p>
                <Link href={`/session/${session.id}`} className="mt-2 inline-block btn-secondary">
                  開く
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
