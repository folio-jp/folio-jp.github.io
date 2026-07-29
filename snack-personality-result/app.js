(() => {
  "use strict";

  const TYPES = window.SNACK_TYPES;
  const TYPE_IDS = Object.freeze(Object.keys(TYPES));
  const AXES = Object.freeze(["好奇心", "社交性", "こだわり", "安心志向", "刺激欲求"]);
  const REQUIRED_PARAMS = Object.freeze(["m", "s", "t", "a", "p"]);
  const DEFAULTS = Object.freeze({
    main: "T07",
    sub: "T05",
    third: "T04",
    axes: [66, 74, 54, 43, 74],
    proportions: [48, 31, 21],
    snack: "プリッツ",
  });

  const $ = (id) => document.getElementById(id);
  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = String(value ?? "");
  };

  const hexToRgb = (hex) => {
    const normalized = hex.replace("#", "");
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  };

  const relativeLuminance = ([r, g, b]) => {
    const values = [r, g, b].map((value) => {
      const channel = value / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };

  const darkenForText = (hex) => {
    const rgb = hexToRgb(hex);
    if (relativeLuminance(rgb) < 0.24) return hex;
    const factor = relativeLuminance(rgb) > 0.63 ? 0.43 : 0.59;
    return `rgb(${rgb.map((value) => Math.round(value * factor)).join(",")})`;
  };

  const isType = (value) => TYPE_IDS.includes(value);

  const parseList = (raw, length, fallback) => {
    if (typeof raw !== "string") return { value: [...fallback], corrected: true };
    const parts = raw.split(",");
    if (
      parts.length !== length ||
      parts.some((item) => item.trim() === "" || !/^\d+(?:\.\d+)?$/.test(item.trim()))
    ) {
      return { value: [...fallback], corrected: true };
    }
    const numbers = parts.map(Number);
    if (numbers.some((value) => !Number.isFinite(value) || value < 0 || value > 100)) {
      return { value: [...fallback], corrected: true };
    }
    return { value: numbers.map((value) => Math.round(value)), corrected: false };
  };

  const normalizeProportions = (values) => {
    const total = values.reduce((sum, value) => sum + value, 0);
    if (total === 100) return { value: values, normalized: false };
    if (total <= 0) return { value: [...DEFAULTS.proportions], normalized: true };

    const exact = values.map((value) => (value / total) * 100);
    const floors = exact.map(Math.floor);
    let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);
    const order = exact
      .map((value, index) => ({ index, fraction: value - floors[index] }))
      .sort((a, b) => b.fraction - a.fraction);

    for (let index = 0; index < remainder; index += 1) {
      floors[order[index % order.length].index] += 1;
    }
    return { value: floors, normalized: true };
  };

  const sanitizeSnack = (raw) => {
    if (typeof raw !== "string" || raw.trim() === "") {
      return { value: DEFAULTS.snack, corrected: raw !== null };
    }
    const withoutControls = raw
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const value = Array.from(withoutControls).slice(0, 40).join("");
    return {
      value: value || DEFAULTS.snack,
      corrected: value !== raw || Array.from(raw).length > 40,
    };
  };

  const readParams = () => {
    const params = new URLSearchParams(window.location.search);
    const corrections = [];
    const demo = params.get("demo") === "1";

    if (demo) {
      return {
        mode: "demo",
        main: DEFAULTS.main,
        sub: DEFAULTS.sub,
        third: DEFAULTS.third,
        axes: [...DEFAULTS.axes],
        proportions: [...DEFAULTS.proportions],
        snack: DEFAULTS.snack,
        hasSnack: true,
        corrections,
      };
    }

    const attemptedResult = REQUIRED_PARAMS.some((key) => params.has(key));
    const missing = REQUIRED_PARAMS.filter((key) => !params.has(key));
    if (missing.length > 0) {
      return {
        mode: "landing",
        error: attemptedResult
          ? `診断結果URLに必要な情報が不足しています（${missing.join("、")}）。サイト内で診断をやり直してください。`
          : "",
      };
    }

    const main = params.get("m");
    const sub = params.get("s");
    const third = params.get("t");
    const invalidTypes = [
      ["m", main],
      ["s", sub],
      ["t", third],
    ].filter(([, value]) => !isType(value));

    const axes = parseList(params.get("a"), 5, DEFAULTS.axes);
    const rawProportions = parseList(params.get("p"), 3, DEFAULTS.proportions);
    const proportionTotal = rawProportions.value.reduce((sum, value) => sum + value, 0);
    const invalidParts = [
      ...invalidTypes.map(([key]) => key),
      ...(axes.corrected ? ["a"] : []),
      ...(rawProportions.corrected || proportionTotal <= 0 ? ["p"] : []),
    ];
    if (invalidParts.length > 0) {
      return {
        mode: "landing",
        error: `診断結果URLに無効な情報が含まれています（${invalidParts.join("、")}）。サイト内で診断をやり直してください。`,
      };
    }

    const proportions = normalizeProportions(rawProportions.value);
    if (proportions.normalized) {
      corrections.push("タイプ構成の合計を100%に再調整");
    }

    const hasSnack = params.has("snack") && params.get("snack").trim() !== "";
    const snack = hasSnack
      ? sanitizeSnack(params.get("snack"))
      : { value: "未指定", corrected: false };
    if (snack.corrected) corrections.push("お菓子名を安全な長さに補正");

    return {
      mode: "result",
      main,
      sub,
      third,
      axes: axes.value,
      proportions: proportions.value,
      snack: snack.value,
      hasSnack,
      corrections,
    };
  };

  const canonicalUrl = (state) => {
    const url = new URL(window.location.href);
    url.search = "";
    if (state.mode === "demo") {
      url.searchParams.set("demo", "1");
      return url.toString();
    }
    url.searchParams.set("m", state.main);
    url.searchParams.set("s", state.sub);
    url.searchParams.set("t", state.third);
    url.searchParams.set("a", state.axes.join(","));
    url.searchParams.set("p", state.proportions.join(","));
    if (state.hasSnack) url.searchParams.set("snack", state.snack);
    return url.toString();
  };

  const configureTheme = (type) => {
    const root = document.documentElement;
    const rgb = hexToRgb(type.color);
    root.style.setProperty("--accent", type.color);
    root.style.setProperty("--accent-rgb", rgb.join(","));
    root.style.setProperty("--accent-dark", darkenForText(type.color));
    root.style.setProperty(
      "--accent-soft",
      `color-mix(in srgb, ${type.color}, white 80%)`,
    );
    document.querySelector('meta[name="theme-color"]').content =
      `rgb(${rgb.map((value) => Math.round(value * 0.18 + 255 * 0.82)).join(",")})`;
  };

  const makeRadar = (values) => {
    const namespace = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(namespace, "svg");
    svg.setAttribute("viewBox", "0 0 360 330");
    svg.setAttribute("role", "img");
    svg.setAttribute(
      "aria-label",
      AXES.map((axis, index) => `${axis}${values[index]}`).join("、"),
    );

    const center = { x: 180, y: 165 };
    const radius = 104;
    const angle = (index) => -Math.PI / 2 + (index * Math.PI * 2) / AXES.length;
    const point = (index, scale) => ({
      x: center.x + Math.cos(angle(index)) * radius * scale,
      y: center.y + Math.sin(angle(index)) * radius * scale,
    });
    const pointsString = (scaleOrValues) =>
      AXES.map((_, index) => {
        const scale = Array.isArray(scaleOrValues)
          ? scaleOrValues[index] / 100
          : scaleOrValues;
        const value = point(index, scale);
        return `${value.x.toFixed(1)},${value.y.toFixed(1)}`;
      }).join(" ");

    for (let level = 5; level >= 1; level -= 1) {
      const polygon = document.createElementNS(namespace, "polygon");
      polygon.setAttribute("points", pointsString(level / 5));
      polygon.setAttribute("class", "radar-grid");
      svg.append(polygon);
    }

    AXES.forEach((axis, index) => {
      const axisEnd = point(index, 1);
      const line = document.createElementNS(namespace, "line");
      line.setAttribute("x1", center.x);
      line.setAttribute("y1", center.y);
      line.setAttribute("x2", axisEnd.x);
      line.setAttribute("y2", axisEnd.y);
      line.setAttribute("class", "radar-axis");
      svg.append(line);

      const labelPoint = point(index, 1.32);
      const label = document.createElementNS(namespace, "text");
      label.setAttribute("x", labelPoint.x);
      label.setAttribute("y", labelPoint.y - 3);
      label.setAttribute("class", "radar-label");
      label.setAttribute("text-anchor", "middle");
      label.textContent = axis;
      svg.append(label);

      const valueLabel = document.createElementNS(namespace, "text");
      valueLabel.setAttribute("x", labelPoint.x);
      valueLabel.setAttribute("y", labelPoint.y + 12);
      valueLabel.setAttribute("class", "radar-value");
      valueLabel.setAttribute("text-anchor", "middle");
      valueLabel.textContent = values[index];
      svg.append(valueLabel);
    });

    const dataPolygon = document.createElementNS(namespace, "polygon");
    dataPolygon.setAttribute("points", pointsString(values));
    dataPolygon.setAttribute("class", "radar-shape");
    svg.append(dataPolygon);

    values.forEach((value, index) => {
      const dataPoint = point(index, value / 100);
      const dot = document.createElementNS(namespace, "circle");
      dot.setAttribute("cx", dataPoint.x);
      dot.setAttribute("cy", dataPoint.y);
      dot.setAttribute("r", "4.4");
      dot.setAttribute("class", "radar-dot");
      svg.append(dot);
    });

    const target = $("radar-chart");
    target.replaceChildren(svg);
  };

  const renderAxes = (values) => {
    const topValue = Math.max(...values);
    const topIndex = values.indexOf(topValue);
    setText("top-axis-tag", `TOP：${AXES[topIndex]}`);
    setText("hero-top-axis-label", `最も強い特徴・${AXES[topIndex]}`);
    setText("hero-top-axis-value", topValue);

    const fragment = document.createDocumentFragment();
    AXES.forEach((axis, index) => {
      const item = document.createElement("div");
      item.className = `axis-item${index === topIndex ? " is-top" : ""}`;

      const name = document.createElement("div");
      name.className = "axis-name";
      name.textContent = axis;
      if (index === topIndex) {
        const chip = document.createElement("span");
        chip.className = "top-chip";
        chip.textContent = "HIGHEST";
        name.append(chip);
      }

      const number = document.createElement("div");
      number.className = "axis-number";
      number.append(document.createTextNode(String(values[index])));
      const small = document.createElement("small");
      small.textContent = " /100";
      number.append(small);

      const meter = document.createElement("div");
      meter.className = "meter";
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", axis);
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "100");
      meter.setAttribute("aria-valuenow", String(values[index]));
      const fill = document.createElement("span");
      fill.style.width = `${values[index]}%`;
      meter.append(fill);
      item.append(name, number, meter);
      fragment.append(item);
    });
    $("axis-list").replaceChildren(fragment);
  };

  const renderBlend = (state) => {
    const entries = [
      { id: state.main, percent: state.proportions[0], label: "メイン" },
      { id: state.sub, percent: state.proportions[1], label: "サブ" },
      { id: state.third, percent: state.proportions[2], label: "第3タイプ" },
    ];
    const fragment = document.createDocumentFragment();
    entries.forEach((entry, index) => {
      const type = TYPES[entry.id];
      const row = document.createElement("div");
      row.className = `blend-row${index === 0 ? " is-main" : ""}`;

      const rank = document.createElement("div");
      rank.className = "rank";
      rank.append(document.createTextNode("RANK"));
      const rankNumber = document.createElement("strong");
      rankNumber.textContent = String(index + 1).padStart(2, "0");
      rank.append(rankNumber);

      const name = document.createElement("div");
      name.className = "blend-name";
      const idLabel = document.createElement("span");
      idLabel.textContent = `${entry.label} · ${entry.id}`;
      const strong = document.createElement("strong");
      strong.textContent = type.name;
      const character = document.createElement("small");
      character.textContent = type.character;
      name.append(idLabel, strong, character);

      const bar = document.createElement("div");
      bar.className = "blend-bar";
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-label", `${type.name}の構成比`);
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-valuenow", String(entry.percent));
      const fill = document.createElement("span");
      fill.style.width = `${entry.percent}%`;
      fill.style.background = type.color;
      bar.append(fill);

      const percent = document.createElement("div");
      percent.className = "blend-percent";
      percent.append(document.createTextNode(String(entry.percent)));
      const unit = document.createElement("small");
      unit.textContent = "%";
      percent.append(unit);
      row.append(rank, name, bar, percent);
      fragment.append(row);
    });
    $("blend-list").replaceChildren(fragment);
  };

  const renderTraits = (type) => {
    const fragment = document.createDocumentFragment();
    type.basics.forEach((trait, index) => {
      const item = document.createElement("div");
      item.className = "basic-trait";
      const number = document.createElement("span");
      number.textContent = `KEY ${String(index + 1).padStart(2, "0")}`;
      item.append(number, document.createTextNode(trait));
      fragment.append(item);
    });
    $("basic-traits").replaceChildren(fragment);
  };

  const renderStrengths = (type) => {
    const fragment = document.createDocumentFragment();
    type.strengths.forEach((strength, index) => {
      const card = document.createElement("article");
      card.className = "strength-card card";
      const number = document.createElement("span");
      number.className = "strength-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const heading = document.createElement("h3");
      heading.textContent = strength;
      const description = document.createElement("p");
      description.textContent =
        type.basics[index] ?? "このタイプらしさが表れやすい強みです。";
      card.append(number, heading, description);
      fragment.append(card);
    });
    $("strength-list").replaceChildren(fragment);
  };

  const renderCautions = (type) => {
    const fragment = document.createDocumentFragment();
    type.cautions.forEach((caution, index) => {
      const card = document.createElement("article");
      card.className = "caution-card";
      const icon = document.createElement("span");
      icon.className = "caution-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = index === 0 ? "↗" : "◌";
      const body = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = `強みの裏返し ${index + 1}`;
      const description = document.createElement("p");
      description.textContent = caution;
      body.append(heading, description);
      card.append(icon, body);
      fragment.append(card);
    });
    $("caution-list").replaceChildren(fragment);
  };

  const renderChoices = (choices) => {
    const fragment = document.createDocumentFragment();
    choices.forEach((choice) => {
      const tag = document.createElement("span");
      tag.className = "choice-tag";
      tag.textContent = choice;
      fragment.append(tag);
    });
    $("choice-tags").replaceChildren(fragment);
  };

  const subDescription = (type) => {
    const firstSentence = type.overall.split("。")[0];
    const secondSentence = type.overall.split("。")[1];
    const text = [firstSentence, secondSentence].filter(Boolean).join("。");
    return `${text.slice(0, 96)}${text.length > 96 ? "…" : "。"} `;
  };

  const renderSubtype = (state) => {
    const type = TYPES[state.sub];
    const rgb = hexToRgb(type.color);
    const card = document.querySelector(".subtype-card");
    card.style.setProperty("--sub-color", type.color);
    card.style.setProperty("--sub-rgb", rgb.join(","));
    setText("subtype-id", type.id);
    setText("subtype-percent", `${state.proportions[1]}%`);
    setText("subtype-name", type.name);
    setText("subtype-character", type.character);
    setText("subtype-description", subDescription(type));
    $("subtype-meter").style.width = `${state.proportions[1]}%`;
    const image = $("subtype-image");
    image.src = type.image;
    image.alt = `${type.name}のキャラクター「${type.character}」`;
  };

  const renderRelation = (prefix, relation) => {
    setText(`${prefix}-id`, relation.id);
    setText(`${prefix}-name`, relation.name);
    setText(`${prefix}-character`, `キャラクター：${relation.character}`);
    setText(`${prefix}-reason`, relation.reason);
    const image = $(`${prefix}-image`);
    image.src = relation.image;
    image.alt = `${relation.name}のキャラクター「${relation.character}」`;
  };

  const showNotice = (state) => {
    const notice = $("status-notice");
    if (state.mode === "demo") {
      setText(
        "status-message",
        "これは機能確認用のデモ結果です。実際の診断結果ではありません。",
      );
      notice.hidden = false;
      return;
    }
    if (state.corrections.length > 0) {
      setText(
        "status-message",
        `URLの一部を安全な値へ補正しました（${state.corrections.join("、")}）。`,
      );
      notice.hidden = false;
    }
  };

  const render = (state) => {
    const type = TYPES[state.main];
    configureTheme(type);
    document.title = `${type.name}｜好きなお菓子からわかる12タイプ診断`;

    setText("hero-type-id", type.id);
    setText("result-title", type.name);
    setText("hero-character", type.character);
    setText("hero-copy", type.copy);
    setText("hero-snack", state.snack);
    setText("character-bubble", type.short);
    const heroImage = $("hero-image");
    heroImage.src = type.image;
    heroImage.alt = `${type.name}のキャラクター「${type.character}」`;

    makeRadar(state.axes);
    renderAxes(state.axes);
    renderBlend(state);
    setText(
      "summary-lead",
      state.hasSnack
        ? `「${state.snack}」を選ぶあなたには、${type.name}らしい魅力が表れています。`
        : `好きなお菓子への回答には、${type.name}らしい魅力が表れています。`,
    );
    setText("summary-body", type.overall);
    renderTraits(type);
    renderStrengths(type);
    renderCautions(type);
    setText("relationship-text", type.relationships);
    setText("work-text", type.work);
    renderChoices(type.snackChoices);
    renderSubtype(state);
    renderRelation("compatible", type.compatible);
    renderRelation("opposite", type.opposite);
    setText("share-text", type.share);
    showNotice(state);
  };

  const copyText = async (text, successMessage) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const succeeded = document.execCommand("copy");
      textarea.remove();
      showToast(succeeded ? successMessage : "コピーできませんでした");
    }
  };

  let toastTimer;
  const showToast = (message) => {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const bindActions = (state) => {
    const url = canonicalUrl(state);
    if (state.mode === "result" && state.corrections.length > 0) {
      window.history.replaceState(null, "", url);
    }

    $("copy-text").addEventListener("click", () =>
      copyText(TYPES[state.main].share, "共有文をコピーしました"),
    );
    $("copy-url").addEventListener("click", () =>
      copyText(url, "結果URLをコピーしました"),
    );
    $("print-result").addEventListener("click", () => {
      showToast("印刷画面を開きます");
      window.setTimeout(() => window.print(), 100);
    });

    const share = async () => {
      if (!navigator.share) {
        await copyText(url, "結果URLをコピーしました");
        return;
      }
      try {
        await navigator.share({
          title: `${TYPES[state.main].name}｜お菓子12タイプ診断`,
          text: `${TYPES[state.main].name}\n${TYPES[state.main].copy}`,
          url,
        });
      } catch (error) {
        if (error?.name !== "AbortError") showToast("共有を完了できませんでした");
      }
    };

    $("header-share").addEventListener("click", share);
    if (navigator.share) {
      $("native-share").hidden = false;
      $("native-share").addEventListener("click", share);
    }

    $("review-answers").addEventListener("click", () => {
      window.location.href = "quiz.html?review=1";
    });
    $("restart-quiz").addEventListener("click", () => {
      try {
        localStorage.removeItem("snack-personality-quiz-v1");
        sessionStorage.removeItem("snack-personality-completed-v1");
      } catch {
        // Restricted in-app browsers may disable Web Storage.
      }
      window.location.href = "quiz.html?q=1";
    });
  };

  if (!TYPES || TYPE_IDS.length !== 12) {
    document.body.textContent = "診断データを読み込めませんでした。";
    return;
  }

  const state = readParams();
  document.body.classList.remove("is-loading");
  if (state.mode === "landing") {
    document.body.classList.add("is-landing");
    $("landing-view").hidden = false;
    document.title = "好きなお菓子からわかる12タイプ診断";
    if (state.error) {
      setText("landing-error", state.error);
      $("landing-error").hidden = false;
    }
    return;
  }

  document.body.classList.add("is-result");
  render(state);
  bindActions(state);
})();
