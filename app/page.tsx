import Link from "next/link";

export default function HomePage() {
  return (
    <section className="panel space-y-5">
      <h1 className="text-3xl font-bold text-gold">知性を磨く5ターン訓練</h1>
      <p className="text-amber/90">
        1つの主張を入力すると、AIが12カテゴリの観点から1問ずつ深掘りします。毎ターン採点と改善フィードバックを返し、最終的にセッション履歴として保存されます。
      </p>
      <div className="flex gap-3">
        <Link href="/auth" className="btn-primary">
          はじめる
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          過去セッションを見る
        </Link>
      </div>
    </section>
  );
}
