import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultFile = join(root, "source", "02_12タイプ結果文章.md");
const characterFile = join(root, "source", "03_キャラクター対応表(1).md");

const [resultMarkdown, characterMarkdown] = await Promise.all([
  readFile(resultFile, "utf8"),
  readFile(characterFile, "utf8"),
]);

const cleanInline = (value = "") =>
  value.trim().replace(/^\*\*|\*\*$/g, "").trim();

const sectionText = (block, heading) => {
  const match = block.match(
    new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |\\n---|$)`),
  );
  return match?.[1]?.trim() ?? "";
};

const paragraph = (block, heading) =>
  sectionText(block, heading)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("```"))
    .join("\n");

const bullets = (block, heading) =>
  sectionText(block, heading)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^-\s+/.test(line))
    .map((line) => line.replace(/^-\s+/, ""));

const numbered = (block, heading) =>
  sectionText(block, heading)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ""));

const relation = (block, heading) => {
  const raw = sectionText(block, heading);
  const label = cleanInline(raw.match(/\*\*(T\d{2})\s+(.+?)\*\*/)?.[0] ?? "");
  const [id = "", ...nameParts] = label.split(/\s+/);
  const reason = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("**"))
    .join("");
  return { id, name: nameParts.join(" "), reason };
};

const shareText = (block) =>
  sectionText(block, "SNS共有文").match(/```text\s*([\s\S]*?)```/)?.[1]?.trim() ??
  "";

const browseMeta = {
  T01: {
    tags: ["共有", "気配り", "親しみやすさ"],
    categories: ["lively"],
    snackStyle: ["親しみやすい甘さ", "分けやすく手軽", "定番と見た目を重視", "誰かと楽しむ時", "みんなでシェア"],
    similarTypes: [
      { id: "T07", common: "人と楽しむ空気を大切にする", difference: "T01は気配り、T07は軽快な盛り上げが中心" },
      { id: "T06", common: "満足感のある時間を人と味わえる", difference: "T01は共有、T06は上質なごほうびを重視" },
    ],
  },
  T02: {
    tags: ["安心感", "継続", "堅実"],
    categories: ["calm", "precise"],
    snackStyle: ["想像できる定番の味", "飽きにくい食感", "実績と信頼で選ぶ", "いつもの休憩時間", "ゆっくり習慣的に"],
    similarTypes: [
      { id: "T08", common: "落ち着きと自分のペースを大切にする", difference: "T02は定番への信頼、T08は時間の使い方を重視" },
      { id: "T12", common: "刺激より穏やかな安心を好む", difference: "T02は安定、T12は感情の癒しが中心" },
    ],
  },
  T03: {
    tags: ["品質", "美意識", "集中"],
    categories: ["precise", "curious"],
    snackStyle: ["甘さ控えめで奥行き", "余韻を楽しめる質感", "原材料や製法で選ぶ", "一人で深く味わう時", "少量をじっくり"],
    similarTypes: [
      { id: "T09", common: "自分の基準で質を見極める", difference: "T03は美意識、T09は合理性と管理を重視" },
      { id: "T11", common: "表面的でない価値や独自性に惹かれる", difference: "T03は深掘り、T11は組み合わせの発想が中心" },
    ],
  },
  T04: {
    tags: ["発見", "行動力", "新しさ"],
    categories: ["curious", "lively"],
    snackStyle: ["まだ知らない味", "初めて出会う食感", "限定・新発売で選ぶ", "新しい刺激が欲しい時", "まず試して楽しむ"],
    similarTypes: [
      { id: "T11", common: "未知や意外性を楽しめる", difference: "T04は体験へ進み、T11は発想を組み合わせる" },
      { id: "T05", common: "新鮮な刺激への反応が早い", difference: "T04は新しさ、T05は刺激の強さを重視" },
    ],
  },
  T05: {
    tags: ["刺激", "瞬発力", "挑戦"],
    categories: ["curious", "lively"],
    snackStyle: ["辛味・酸味・濃い味", "インパクトの強い食感", "挑戦度で選ぶ", "気分を一気に上げたい時", "勢いよく楽しむ"],
    similarTypes: [
      { id: "T04", common: "迷うより先に試せる行動力がある", difference: "T05は強度、T04は未知との出会いを重視" },
      { id: "T11", common: "普通ではない体験に惹かれる", difference: "T05は体感、T11はアイデアの意外性が中心" },
    ],
  },
  T06: {
    tags: ["ごほうび", "上質", "満足感"],
    categories: ["lively", "calm"],
    snackStyle: ["濃厚で満たされる味", "なめらかで上質", "特別感で選ぶ", "頑張った日の区切り", "時間を取って味わう"],
    similarTypes: [
      { id: "T01", common: "おいしい時間の価値を大切にする", difference: "T06は自分への充足、T01は人との共有が中心" },
      { id: "T12", common: "お菓子で心を満たし整える", difference: "T06は華やかな満足、T12は穏やかな癒しを重視" },
    ],
  },
  T07: {
    tags: ["明るさ", "テンポ", "ムード"],
    categories: ["lively", "curious"],
    snackStyle: ["軽やかで親しみやすい味", "サクサク・パリパリ", "手軽さで選ぶ", "会話や動画を楽しむ時", "何度も気軽につまむ"],
    similarTypes: [
      { id: "T01", common: "周りと楽しい空気を作れる", difference: "T07はテンポ、T01は相手への気配りを重視" },
      { id: "T04", common: "明るく前向きに動き出せる", difference: "T07は場の楽しさ、T04は未知の発見が中心" },
    ],
  },
  T08: {
    tags: ["自分のペース", "継続", "落ち着き"],
    categories: ["calm"],
    snackStyle: ["長く続く穏やかな味", "噛み応えのある食感", "持続性で選ぶ", "一人で落ち着く時", "少しずつじっくり"],
    similarTypes: [
      { id: "T02", common: "急がず安定した時間を好む", difference: "T08は自分の速度、T02は定番の信頼を重視" },
      { id: "T12", common: "無理なく心地よい状態を大切にする", difference: "T08はペース、T12は感情へのやさしさが中心" },
    ],
  },
  T09: {
    tags: ["自己管理", "合理性", "バランス"],
    categories: ["precise", "calm"],
    snackStyle: ["おいしさと健康の両立", "量を調整しやすい形", "栄養や原材料で選ぶ", "計画した休憩や補給", "量を決めて楽しむ"],
    similarTypes: [
      { id: "T03", common: "周囲に流されず自分の基準で選ぶ", difference: "T09は長期的な合理性、T03は品質と美意識を重視" },
      { id: "T02", common: "確実さと継続を大切にする", difference: "T09は改善、T02は変わらない安定が中心" },
    ],
  },
  T10: {
    tags: ["記憶", "物語", "つながり"],
    categories: ["calm", "lively"],
    snackStyle: ["昔から親しんだ味", "記憶に残る食感", "物語や思い出で選ぶ", "懐かしい人や時間を思う時", "思い出と一緒に味わう"],
    similarTypes: [
      { id: "T12", common: "心が落ち着くやさしい時間を好む", difference: "T10は記憶、T12は今の疲れを癒すことが中心" },
      { id: "T02", common: "長く親しめるものを大切にする", difference: "T10は物語、T02は定番の信頼を重視" },
    ],
  },
  T11: {
    tags: ["ひらめき", "独創性", "組み合わせ"],
    categories: ["curious", "precise"],
    snackStyle: ["意外な味の組み合わせ", "変化を感じる食感", "発想や背景で選ぶ", "アイデアが欲しい時", "比べて組み合わせる"],
    similarTypes: [
      { id: "T04", common: "新しいものを面白がれる", difference: "T11は発想、T04は実際に試す行動が中心" },
      { id: "T03", common: "自分なりの価値を見つけられる", difference: "T11は広げる発想、T03は一つを深める集中を重視" },
    ],
  },
  T12: {
    tags: ["癒し", "共感", "やさしさ"],
    categories: ["calm", "lively"],
    snackStyle: ["刺激の少ないやさしい甘さ", "柔らかくなめらか", "安心感で選ぶ", "疲れて心を休めたい時", "ゆっくり力を抜いて"],
    similarTypes: [
      { id: "T10", common: "心がほどける安心を大切にする", difference: "T12は今の感情、T10は思い出とのつながりが中心" },
      { id: "T02", common: "穏やかで予測できる時間を好む", difference: "T12は共感、T02は安定と継続を重視" },
    ],
  },
};

const characterRows = [...characterMarkdown.matchAll(
  /^\|\s*(T\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(#[0-9A-Fa-f]{6})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/gm,
)];

const characters = Object.fromEntries(
  characterRows.map((match) => {
    const [, id, name, character, color, subColors, copy, image] = match;
    return [
      id,
      {
        id,
        name: name.trim(),
        character: character.trim(),
        color,
        subColors: subColors.split("／").map((value) => value.trim()),
        copy: copy.trim(),
        image: `assets/${image.trim()}`,
      },
    ];
  }),
);

const blocks = resultMarkdown
  .split(/(?=^# T\d{2}｜)/m)
  .filter((block) => /^# T\d{2}｜/m.test(block));

const types = {};
for (const block of blocks) {
  const heading = block.match(/^# (T\d{2})｜(.+)$/m);
  if (!heading) continue;
  const [, id, name] = heading;
  const mapped = characters[id];
  if (!mapped) throw new Error(`Character mapping missing: ${id}`);

  const type = {
    ...mapped,
    name: name.trim(),
    overall: paragraph(block, "総合診断"),
    basics: bullets(block, "基本性格"),
    strengths: numbered(block, "強み"),
    cautions: bullets(block, "注意したいところ"),
    relationships: paragraph(block, "人との関わり方"),
    work: paragraph(block, "仕事・行動傾向"),
    snackChoices: bullets(block, "お菓子の選び方"),
    compatible: relation(block, "相性が良いタイプ"),
    opposite: relation(block, "正反対のタイプ"),
    share: shareText(block),
    short: cleanInline(paragraph(block, "結果カード用短文")),
    ...browseMeta[id],
  };

  const sentences = type.overall.split("。").filter(Boolean);
  type.overview = type.overall;
  type.shortDescription = `${sentences.slice(0, 2).join("。")}。`;
  type.relationship = type.relationships;
  type.workStyle = type.work;

  if (cleanInline(paragraph(block, "一言コピー")) !== mapped.copy) {
    throw new Error(`Copy mismatch: ${id}`);
  }
  types[id] = type;
}

if (Object.keys(types).length !== 12) {
  throw new Error(`Expected 12 types, found ${Object.keys(types).length}`);
}

for (const type of Object.values(types)) {
  for (const relationName of ["compatible", "opposite"]) {
    const relationType = types[type[relationName].id];
    if (!relationType) {
      throw new Error(`${type.id} has invalid ${relationName} relation`);
    }
    type[relationName].character = relationType.character;
    type[relationName].image = relationType.image;
  }
}

const output = `// Generated from the source Markdown. Do not edit by hand.\nwindow.SNACK_TYPES = ${JSON.stringify(types, null, 2)};\n`;
await writeFile(join(root, "types.js"), output, "utf8");
console.log(`Generated ${Object.keys(types).length} types.`);
