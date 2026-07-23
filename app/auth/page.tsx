"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signUp = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    setMessage(error ? error.message : "サインアップ成功。ログインしてください。");
  };

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <section className="panel mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold text-gold">認証</h1>
      <form className="space-y-3">
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex gap-3">
          <button className="btn-primary" onClick={signIn}>
            ログイン
          </button>
          <button className="btn-secondary" onClick={signUp}>
            新規登録
          </button>
        </div>
      </form>
      {message && <p className="text-sm text-amber/80">{message}</p>}
    </section>
  );
}
