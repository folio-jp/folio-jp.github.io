// 実家カフェ｜サンプルHP
// スクロールで各セクションを控えめにフェードイン表示する。
(function () {
  "use strict";

  var els = document.querySelectorAll("[data-reveal]");
  if (!els.length) return;

  // IntersectionObserver 非対応環境では即時表示（内容は必ず見える）
  if (!("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  els.forEach(function (el) { io.observe(el); });
})();
