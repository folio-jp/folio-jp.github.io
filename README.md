# Critical Thinking Trainer MVP

Next.js + TypeScript + Tailwind CSS + Supabase + OpenAI Responses API で作る、クリティカルシンキング訓練アプリです。

## 機能
- ユーザー認証（Supabase Auth）
- テーマ入力
- AI質問（1問ずつ）
- ユーザー回答
- AI評価（スコア + フィードバック）
- 次の質問生成
- セッション履歴保存
- スコア保存
- 過去セッション一覧
- 1セッション5ターン固定

## セットアップ

```bash
npm install
npm run dev
```

### 環境変数
`.env.local` を作成してください。

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

## Supabase SQL

```sql
create table if not exists public.ct_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme text not null,
  status text not null default 'active',
  current_turn int not null default 1,
  total_score int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.ct_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ct_sessions(id) on delete cascade,
  turn_number int not null,
  question text not null,
  thinking_skill text not null,
  difficulty text not null,
  reason text not null,
  evaluation_criteria text not null,
  user_answer text,
  score int,
  feedback text,
  next_question text,
  created_at timestamptz not null default now()
);

alter table public.ct_sessions enable row level security;
alter table public.ct_turns enable row level security;

create policy "users_can_manage_own_sessions" on public.ct_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_can_manage_own_turns" on public.ct_turns
for all using (
  exists (
    select 1 from public.ct_sessions s
    where s.id = ct_turns.session_id and s.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.ct_sessions s
    where s.id = ct_turns.session_id and s.user_id = auth.uid()
  )
);
```

## OpenAI Responses API 仕様
`/api/ai` は JSON Schema を使って必ず以下を返すようにしています。

- question
- thinking_skill
- difficulty
- reason
- evaluation_criteria
- score
- feedback
- next_question

