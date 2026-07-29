import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";
import { parseHTML } from "linkedom";

const root = new URL("../", import.meta.url).pathname;
const [html, typesCode, appCode] = await Promise.all([
  readFile(join(root, "index.html"), "utf8"),
  readFile(join(root, "types.js"), "utf8"),
  readFile(join(root, "app.js"), "utf8"),
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

test("異常値を安全に補正し、任意HTMLを実行可能なDOMにしない", () => {
  const longSnack = "あ".repeat(100);
  const { document } = boot(
    `?m=T99&s=&t=T88&a=文字列&p=1,1,1&snack=${encodeURIComponent(longSnack)}`,
  );
  assert.equal(document.getElementById("hero-type-id").textContent, "T07");
  assert.deepEqual(
    [...document.querySelectorAll(".axis-number")].map((node) =>
      Number.parseInt(node.textContent, 10),
    ),
    [66, 74, 54, 43, 74],
  );
  assert.equal(
    [...document.querySelectorAll(".blend-percent")].reduce(
      (sum, node) => sum + Number.parseInt(node.textContent, 10),
      0,
    ),
    100,
  );
  assert.equal(Array.from(document.getElementById("hero-snack").textContent).length, 40);
  assert.equal(document.getElementById("status-notice").hidden, false);

  const scriptPayload = "<script>globalThis.PWNED=true</script><img src=x onerror=alert(1)>";
  const attack = boot(
    `?m=T01&s=T02&t=T03&a=1,2,3,4,5&p=50,30,20&snack=${encodeURIComponent(scriptPayload)}`,
  );
  assert.equal(attack.window.PWNED, undefined);
  assert.equal(attack.document.querySelectorAll("main script").length, 0);
  assert.match(attack.document.getElementById("hero-snack").textContent, /<script>/);
});

test("パラメータなしでは説明付きサンプルを表示する", () => {
  const { document } = boot();
  assert.equal(document.getElementById("hero-type-id").textContent, "T07");
  assert.equal(document.getElementById("status-notice").hidden, false);
  assert.match(document.getElementById("status-message").textContent, /サンプル結果/);
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
