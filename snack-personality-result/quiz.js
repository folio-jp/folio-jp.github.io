(() => {
  "use strict";

  const QUIZ = window.SNACK_QUIZ;
  const STORAGE_KEY = "snack-personality-quiz-v1";
  const COMPLETED_KEY = "snack-personality-completed-v1";
  const $ = (id) => document.getElementById(id);

  const freshState = () => ({
    version: 1,
    current: 1,
    snack: "",
    supplemental: { taste: "", texture: "" },
    answers: {},
    updatedAt: Date.now(),
  });

  const readStoredState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!parsed || parsed.version !== 1) return freshState();
      return {
        ...freshState(),
        ...parsed,
        current: Math.min(10, Math.max(1, Number(parsed.current) || 1)),
        snack: QUIZ.sanitizeSnackInput(parsed.snack),
        supplemental: {
          taste: String(parsed.supplemental?.taste ?? ""),
          texture: String(parsed.supplemental?.texture ?? ""),
        },
        answers:
          parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      };
    } catch {
      return freshState();
    }
  };

  let state = readStoredState();
  let completing = false;

  const save = () => {
    state.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const questionFromUrl = () => {
    const value = Number(new URLSearchParams(window.location.search).get("q"));
    return Number.isInteger(value) && value >= 1 && value <= 10 ? value : null;
  };

  const maxReachableQuestion = () => {
    if (!state.snack) return 1;
    const classification = QUIZ.classifySnack(state.snack, state.supplemental);
    if (classification.needsFollowUp) return 1;
    let maximum = 2;
    for (let question = 2; question <= 9; question += 1) {
      if (!state.answers[String(question)]) break;
      maximum = question + 1;
    }
    return maximum;
  };

  const initialQuestion = questionFromUrl();
  if (new URLSearchParams(window.location.search).get("review") === "1") {
    state.current = 1;
  } else if (initialQuestion) {
    state.current = Math.min(initialQuestion, maxReachableQuestion());
  }

  const updateUrl = (question, replace = false) => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("q", String(question));
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ question }, "", url);
  };

  const setError = (message = "") => {
    $("quiz-error").textContent = message;
    $("quiz-error").hidden = !message;
  };

  const renderProgress = () => {
    const percent = state.current * 10;
    $("progress-question").textContent = `Q${state.current} / 10`;
    $("progress-percent").textContent = `${percent}%`;
    $("progress-fill").style.width = `${percent}%`;
    $("progress-track").setAttribute("aria-valuenow", String(percent));
    $("question-number").textContent = `QUESTION ${String(state.current).padStart(2, "0")}`;
  };

  const createSupplementalOptions = (kind) => {
    const group = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = QUIZ.SUPPLEMENTAL[kind].question;
    const options = document.createElement("div");
    options.className = "mini-options";

    QUIZ.SUPPLEMENTAL[kind].options.forEach(([key, label]) => {
      const wrapper = document.createElement("label");
      wrapper.className = "mini-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `supplemental-${kind}`;
      input.value = key;
      input.checked = state.supplemental[kind] === key;
      input.addEventListener("change", () => {
        state.supplemental[kind] = key;
        save();
        setError();
      });
      const text = document.createElement("span");
      text.textContent = label;
      wrapper.append(input, text);
      options.append(wrapper);
    });
    group.append(legend, options);
    return group;
  };

  const showSupplemental = () => {
    if ($("supplemental-panel")) return;
    const panel = document.createElement("div");
    panel.id = "supplemental-panel";
    panel.className = "supplemental-panel";
    const lead = document.createElement("p");
    lead.textContent = "より正確に分類するため、2つだけ教えてください。";
    panel.append(lead, createSupplementalOptions("taste"), createSupplementalOptions("texture"));
    $("answer-area").append(panel);
  };

  const renderQuestionOne = () => {
    const question = QUIZ.QUESTION_ONE;
    $("quiz-question").textContent = question.text;
    $("quiz-help").textContent = question.help;
    $("quiz-help").hidden = false;

    const input = document.createElement("input");
    input.id = "snack-input";
    input.className = "snack-input";
    input.type = "text";
    input.inputMode = "text";
    input.autocomplete = "off";
    input.maxLength = 80;
    input.placeholder = "例：じゃがりこ サラダ味";
    input.value = state.snack;
    input.setAttribute("aria-describedby", "snack-input-meta");

    const meta = document.createElement("div");
    meta.className = "input-meta";
    meta.id = "snack-input-meta";
    const hint = document.createElement("span");
    hint.textContent = "商品名・味・特徴を80文字以内で入力";
    const count = document.createElement("span");
    count.textContent = `${Array.from(state.snack).length} / 80`;
    meta.append(hint, count);

    input.addEventListener("input", () => {
      state.snack = QUIZ.sanitizeSnackInput(input.value);
      count.textContent = `${Array.from(state.snack).length} / 80`;
      state.supplemental = { taste: "", texture: "" };
      $("supplemental-panel")?.remove();
      save();
      setError();
    });

    const examples = document.createElement("ul");
    examples.className = "example-list";
    question.examples.forEach((example) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = example;
      button.addEventListener("click", () => {
        input.value = example;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.focus();
      });
      item.append(button);
      examples.append(item);
    });

    $("answer-area").append(input, meta, examples);
    const classification = QUIZ.classifySnack(state.snack, state.supplemental);
    if (state.snack && classification.needsFollowUp) showSupplemental();
    window.setTimeout(() => input.focus({ preventScroll: true }), 40);
  };

  const renderChoiceQuestion = (question) => {
    $("quiz-question").textContent = question.text;
    $("quiz-help").hidden = true;
    const list = document.createElement("div");
    list.className = "answer-options";
    list.setAttribute("role", "radiogroup");
    list.setAttribute("aria-label", question.text);

    question.options.forEach((option) => {
      const wrapper = document.createElement("label");
      wrapper.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `question-${question.id}`;
      input.value = option.key;
      input.checked = state.answers[String(question.id)] === option.key;
      input.addEventListener("change", () => {
        state.answers[String(question.id)] = option.key;
        save();
        setError();
        $("next-question").focus();
      });
      const content = document.createElement("span");
      content.className = "answer-option-content";
      const key = document.createElement("span");
      key.className = "answer-option-key";
      key.textContent = option.key;
      const label = document.createElement("span");
      label.className = "answer-option-label";
      label.textContent = option.label;
      const check = document.createElement("span");
      check.className = "answer-option-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      content.append(key, label, check);
      wrapper.append(input, content);
      list.append(wrapper);
    });
    $("answer-area").append(list);
  };

  const render = ({ focusHeading = false } = {}) => {
    renderProgress();
    setError();
    $("answer-area").replaceChildren();
    $("previous-question").disabled = state.current === 1;
    $("next-question").innerHTML =
      state.current === 10
        ? '結果を見る <span aria-hidden="true">→</span>'
        : '次へ <span aria-hidden="true">→</span>';

    if (state.current === 1) {
      renderQuestionOne();
    } else {
      renderChoiceQuestion(QUIZ.QUESTIONS.find((question) => question.id === state.current));
    }
    if (focusHeading) $("quiz-question").focus({ preventScroll: true });
  };

  const validateCurrent = () => {
    if (state.current === 1) {
      state.snack = QUIZ.sanitizeSnackInput($("snack-input")?.value);
      if (!state.snack) {
        setError("一番好きなお菓子を入力してください。");
        $("snack-input")?.focus();
        return false;
      }
      const classification = QUIZ.classifySnack(state.snack, state.supplemental);
      if (classification.needsFollowUp) {
        showSupplemental();
        if (!state.supplemental.taste || !state.supplemental.texture) {
          setError("味と食感をそれぞれ1つ選んでください。");
          $("supplemental-panel input:not(:checked)")?.focus();
          return false;
        }
      }
      save();
      return true;
    }

    if (!state.answers[String(state.current)]) {
      setError("一番近い選択肢を1つ選んでください。");
      $("answer-area input")?.focus();
      return false;
    }
    return true;
  };

  const goTo = (question, { replace = false, fromHistory = false } = {}) => {
    state.current = Math.min(10, Math.max(1, question));
    save();
    if (!fromHistory) updateUrl(state.current, replace);
    render({ focusHeading: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const complete = () => {
    if (completing) return;
    completing = true;
    $("next-question").disabled = true;
    try {
      const result = QUIZ.scoreQuiz(state);
      const resultBase = new URL("index.html", window.location.href);
      const url = QUIZ.resultUrl(result, resultBase);
      sessionStorage.setItem(
        COMPLETED_KEY,
        JSON.stringify({ completedAt: Date.now(), url }),
      );
      window.location.assign(url);
    } catch (error) {
      completing = false;
      $("next-question").disabled = false;
      setError(error.message || "診断結果を作成できませんでした。");
    }
  };

  $("next-question").addEventListener("click", () => {
    if (!validateCurrent()) return;
    if (state.current === 10) {
      complete();
      return;
    }
    goTo(state.current + 1);
  });

  $("previous-question").addEventListener("click", () => {
    if (state.current > 1) goTo(state.current - 1);
  });

  $("reset-quiz").addEventListener("click", () => {
    const dialog = $("reset-dialog");
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else if (window.confirm("入力した回答を削除して最初からやり直しますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(COMPLETED_KEY);
      state = freshState();
      goTo(1, { replace: true });
    }
  });

  $("reset-dialog").addEventListener("close", () => {
    if ($("reset-dialog").returnValue !== "confirm") return;
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(COMPLETED_KEY);
    state = freshState();
    goTo(1, { replace: true });
  });

  window.addEventListener("popstate", () => {
    const question = questionFromUrl() ?? 1;
    state.current = Math.min(question, maxReachableQuestion());
    save();
    render({ focusHeading: true });
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      state.current === 1 &&
      document.activeElement?.id === "snack-input"
    ) {
      event.preventDefault();
      $("next-question").click();
    }
  });

  updateUrl(state.current, true);
  render();
})();
