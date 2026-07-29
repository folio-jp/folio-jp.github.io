import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { parseHTML } from "linkedom";

const root = new URL("../", import.meta.url).pathname;
const [html, typesCode, appCode, typesHtml, typesPageCode, typeHtml, typePageCode, quizHtml, quizDataCode, quizCode] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "types.js"), "utf8"),
  readFile(join(root, "app.js"), "utf8"),
  readFile(join(root, "types.html"), "utf8"),
  readFile(join(root, "types-page.js"), "utf8"),
  readFile(join(root, "type.html"), "utf8"),
  readFile(join(root, "type-page.js"), "utf8"),
  readFile(join(root, "quiz.html"), "utf8"),
  readFile(join(root, "quiz-data.js"), "utf8"),
  readFile(join(root, "quiz.js"), "utf8"),
]);

const EXPECTED = {
  T01: ["ときめきシェアラー", "シェアリ", "#F28C8C", "T07", "T03"],
  T02: ["ほっとひと息クラシック派", "クラノ", "#B98A5C", "T08", "T04"],
  T03: ["こだわりカカオ派", "カカリオ", "#4B2E2A", "T09", "T07"],
  T04: ["冒険スナッカー", "スナッピ", "#39BFC4", "T11", "T02"],
  T05: ["刺激ハンター", "ビリッツ", "#E84C3D", "T04", "T12"],
  T06: ["ごほうびリッチ派", "リッチェ", "#8D4567", "T01", "T09"],
  T07: ["さくさくムードメーカー", "サクポン", "#F4C542", "T01", "T03"],
  T08: ["じっくりマイペース派", "モグリィ", "#88A98A", "T02", "T05"],
  T09: ["きっちりヘルシー派", "トトノ", "#5EAD79", "T03", "T06"],
  T10: ["ノスタルジーコレクター", "オモイネ", "#C98282", "T12", "T11"],
  T11: ["ひらめきフレーバー派", "ヒラメキィ", "#845EC2", "T04", "T10"],
  T12: ["まろやか癒し派", "マロネ", "#B8A7D9", "T10", "T05"],
};

const boot = (query = "") => {
  const { window, document } = parseHTML(html);
  const location = new URL(`https://example.test/${query}`);
  Object.defineProperty(window, "location", { value: location, configurable: true });
  Object.defineProperty(window, "history", {
    value: { replaceState: () => {} },
    configurable: true,
  });
  Object.defineProperty(window, "navigator", {
    value: {
      clipboard: { writeText: async () => {} },
    },
    configurable: true,
  });
  window.print = () => {};
  window.setTimeout = setTimeout;
  window.clearTimeout = clearTimeout;
  window.URL = URL;
  window.URLSearchParams = URLSearchParams;

  const context = vm.createContext({
    window,
    document,
    navigator: window.navigator,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    console,
  });
  vm.runInContext(typesCode, context, { filename: "types.js" });
  vm.runInContext(appCode, context, { filename: "app.js" });
  return { window, document, types: window.SNACK_TYPES };
};

const loadQuizData = () => {
  const window = {};
  const context = vm.createContext({ window, URL });
  vm.runInContext(quizDataCode, context, { filename: "quiz-data.js" });
  return window.SNACK_QUIZ;
};

const bootBrowse = (page, query = "") => {
  const source = page === "types" ? typesHtml : typeHtml;
  const pageCode = page === "types" ? typesPageCode : typePageCode;
  const { window, document } = parseHTML(source);
  const location = new URL(`https://example.test/${page}.html${query}`);
  Object.defineProperty(window, "location", { value: location, configurable: true });
  Object.defineProperty(window, "history", {
    value: { length: 1, back: () => {} },
    configurable: true,
  });
  window.URLSearchParams = URLSearchParams;
  const context = vm.createContext({
    window,
    document,
    URL,
    URLSearchParams,
    console,
  });
  vm.runInContext(typesCode, context, { filename: "types.js" });
  vm.runInContext(pageCode, context, { filename: `${page}-page.js` });
  return { window, document, types: window.SNACK_TYPES };
};

test("12タイプの正本対応が完全である", () => {
  const { types } = boot();
  assert.equal(Object.keys(types).length, 12);
  for (const [id, expected] of Object.entries(EXPECTED)) {
    const [name, character, color, compatible, opposite] = expected;
    const type = types[id];
    assert.equal(type.name, name);
    assert.equal(type.character, character);
    assert.equal(type.color, color);
    assert.equal(type.compatible.id, compatible);
    assert.equal(type.opposite.id, opposite);
    assert.match(type.copy, /。$/);
    assert.match(type.image, new RegExp(`assets/${id}_`));
    assert.ok(type.overall.length > 80);
    assert.equal(type.strengths.length, 3);
    assert.equal(type.cautions.length, 2);
  }
});

test("T01〜T12をURLで切り替え、画像・文章・相性を描画する", () => {
  for (const [id, expected] of Object.entries(EXPECTED)) {
    const { document, types } = boot(
      `?m=${id}&s=T07&t=T10&a=55,95,40,75,30&p=50,30,20&snack=ポッキー`,
    );
    assert.equal(document.getElementById("hero-type-id").textContent, id);
    assert.equal(document.getElementById("result-title").textContent, expected[0]);
    assert.equal(document.getElementById("hero-character").textContent, expected[1]);
    assert.equal(document.getElementById("hero-copy").textContent, types[id].copy);
    assert.equal(document.getElementById("hero-image").getAttribute("src"), types[id].image);
    assert.equal(
      document.getElementById("compatible-id").textContent,
      types[id].compatible.id,
    );
    assert.equal(
      document.getElementById("opposite-id").textContent,
      types[id].opposite.id,
    );
    assert.equal(document.querySelectorAll(".radar-dot").length, 5);
    assert.equal(document.querySelectorAll(".radar-grid").length, 5);
    assert.equal(document.querySelectorAll(".radar-shape").length, 1);
  }
});

test("指定4サンプルURLの値を正しく描画する", () => {
  const cases = [
    ["T01", "T07", "T10", "55,95,40,75,30", "50,30,20", "ポッキー"],
    ["T07", "T05", "T04", "66,74,54,43,74", "48,31,21", "プリッツ"],
    ["T11", "T04", "T03", "97,53,82,22,68", "52,30,18", "百味ビーンズ"],
    ["T12", "T10", "T02", "30,50,40,100,15", "55,25,20", "マシュマロ"],
  ];
  for (const [main, sub, third, axes, proportions, snack] of cases) {
    const { document } = boot(
      `?m=${main}&s=${sub}&t=${third}&a=${axes}&p=${proportions}&snack=${encodeURIComponent(snack)}`,
    );
    assert.equal(document.getElementById("hero-type-id").textContent, main);
    assert.equal(document.getElementById("subtype-id").textContent, sub);
    assert.equal(document.getElementById("hero-snack").textContent, snack);
    assert.deepEqual(
      [...document.querySelectorAll(".axis-number")].map((node) =>
        Number.parseInt(node.textContent, 10),
      ),
      axes.split(",").map(Number),
    );
    assert.deepEqual(
      [...document.querySelectorAll(".blend-percent")].map((node) =>
        Number.parseInt(node.textContent, 10),
      ),
      proportions.split(",").map(Number),
    );
    assert.equal(document.querySelectorAll(".blend-row").length, 3);
  }
});

test("異常な必須値は結果へ補正せず案内画面へ戻し、任意HTMLを実行しない", () => {
  for (const query of [
    "?m=T99&s=T02&t=T03&a=1,2,3,4,5&p=50,30,20",
    "?m=T01&s=T02&t=T03&a=文字列&p=50,30,20",
    "?m=T01&s=T02&t=T03&a=1,2,3,4,5",
    "?m=T01&s=T02&t=T03&a=1,2,3,4,5&p=0,0,0",
  ]) {
    const { document } = boot(query);
    assert.equal(document.body.classList.contains("is-landing"), true);
    assert.equal(document.getElementById("landing-view").hidden, false);
    assert.equal(document.getElementById("hero-type-id").textContent, "");
    assert.equal(document.getElementById("landing-error").hidden, false);
  }

  const scriptPayload = "<script>globalThis.PWNED=true</script><img src=x onerror=alert(1)>";
  const attack = boot(
    `?m=T01&s=T02&t=T03&a=1,2,3,4,5&p=50,30,20&snack=${encodeURIComponent(scriptPayload)}`,
  );
  assert.equal(attack.window.PWNED, undefined);
  assert.equal(attack.document.querySelectorAll("main script").length, 0);
  assert.match(attack.document.getElementById("hero-snack").textContent, /<script>/);
});

test("パラメータなしではサンプルを出さず診断案内を表示する", () => {
  const { document } = boot();
  assert.equal(document.body.classList.contains("is-landing"), true);
  assert.equal(document.getElementById("landing-view").hidden, false);
  assert.equal(document.getElementById("hero-type-id").textContent, "");
  assert.equal(document.getElementById("status-notice").hidden, true);
  assert.equal(
    document.getElementById("landing-title").textContent.replace(/\s+/g, ""),
    "好きなお菓子から、あなたの12タイプを見つけよう",
  );
  assert.equal(document.querySelector('a[href="types.html"]').textContent.trim(), "全12タイプを見る");
  assert.equal(document.getElementById("start-diagnosis").getAttribute("aria-disabled"), null);
  assert.equal(
    document.getElementById("start-diagnosis").getAttribute("href"),
    "quiz.html",
  );
  assert.doesNotMatch(document.getElementById("landing-view").textContent, /カスタムGPT/);
});

test("明示的なdemo=1でのみデモ結果を表示する", () => {
  const { document } = boot("?demo=1");
  assert.equal(document.body.classList.contains("is-result"), true);
  assert.equal(document.getElementById("hero-type-id").textContent, "T07");
  assert.equal(document.getElementById("status-notice").hidden, false);
  assert.match(document.getElementById("status-message").textContent, /デモ結果/);
});

test("正常な本番パラメータでは案内を出さず実際の結果だけを表示する", () => {
  const { document } = boot(
    "?m=T07&s=T05&t=T04&a=66,74,54,43,74&p=48,31,21&snack=プリッツ",
  );
  assert.equal(document.body.classList.contains("is-result"), true);
  assert.equal(document.getElementById("landing-view").hidden, true);
  assert.equal(document.getElementById("status-notice").hidden, true);
  assert.equal(document.getElementById("hero-type-id").textContent, "T07");
  assert.equal(document.getElementById("hero-snack").textContent, "プリッツ");
});

test("snack省略時も正常な結果として表示する", () => {
  const { document } = boot("?m=T12&s=T10&t=T02&a=30,50,40,100,15&p=55,25,20");
  assert.equal(document.body.classList.contains("is-result"), true);
  assert.equal(document.getElementById("hero-type-id").textContent, "T12");
  assert.equal(document.getElementById("hero-snack").textContent, "未指定");
  assert.match(document.getElementById("summary-lead").textContent, /好きなお菓子への回答/);
});

test("アクセシビリティと印刷に必要な構造が存在する", () => {
  const { document } = boot(
    "?m=T12&s=T10&t=T02&a=30,50,40,100,15&p=55,25,20&snack=マシュマロ",
  );
  assert.ok(document.querySelector(".skip-link"));
  assert.ok(document.querySelector("[aria-live='polite']"));
  assert.ok(document.getElementById("hero-image").getAttribute("alt"));
  assert.equal(document.querySelectorAll("[role='progressbar']").length, 8);
  assert.ok(document.getElementById("print-result"));
  assert.ok(document.getElementById("copy-text"));
  assert.ok(document.getElementById("copy-url"));
});

test("診断結果の相性直後に全タイプCTAがある", () => {
  const { document } = boot(
    "?m=T07&s=T05&t=T04&a=66,74,54,43,74&p=48,31,21&snack=プリッツ",
  );
  const cta = document.querySelector(".all-types-cta");
  assert.ok(cta);
  assert.equal(cta.previousElementSibling.id, "");
  assert.equal(cta.previousElementSibling.querySelector("h2").textContent, "タイプ相性");
  assert.equal(cta.querySelector("a").getAttribute("href"), "types.html");
  assert.equal(cta.querySelectorAll("img").length, 4);
});

test("全12タイプ一覧をT01〜T12順で描画し、複数カテゴリーで絞り込める", () => {
  const { document, types } = bootBrowse("types");
  const cards = [...document.querySelectorAll(".type-card")];
  assert.equal(cards.length, 12);
  assert.deepEqual(
    cards.map((card) => card.querySelector(".type-card-id").textContent),
    Object.keys(EXPECTED),
  );
  cards.forEach((card, index) => {
    const id = Object.keys(EXPECTED)[index];
    assert.equal(card.querySelector("img").getAttribute("src"), types[id].image);
    assert.equal(card.querySelectorAll(".tag-row span").length, 3);
    assert.equal(card.querySelector("a").getAttribute("href"), `type.html?id=${id}`);
    assert.ok(card.querySelector(".type-card-description").textContent.length > 50);
  });
  const calm = document.querySelector("[data-filter='calm']");
  calm.dispatchEvent(new document.defaultView.Event("click"));
  const visible = cards.filter((card) => !card.hidden);
  assert.ok(visible.length >= 4);
  assert.ok(visible.every((card) => card.dataset.categories.includes("calm")));
  assert.equal(calm.getAttribute("aria-pressed"), "true");
});

test("T01〜T12の詳細ページが共有データから完全に描画される", () => {
  for (const id of Object.keys(EXPECTED)) {
    const { document, types } = bootBrowse("type", `?id=${id}`);
    const type = types[id];
    assert.equal(document.getElementById("type-view").hidden, false);
    assert.equal(document.getElementById("invalid-type").hidden, true);
    assert.equal(document.getElementById("detail-id").textContent, id);
    assert.equal(document.getElementById("detail-title").textContent, type.name);
    assert.equal(document.getElementById("detail-character").textContent, type.character);
    assert.equal(document.getElementById("detail-image").getAttribute("src"), type.image);
    assert.equal(document.querySelectorAll(".basic-detail-card").length, 3);
    assert.equal(document.querySelectorAll(".detail-strength-card").length, 3);
    assert.equal(document.querySelectorAll(".detail-caution-card").length, 2);
    assert.equal(document.querySelectorAll(".snack-style-card").length, 5);
    assert.equal(document.querySelectorAll("#similar-types .relation-detail-card").length, 2);
    assert.equal(document.querySelectorAll("#detail-relations .relation-detail-card").length, 2);
    assert.equal(document.querySelectorAll(".relation-detail-card img").length, 4);
    assert.match(document.getElementById("prev-type").getAttribute("href"), /^type\.html\?id=T\d{2}$/);
    assert.match(document.getElementById("next-type").getAttribute("href"), /^type\.html\?id=T\d{2}$/);
  }
});

test("無効な詳細IDはT01に偽装せず専用エラーを表示する", () => {
  for (const query of ["", "?id=T99", "?id=%3Cscript%3Ealert(1)%3C/script%3E"]) {
    const { document, window } = bootBrowse("type", query);
    assert.equal(document.getElementById("invalid-type").hidden, false);
    assert.equal(document.getElementById("type-view").hidden, true);
    assert.equal(document.getElementById("detail-title").textContent, "");
    assert.equal(window.PWNED, undefined);
  }
});

test("Q1〜Q10の設問・選択肢が指定内容と完全一致する", () => {
  const quiz = loadQuizData();
  assert.equal(
    quiz.QUESTION_ONE.text,
    "一番好きなお菓子を、商品名や味まで教えてください。",
  );
  assert.equal(
    quiz.QUESTION_ONE.help,
    "味や食感が分かりにくい商品の場合は、特徴も一緒に教えてください。",
  );

  const expected = [
    [2, "一番惹かれる味は？", ["やさしい甘さ", "濃厚な甘さ", "塩味・うま味", "苦味・甘さ控えめ", "辛味・酸味", "複雑な味"]],
    [3, "一番好きな食感は？", ["サクサク・パリパリ", "ザクザク・硬め", "もちもち・噛み応え", "ふわふわ・しっとり", "なめらか・口溶け", "複数食感"]],
    [4, "お菓子に一番求めるものは？", ["軽く何度もつまめる", "一口でも濃厚", "甘さ控えめの余韻", "目が覚めるインパクト", "心がほどけるやさしさ", "栄養・機能性"]],
    [5, "一番食べたくなるのは？", ["一人でゆっくり休憩", "仕事・勉強を頑張った後", "疲れた時・落ち込んだ時", "暇・気分転換", "友達・家族と一緒", "毎日ほぼ同じ時間"]],
    [6, "食べる理由は？", ["安心・癒し", "新しい発見・ワクワク", "強い刺激で気分を上げる", "誰かと楽しさを共有", "自分へのごほうび", "集中力・調子を整える"]],
    [7, "食後どんな気分になりたい？", ["落ち着く", "元気になる", "贅沢な満足", "つながりを感じる", "自分を整えた感覚", "驚き・ひらめき"]],
    [8, "選び方は？", ["ほぼ毎回定番", "基本定番、時々新作", "定番と新作半々", "新作・限定を積極的に試す", "海外・変わった味を優先"]],
    [9, "一番好きな楽しみ方は？", ["みんなで分ける", "親しい人と二人", "一人で静かに味わう", "動画・作業をしながら一人", "気分や商品で変わる", "時間と量を決めて一人"]],
    [10, "食べるペースは？", ["量を先に決める", "少しずつゆっくり", "開けたら一気に食べ切る", "誰かと分ける・少し残す", "気分で量が変わる", "複数の味を食べ比べる"]],
  ];
  assert.equal(
    JSON.stringify(
      quiz.QUESTIONS.map((question) => [
        question.id,
        question.text,
        question.options.map((option) => option.label),
      ]),
    ),
    JSON.stringify(expected),
  );
});

test("全選択肢の配点合計が設問点と一致し、Q1〜Q10が100点になる", () => {
  const quiz = loadQuizData();
  for (const question of quiz.QUESTIONS) {
    for (const option of question.options) {
      assert.equal(
        Object.values(option.scores).reduce((sum, value) => sum + value, 0),
        question.points,
        `Q${question.id}${option.key}`,
      );
    }
  }
  const q1 = quiz.classifySnack("じゃがりこ サラダ味");
  assert.equal(Object.values(q1.scores).reduce((sum, value) => sum + value, 0), 30);
  assert.equal(
    quiz.QUESTION_ONE.points +
      quiz.QUESTIONS.reduce((sum, question) => sum + question.points, 0),
    100,
  );
});

test("Q1辞書が商品名・表記揺れ・修飾語を分類し、未知商品は追加確認する", () => {
  const quiz = loadQuizData();
  const cases = [
    ["じゃがりこ サラダ味", "T07"],
    ["ＰＲＥＴＺ 塩味", "T07"],
    ["ポッキー", "T01"],
    ["堅あげポテト", "T08"],
    ["堅揚げポテト", "T08"],
    ["濃厚な生チョコ", "T06"],
    ["すっぱいグミ", "T05"],
    ["マシュマロ", "T12"],
    ["栗饅頭", "T02"],
    ["百味ビーンズ", "T11"],
    ["低糖質プロテインバー", "T09"],
    ["期間限定じゃがりこ", "T04"],
  ];
  for (const [snack, expectedTop] of cases) {
    const result = quiz.classifySnack(snack);
    assert.equal(result.needsFollowUp, false, snack);
    const top = Object.entries(result.scores).sort((a, b) => b[1] - a[1])[0][0];
    assert.equal(top, expectedTop, snack);
    assert.equal(Object.values(result.scores).reduce((sum, value) => sum + value, 0), 30);
  }

  const unknown = quiz.classifySnack("宇宙雲菓子");
  assert.equal(unknown.needsFollowUp, true);
  assert.equal(unknown.scores, null);
  const completed = quiz.classifySnack("宇宙雲菓子", {
    taste: "F",
    texture: "A",
  });
  assert.equal(completed.needsFollowUp, false);
  assert.equal(Object.values(completed.scores).reduce((sum, value) => sum + value, 0), 30);
});

const answersFavoring = (quiz, id) =>
  Object.fromEntries(
    quiz.QUESTIONS.map((question) => {
      const selected = [...question.options].sort(
        (a, b) => (b.scores[id] ?? 0) - (a.scores[id] ?? 0),
      )[0];
      return [String(question.id), selected.key];
    }),
  );

test("プリッツ・百味ビーンズ・マシュマロ・定番重視の回帰ケースが一致する", () => {
  const quiz = loadQuizData();
  const cases = [
    ["プリッツ", "T07"],
    ["百味ビーンズ", "T11"],
    ["マシュマロ", "T12"],
    ["せんべい", "T02"],
  ];
  for (const [snack, expected] of cases) {
    const result = quiz.scoreQuiz({
      snack,
      supplemental: {},
      answers: answersFavoring(quiz, expected),
    });
    assert.equal(result.main, expected, snack);
    assert.equal(Object.values(result.totals).reduce((sum, value) => sum + value, 0), 100);
    assert.equal(result.proportions.reduce((sum, value) => sum + value, 0), 100);
    assert.equal(result.axes.length, 5);
    assert.ok(result.axes.every((value) => Number.isInteger(value) && value >= 0 && value <= 100));
  }
});

test("T01〜T12がすべてメインタイプとして出現可能である", () => {
  const quiz = loadQuizData();
  const snacks = {
    T01: "ポッキー",
    T02: "せんべい",
    T03: "ビターチョコ",
    T04: "期間限定じゃがりこ",
    T05: "激辛カラムーチョ",
    T06: "濃厚な生チョコ",
    T07: "プリッツ",
    T08: "グミ",
    T09: "プロテインバー",
    T10: "思い出のうまい棒",
    T11: "百味ビーンズ",
    T12: "マシュマロ",
  };
  const t10Answers = {
    2: "D",
    3: "F",
    4: "E",
    5: "A",
    6: "A",
    7: "F",
    8: "B",
    9: "B",
    10: "D",
  };
  for (const id of quiz.TYPE_IDS) {
    const result = quiz.scoreQuiz({
      snack: snacks[id],
      supplemental: {},
      answers: id === "T10" ? t10Answers : answersFavoring(quiz, id),
    });
    assert.equal(result.main, id, `${id}が出現しません`);
  }
});

test("結果URLは生得点を含まず、共有先で再現できる値だけを持つ", () => {
  const quiz = loadQuizData();
  const result = quiz.scoreQuiz({
    snack: "プリッツ",
    supplemental: {},
    answers: answersFavoring(quiz, "T07"),
  });
  const url = new URL(
    quiz.resultUrl(result, "https://example.test/snack-personality-result/index.html"),
  );
  assert.equal(url.searchParams.get("m"), result.main);
  assert.equal(url.searchParams.get("s"), result.sub);
  assert.equal(url.searchParams.get("t"), result.third);
  assert.equal(url.searchParams.get("a"), result.axes.join(","));
  assert.equal(url.searchParams.get("p"), result.proportions.join(","));
  assert.equal(url.searchParams.get("snack"), "プリッツ");
  assert.equal(url.searchParams.has("scores"), false);
  assert.equal(url.searchParams.has("totals"), false);
});

test("診断画面は1問表示・進捗・戻る・再開・リセット用の構造を持つ", () => {
  const { document } = parseHTML(quizHtml);
  assert.ok(document.getElementById("progress-track"));
  assert.ok(document.getElementById("answer-area"));
  assert.ok(document.getElementById("previous-question"));
  assert.ok(document.getElementById("next-question"));
  assert.ok(document.getElementById("reset-quiz"));
  assert.ok(document.getElementById("reset-dialog"));
  assert.match(quizCode, /localStorage\.setItem/);
  assert.match(quizCode, /popstate/);
  assert.match(quizCode, /sessionStorage\.setItem/);
});

test("Q1入力はHTMLとして解釈せず、制御文字と長すぎる入力を制限する", () => {
  const quiz = loadQuizData();
  const payload = "<script>alert(1)</script>".repeat(20);
  const sanitized = quiz.sanitizeSnackInput(`${payload}\u0000`);
  assert.ok(Array.from(sanitized).length <= 80);
  assert.doesNotMatch(sanitized, /\u0000/);
  const classified = quiz.classifySnack(sanitized, { taste: "F", texture: "F" });
  assert.equal(classified.needsFollowUp, false);
});
