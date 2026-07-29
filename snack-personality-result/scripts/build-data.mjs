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
  };

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
