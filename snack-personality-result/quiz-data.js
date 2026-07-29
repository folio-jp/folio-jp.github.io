(() => {
  "use strict";

  const TYPE_IDS = Object.freeze(
    Array.from({ length: 12 }, (_, index) => `T${String(index + 1).padStart(2, "0")}`),
  );

  const QUESTION_ONE = Object.freeze({
    id: 1,
    text: "一番好きなお菓子を、商品名や味まで教えてください。",
    help: "味や食感が分かりにくい商品の場合は、特徴も一緒に教えてください。",
    examples: [
      "じゃがりこ サラダ味",
      "濃厚な生チョコ",
      "すっぱいグミ",
      "栗まんじゅう",
      "海外の変わった味のキャンディ",
    ],
    points: 30,
  });

  const QUESTIONS = Object.freeze([
    {
      id: 2,
      text: "一番惹かれる味は？",
      points: 15,
      options: [
        ["A", "やさしい甘さ", { T12: 9, T01: 4.5, T02: 1.5 }],
        ["B", "濃厚な甘さ", { T06: 9, T01: 4.5, T12: 1.5 }],
        ["C", "塩味・うま味", { T07: 9, T02: 4.5, T08: 1.5 }],
        ["D", "苦味・甘さ控えめ", { T03: 9, T09: 4.5, T11: 1.5 }],
        ["E", "辛味・酸味", { T05: 9, T04: 4.5, T11: 1.5 }],
        ["F", "複雑な味", { T11: 9, T04: 4.5, T03: 1.5 }],
      ],
    },
    {
      id: 3,
      text: "一番好きな食感は？",
      points: 10,
      options: [
        ["A", "サクサク・パリパリ", { T07: 6, T01: 3, T04: 1 }],
        ["B", "ザクザク・硬め", { T05: 6, T08: 3, T03: 1 }],
        ["C", "もちもち・噛み応え", { T08: 6, T04: 3, T10: 1 }],
        ["D", "ふわふわ・しっとり", { T12: 6, T10: 3, T01: 1 }],
        ["E", "なめらか・口溶け", { T06: 6, T12: 3, T03: 1 }],
        ["F", "複数食感", { T11: 6, T06: 3, T04: 1 }],
      ],
    },
    {
      id: 4,
      text: "お菓子に一番求めるものは？",
      points: 5,
      options: [
        ["A", "軽く何度もつまめる", { T07: 3, T01: 1.5, T08: 0.5 }],
        ["B", "一口でも濃厚", { T06: 3, T03: 1.5, T12: 0.5 }],
        ["C", "甘さ控えめの余韻", { T03: 3, T09: 1.5, T02: 0.5 }],
        ["D", "目が覚めるインパクト", { T05: 3, T04: 1.5, T07: 0.5 }],
        ["E", "心がほどけるやさしさ", { T12: 3, T10: 1.5, T02: 0.5 }],
        ["F", "栄養・機能性", { T09: 3, T08: 1.5, T03: 0.5 }],
      ],
    },
    {
      id: 5,
      text: "一番食べたくなるのは？",
      points: 10,
      options: [
        ["A", "一人でゆっくり休憩", { T12: 6, T02: 3, T08: 1 }],
        ["B", "仕事・勉強を頑張った後", { T06: 6, T09: 3, T03: 1 }],
        ["C", "疲れた時・落ち込んだ時", { T12: 6, T06: 3, T10: 1 }],
        ["D", "暇・気分転換", { T05: 6, T04: 3, T07: 1 }],
        ["E", "友達・家族と一緒", { T01: 6, T07: 3, T10: 1 }],
        ["F", "毎日ほぼ同じ時間", { T08: 6, T02: 3, T09: 1 }],
      ],
    },
    {
      id: 6,
      text: "食べる理由は？",
      points: 10,
      options: [
        ["A", "安心・癒し", { T12: 6, T10: 3, T02: 1 }],
        ["B", "新しい発見・ワクワク", { T04: 6, T11: 3, T05: 1 }],
        ["C", "強い刺激で気分を上げる", { T05: 6, T07: 3, T04: 1 }],
        ["D", "誰かと楽しさを共有", { T01: 6, T07: 3, T10: 1 }],
        ["E", "自分へのごほうび", { T06: 6, T03: 3, T12: 1 }],
        ["F", "集中力・調子を整える", { T09: 6, T08: 3, T03: 1 }],
      ],
    },
    {
      id: 7,
      text: "食後どんな気分になりたい？",
      points: 5,
      options: [
        ["A", "落ち着く", { T12: 3, T02: 1.5, T10: 0.5 }],
        ["B", "元気になる", { T05: 3, T07: 1.5, T04: 0.5 }],
        ["C", "贅沢な満足", { T06: 3, T03: 1.5, T01: 0.5 }],
        ["D", "つながりを感じる", { T01: 3, T10: 1.5, T07: 0.5 }],
        ["E", "自分を整えた感覚", { T09: 3, T08: 1.5, T03: 0.5 }],
        ["F", "驚き・ひらめき", { T11: 3, T04: 1.5, T05: 0.5 }],
      ],
    },
    {
      id: 8,
      text: "選び方は？",
      points: 5,
      options: [
        ["A", "ほぼ毎回定番", { T02: 3, T10: 1.5, T08: 0.5 }],
        ["B", "基本定番、時々新作", { T07: 3, T01: 1.5, T12: 0.5 }],
        ["C", "定番と新作半々", { T11: 3, T03: 1.5, T06: 0.5 }],
        ["D", "新作・限定を積極的に試す", { T04: 3, T11: 1.5, T05: 0.5 }],
        ["E", "海外・変わった味を優先", { T11: 3, T04: 1.5, T03: 0.5 }],
      ],
    },
    {
      id: 9,
      text: "一番好きな楽しみ方は？",
      points: 5,
      options: [
        ["A", "みんなで分ける", { T01: 3, T07: 1.5, T04: 0.5 }],
        ["B", "親しい人と二人", { T10: 3, T12: 1.5, T01: 0.5 }],
        ["C", "一人で静かに味わう", { T03: 3, T08: 1.5, T02: 0.5 }],
        ["D", "動画・作業をしながら一人", { T07: 3, T06: 1.5, T05: 0.5 }],
        ["E", "気分や商品で変わる", { T11: 3, T04: 1.5, T06: 0.5 }],
        ["F", "時間と量を決めて一人", { T09: 3, T08: 1.5, T03: 0.5 }],
      ],
    },
    {
      id: 10,
      text: "食べるペースは？",
      points: 5,
      options: [
        ["A", "量を先に決める", { T09: 3, T08: 1.5, T03: 0.5 }],
        ["B", "少しずつゆっくり", { T08: 3, T03: 1.5, T02: 0.5 }],
        ["C", "開けたら一気に食べ切る", { T06: 3, T07: 1.5, T05: 0.5 }],
        ["D", "誰かと分ける・少し残す", { T01: 3, T12: 1.5, T09: 0.5 }],
        ["E", "気分で量が変わる", { T12: 3, T06: 1.5, T04: 0.5 }],
        ["F", "複数の味を食べ比べる", { T11: 3, T04: 1.5, T03: 0.5 }],
      ],
    },
  ].map((question) =>
    Object.freeze({
      ...question,
      options: Object.freeze(
        question.options.map(([key, label, scores]) =>
          Object.freeze({ key, label, scores: Object.freeze(scores) }),
        ),
      ),
    }),
  ));

  const AXIS_BASES = Object.freeze({
    T01: [55, 95, 40, 75, 30],
    T02: [25, 30, 65, 95, 15],
    T03: [75, 30, 100, 40, 55],
    T04: [100, 60, 55, 15, 80],
    T05: [75, 55, 55, 10, 100],
    T06: [50, 55, 80, 55, 80],
    T07: [50, 90, 35, 50, 75],
    T08: [30, 30, 80, 80, 30],
    T09: [50, 30, 95, 60, 25],
    T10: [30, 55, 60, 100, 15],
    T11: [100, 55, 90, 15, 70],
    T12: [30, 50, 40, 100, 15],
  });

  const SUPPLEMENTAL = Object.freeze({
    taste: Object.freeze({
      question: "そのお菓子に一番近い味は？",
      options: Object.freeze([
        ["A", "やさしい甘さ", ["T12", "T01", "T02"]],
        ["B", "濃厚な甘さ", ["T06", "T01", "T12"]],
        ["C", "塩味・うま味", ["T07", "T02", "T08"]],
        ["D", "苦味・甘さ控えめ", ["T03", "T09", "T11"]],
        ["E", "辛味・酸味", ["T05", "T04", "T11"]],
        ["F", "複雑・変わった味", ["T11", "T04", "T03"]],
      ]),
    }),
    texture: Object.freeze({
      question: "そのお菓子に一番近い食感は？",
      options: Object.freeze([
        ["A", "サクサク・パリパリ", ["T07", "T01", "T04"]],
        ["B", "ザクザク・硬め", ["T05", "T08", "T03"]],
        ["C", "もちもち・噛み応え", ["T08", "T04", "T10"]],
        ["D", "ふわふわ・しっとり", ["T12", "T10", "T01"]],
        ["E", "なめらか・口溶け", ["T06", "T12", "T03"]],
        ["F", "複数の食感", ["T11", "T06", "T04"]],
      ]),
    }),
  });

  const PRODUCT_RULES = Object.freeze([
    [["ひゃくみびーんず", "百味びーんず", "百味ビーンズ"], ["T11", "T04", "T03"], [18, 9, 3]],
    [["じゃがりこ"], ["T07", "T08", "T02"], [18, 9, 3]],
    [["ぷりっつ", "pretz"], ["T07", "T05", "T04"], [18, 9, 3]],
    [["ぽっきー", "pocky"], ["T01", "T07", "T10"], [18, 9, 3]],
    [["かたあげぽてと", "堅あげぽてと", "堅揚げぽてと"], ["T08", "T07", "T05"], [15, 9, 6]],
    [["ぽてとちっぷす", "ぽてち"], ["T07", "T06", "T10"], [18, 9, 3]],
    [["なまちょこ", "生ちょこ"], ["T06", "T12", "T03"], [18, 9, 3]],
    [["ちょこれーと", "ちょこ"], ["T01", "T06", "T12"], [15, 9, 6]],
    [["はーどぐみ"], ["T08", "T05", "T04"], [15, 9, 6]],
    [["ぐみ"], ["T08", "T04", "T11"], [15, 9, 6]],
    [["ましゅまろ"], ["T12", "T01", "T10"], [18, 9, 3]],
    [["そふとくっきー"], ["T12", "T06", "T02"], [15, 9, 6]],
    [["くっきー", "びすけっと"], ["T02", "T10", "T08"], [18, 9, 3]],
    [["せんべい", "煎餅", "おかき", "あられ"], ["T02", "T10", "T08"], [18, 9, 3]],
    [["かりんとう"], ["T02", "T10", "T08"], [18, 9, 3]],
    [["くりまんじゅう", "栗饅頭", "栗まんじゅう"], ["T02", "T10", "T12"], [15, 9, 6]],
    [["ぶらっくさんだー", "ぶらさん"], ["T06", "T07", "T05"], [15, 9, 6]],
    [["きっとかっと"], ["T01", "T10", "T06"], [18, 9, 3]],
    [["あるふぉーと"], ["T01", "T02", "T10"], [15, 9, 6]],
    [["ちょこぱい"], ["T06", "T12", "T10"], [18, 9, 3]],
    [["かんとりーまあむ"], ["T10", "T12", "T02"], [15, 9, 6]],
    [["おれお"], ["T11", "T06", "T01"], [12, 9, 9]],
    [["はいちゅう"], ["T08", "T10", "T01"], [18, 9, 3]],
    [["のどあめ"], ["T09", "T08", "T02"], [15, 9, 6]],
    [["きゃんでぃ", "あめ", "飴"], ["T08", "T02", "T12"], [15, 9, 6]],
    [["らむね"], ["T10", "T08", "T07"], [15, 9, 6]],
    [["ぷりん"], ["T12", "T06", "T02"], [15, 9, 6]],
    [["しゅーくりーむ"], ["T12", "T06", "T01"], [12, 12, 6]],
    [["だいふく"], ["T12", "T02", "T10"], [15, 9, 6]],
    [["どらやき"], ["T10", "T02", "T12"], [15, 9, 6]],
    [["ようかん", "羊羹"], ["T02", "T03", "T08"], [15, 9, 6]],
    [["ちーずけーき"], ["T06", "T03", "T11"], [15, 9, 6]],
    [["どーなつ"], ["T06", "T07", "T01"], [15, 9, 6]],
    [["あいすくりーむ", "あいす"], ["T06", "T01", "T12"], [15, 9, 6]],
    [["すやきなっつ"], ["T09", "T03", "T08"], [18, 9, 3]],
    [["どらいふるーつ"], ["T09", "T11", "T12"], [15, 9, 6]],
    [["ぷろていんばー"], ["T09", "T03", "T08"], [18, 9, 3]],
    [["うまいぼう"], ["T10", "T07", "T02"], [15, 9, 6]],
    [["べびーすたー"], ["T10", "T07", "T05"], [12, 12, 6]],
    [["からむーちょ"], ["T05", "T07", "T04"], [18, 9, 3]],
    [["ぼうくんはばねろ"], ["T05", "T04", "T11"], [18, 9, 3]],
    [["はっぴーたーん"], ["T07", "T01", "T10"], [15, 9, 6]],
    [["かっぱえびせん"], ["T07", "T10", "T02"], [18, 9, 3]],
    [["かきのたね"], ["T08", "T05", "T02"], [15, 9, 6]],
    [["うまい棒"], ["T10", "T07", "T02"], [15, 9, 6]],
  ]);

  const ATTRIBUTE_RULES = Object.freeze([
    {
      name: "taste",
      rules: [
        [["げきから", "からい", "辛い", "からくち", "はばねろ", "とうがらし", "まーらー", "麻辣", "さんしょう", "山椒", "わさび"], ["T05", "T04", "T11"]],
        [["すっぱい", "酸っぱい", "さんみ", "酸味", "さわー"], ["T05", "T04", "T11"]],
        [["びたー", "高かかお", "はいかかお", "むとう", "甘さひかえめ", "こーひー"], ["T03", "T09", "T11"]],
        [["まっちゃ", "抹茶", "ほうじちゃ", "ほうじ茶"], ["T03", "T11", "T04"]],
        [["しおきゃらめる", "あまじょっぱい", "とりゅふ", "くんせい", "燻製", "すぱいす"], ["T11", "T04", "T03"]],
        [["ちーず"], ["T06", "T07", "T05"]],
        [["しお", "塩", "うすしお", "うまみ", "旨味"], ["T07", "T02", "T08"]],
        [["はちみつ", "蜂蜜", "みるく"], ["T12", "T02", "T06"]],
      ],
    },
    {
      name: "limited",
      rules: [
        [["期間限定", "きかんげんてい", "季節限定", "きせつげんてい", "限定", "げんてい", "新作", "しんさく", "新商品", "しんしょうひん", "ご当地", "ごとうち"], ["T04", "T11", "T05"]],
        [["海外", "かいがい", "珍しい", "めずらしい"], ["T04", "T11", "T03"]],
      ],
    },
    {
      name: "texture",
      rules: [
        [["さくさく", "ぱりぱり"], ["T07", "T01", "T04"]],
        [["ざくざく", "かため", "硬め", "はーど"], ["T05", "T08", "T03"]],
        [["もちもち", "かみごたえ", "噛み応え", "だんりょく", "弾力"], ["T08", "T04", "T10"]],
        [["ふわふわ", "しっとり"], ["T12", "T10", "T01"]],
        [["なめらか", "くちどけ", "口溶け"], ["T06", "T12", "T03"]],
        [["複数食感", "ふくすうしょっかん"], ["T11", "T06", "T04"]],
      ],
    },
    {
      name: "rich",
      rules: [
        [["濃厚", "のうこう", "りっち", "こってり", "くりーむ", "ばたー"], ["T06", "T12", "T01"]],
      ],
    },
    {
      name: "health",
      rules: [
        [["高たんぱく", "こうたんぱく", "ぷろていん", "低糖質", "ていとうしつ", "糖質おふ", "とうしつおふ", "無添加", "むてんか", "砂糖不使用", "しょくもつせんい", "食物繊維"], ["T09", "T03", "T08"]],
      ],
    },
    {
      name: "reason",
      rules: [
        [["ごほうび", "ご褒美", "贅沢", "ぜいたく", "高級", "こうきゅう", "ぷれみあむ"], ["T06", "T03", "T12"]],
        [["懐かしい", "なつかしい", "子どもの頃", "こどものころ", "思い出", "おもいで", "昔から", "むかしから"], ["T10", "T02", "T12"]],
        [["みんなで", "分けやすい", "わけやすい", "家族と", "かぞくと", "友達と", "ともだちと", "しぇあ"], ["T01", "T07", "T10"]],
      ],
    },
  ]);

  const kanaToHiragana = (value) =>
    value.replace(/[\u30A1-\u30F6]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    );

  const normalizeText = (value) =>
    kanaToHiragana(
      String(value ?? "")
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .replace(/[・･\s_.,、。!！?？'"“”‘’/\\()[\]{}]/g, ""),
    );

  const sanitizeSnackInput = (value) => {
    const cleaned = String(value ?? "")
      .normalize("NFKC")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    return Array.from(cleaned).slice(0, 80).join("");
  };

  const includesAny = (normalized, aliases) =>
    aliases.some((alias) => normalized.includes(normalizeText(alias)));

  const findProduct = (normalized) =>
    PRODUCT_RULES.find(([aliases]) => includesAny(normalized, aliases)) ?? null;

  const findAttributes = (normalized) => {
    const matches = [];
    ATTRIBUTE_RULES.forEach((group) => {
      const match = group.rules.find(([terms]) => includesAny(normalized, terms));
      if (match) matches.push({ name: group.name, types: match[1] });
    });
    return matches;
  };

  const supplementalTypes = (kind, key) => {
    const option = SUPPLEMENTAL[kind].options.find(([optionKey]) => optionKey === key);
    return option?.[2] ?? [];
  };

  const scoreFromOrder = (types, weights) => {
    const scores = Object.fromEntries(TYPE_IDS.map((id) => [id, 0]));
    types.slice(0, 3).forEach((type, index) => {
      scores[type] = weights[index];
    });
    return scores;
  };

  const classifySnack = (input, supplemental = {}) => {
    const snack = sanitizeSnackInput(input);
    const normalized = normalizeText(snack);
    const product = findProduct(normalized);
    const attributes = findAttributes(normalized);
    const needsFollowUp = !product;

    if (needsFollowUp && (!supplemental.taste || !supplemental.texture)) {
      return {
        snack,
        normalized,
        needsFollowUp: true,
        scores: null,
        direct: null,
        source: "unknown",
      };
    }

    const ordered = [];
    const add = (types) => {
      types.forEach((type) => {
        if (!ordered.includes(type)) ordered.push(type);
      });
    };

    attributes.forEach((attribute) => add(attribute.types));
    if (needsFollowUp) {
      add(supplementalTypes("taste", supplemental.taste));
      add(supplementalTypes("texture", supplemental.texture));
    }
    if (product) add(product[1]);
    add(["T07", "T02", "T12"]);

    let weights = [18, 9, 3];
    if (attributes.length >= 2 || needsFollowUp) weights = [15, 9, 6];
    if (product && attributes.length === 0) {
      weights = product[2];
      ordered.splice(0, ordered.length, ...product[1]);
    }

    const scores = scoreFromOrder(ordered, weights);
    return {
      snack,
      normalized,
      needsFollowUp: false,
      scores,
      direct: { ...scores },
      source: product ? "dictionary" : "supplemental",
      matchedProduct: product ? product[0][0] : null,
      matchedAttributes: attributes.map((attribute) => attribute.name),
    };
  };

  const emptyScores = () => Object.fromEntries(TYPE_IDS.map((id) => [id, 0]));

  const addScores = (target, source) => {
    Object.entries(source).forEach(([id, points]) => {
      target[id] += points;
    });
  };

  const optionFor = (questionId, key) =>
    QUESTIONS.find((question) => question.id === questionId)?.options.find(
      (option) => option.key === key,
    );

  const semanticTieWinner = (a, b, answers, normalizedSnack) => {
    const pair = [a, b].sort().join("/");
    const choose = (id) => (a === id || b === id ? id : null);
    const q = (id) => answers[String(id)];
    const nostalgic = includesAny(normalizedSnack, [
      "懐かしい",
      "子どもの頃",
      "思い出",
      "昔から",
    ]);

    if (pair === "T02/T10") return choose(nostalgic ? "T10" : "T02");
    if (pair === "T02/T12") {
      return choose(q(5) === "F" || q(8) === "A" ? "T02" : "T12");
    }
    if (pair === "T10/T12") return choose(nostalgic ? "T10" : "T12");
    if (pair === "T04/T11") {
      return choose(q(8) === "D" ? "T04" : "T11");
    }
    if (pair === "T05/T07") {
      return choose(q(2) === "E" || q(6) === "C" ? "T05" : "T07");
    }
    if (pair === "T03/T09") {
      return choose(["F"].includes(q(4)) || ["F"].includes(q(6)) || q(10) === "A" ? "T09" : "T03");
    }
    if (pair === "T01/T06") {
      return choose(["E"].includes(q(5)) || ["D"].includes(q(6)) || q(9) === "A" ? "T01" : "T06");
    }
    if (pair === "T02/T08") {
      return choose(q(8) === "A" ? "T02" : "T08");
    }
    return null;
  };

  const rankTypes = (totals, breakdown, q1Direct, answers, normalizedSnack) => {
    const ranked = [...TYPE_IDS].sort(
      (a, b) => totals[b] - totals[a] || a.localeCompare(b),
    );
    const [first, second] = ranked;
    if (totals[first] - totals[second] >= 1.5) return ranked;

    const segment = (id, from, to) =>
      breakdown
        .slice(from - 1, to)
        .reduce((sum, questionScores) => sum + questionScores[id], 0);
    const comparisons = [
      [segment(first, 1, 4), segment(second, 1, 4)],
      [segment(first, 5, 7), segment(second, 5, 7)],
      [q1Direct[first], q1Direct[second]],
    ];
    for (const [firstValue, secondValue] of comparisons) {
      if (firstValue === secondValue) continue;
      if (secondValue > firstValue) [ranked[0], ranked[1]] = [ranked[1], ranked[0]];
      return ranked;
    }

    const semantic = semanticTieWinner(
      first,
      second,
      answers,
      normalizedSnack,
    );
    if (semantic === second) [ranked[0], ranked[1]] = [ranked[1], ranked[0]];
    return ranked;
  };

  const calculateAxes = (totals) =>
    Array.from({ length: 5 }, (_, axisIndex) =>
      Math.round(
        TYPE_IDS.reduce(
          (sum, id) => sum + totals[id] * AXIS_BASES[id][axisIndex],
          0,
        ) / 100,
      ),
    );

  const normalizeTopThree = (ranking, totals) => {
    const top = ranking.slice(0, 3);
    const total = top.reduce((sum, id) => sum + totals[id], 0);
    const percentages = top.map((id) => Math.round((totals[id] / total) * 100));
    percentages[0] += 100 - percentages.reduce((sum, value) => sum + value, 0);
    return percentages;
  };

  const scoreQuiz = (state) => {
    const snackResult = classifySnack(state.snack, state.supplemental);
    if (snackResult.needsFollowUp || !snackResult.scores) {
      throw new Error("Q1の追加確認が完了していません。");
    }

    const totals = emptyScores();
    const breakdown = [];
    addScores(totals, snackResult.scores);
    breakdown.push({ ...snackResult.scores });

    QUESTIONS.forEach((question) => {
      const selected = optionFor(question.id, state.answers[String(question.id)]);
      if (!selected) throw new Error(`Q${question.id}の回答がありません。`);
      const questionScores = emptyScores();
      addScores(questionScores, selected.scores);
      addScores(totals, selected.scores);
      breakdown.push(questionScores);
    });

    const totalPoints = Object.values(totals).reduce((sum, value) => sum + value, 0);
    if (Math.abs(totalPoints - 100) > 0.0001) {
      throw new Error(`採点合計が100点ではありません（${totalPoints}点）。`);
    }

    const ranking = rankTypes(
      totals,
      breakdown,
      snackResult.direct,
      state.answers,
      snackResult.normalized,
    );
    return {
      main: ranking[0],
      sub: ranking[1],
      third: ranking[2],
      axes: calculateAxes(totals),
      proportions: normalizeTopThree(ranking, totals),
      snack: snackResult.snack,
      totals,
      breakdown,
      ranking,
      snackResult,
    };
  };

  const resultUrl = (result, baseUrl) => {
    const url = new URL(baseUrl);
    url.search = "";
    url.searchParams.set("m", result.main);
    url.searchParams.set("s", result.sub);
    url.searchParams.set("t", result.third);
    url.searchParams.set("a", result.axes.join(","));
    url.searchParams.set("p", result.proportions.join(","));
    url.searchParams.set("snack", result.snack);
    return url.toString();
  };

  window.SNACK_QUIZ = Object.freeze({
    TYPE_IDS,
    QUESTION_ONE,
    QUESTIONS,
    AXIS_BASES,
    SUPPLEMENTAL,
    normalizeText,
    sanitizeSnackInput,
    classifySnack,
    scoreQuiz,
    resultUrl,
    optionFor,
  });
})();
