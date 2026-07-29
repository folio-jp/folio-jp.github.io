(() => {
  "use strict";
  const types = window.SNACK_TYPES;
  const ids = types ? Object.keys(types).sort() : [];
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const type = ids.includes(id) ? types[id] : null;
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const setText = (target, text) => {
    const node = document.getElementById(target);
    if (node) node.textContent = text;
  };
  if (!type) {
    document.getElementById("invalid-type").hidden = false;
    return;
  }

  const rgb = type.color.match(/\w\w/g).map((value) => Number.parseInt(value, 16)).join(",");
  document.documentElement.style.setProperty("--accent", type.color);
  document.documentElement.style.setProperty("--accent-rgb", rgb);
  document.title = `${type.name}（${type.character}）｜タイプ詳細`;
  document.getElementById("type-view").hidden = false;
  setText("detail-id", type.id);
  setText("detail-title", type.name);
  setText("detail-character", type.character);
  setText("detail-copy", type.copy);
  setText("detail-overview", type.overview);
  setText("detail-relationship", type.relationship);
  setText("detail-work", type.workStyle);
  const image = document.getElementById("detail-image");
  image.src = type.image;
  image.alt = `${type.name}のキャラクター「${type.character}」`;

  type.tags.forEach((tag) => document.getElementById("detail-tags").append(make("span", "", tag)));

  const basicLabels = ["大切にしやすいこと", "惹かれやすいもの", "行動の特徴"];
  type.basics.forEach((text, index) => {
    const card = make("article", "basic-detail-card");
    card.append(make("span", "", String(index + 1).padStart(2, "0")), make("h3", "", basicLabels[index]), make("p", "", text));
    document.getElementById("detail-basics").append(card);
  });

  type.strengths.forEach((strength, index) => {
    const card = make("article", "detail-strength-card");
    card.append(make("span", "detail-number", String(index + 1).padStart(2, "0")), make("h3", "", strength), make("p", "", type.basics[index]));
    document.getElementById("detail-strengths").append(card);
  });

  type.cautions.forEach((caution, index) => {
    const card = make("article", "detail-caution-card");
    card.append(make("span", "detail-icon", index ? "◌" : "↗"), make("div", "", ""));
    card.lastElementChild.append(make("h3", "", `強みの裏返し ${index + 1}`), make("p", "", caution));
    document.getElementById("detail-cautions").append(card);
  });

  const snackLabels = ["惹かれやすい味", "好きになりやすい食感", "選び方", "食べたくなる場面", "食べ方"];
  type.snackStyle.forEach((text, index) => {
    const card = make("article", "snack-style-card");
    card.append(make("span", "", snackLabels[index]), make("strong", "", text));
    document.getElementById("detail-snack-style").append(card);
  });

  const relationCard = (relation, label, details, modifier = "") => {
    const target = types[relation.id];
    const article = make("article", `relation-detail-card ${modifier}`.trim());
    const top = make("div", "relation-detail-top");
    const relationImage = make("img", "", "");
    relationImage.src = target.image;
    relationImage.alt = `${target.name}のキャラクター「${target.character}」`;
    const identity = make("div", "");
    identity.append(make("span", "relation-label", label), make("small", "", target.id), make("h3", "", target.name), make("p", "", target.character));
    top.append(relationImage, identity);
    article.append(top);
    details.forEach(([term, text]) => {
      const row = make("p", "relation-detail-text");
      row.append(make("strong", "", term), document.createTextNode(text));
      article.append(row);
    });
    const link = make("a", "relation-link", "このタイプを詳しく見る →");
    link.href = `type.html?id=${target.id}`;
    article.append(link);
    return article;
  };

  type.similarTypes.forEach((similar) => {
    document.getElementById("similar-types").append(
      relationCard(similar, "似ているタイプ", [["共通点", similar.common], ["違い", similar.difference]], "is-similar"),
    );
  });
  document.getElementById("detail-relations").append(
    relationCard(type.compatible, "相性が良いタイプ", [["相性の理由", type.compatible.reason]], "is-good"),
    relationCard(type.opposite, "正反対のタイプ", [["主な違い・補い合える点", type.opposite.reason]], "is-opposite"),
  );

  const position = ids.indexOf(type.id);
  const previous = types[ids[(position - 1 + ids.length) % ids.length]];
  const next = types[ids[(position + 1) % ids.length]];
  const prevLink = document.getElementById("prev-type");
  prevLink.href = `type.html?id=${previous.id}`;
  prevLink.textContent = `← ${previous.id} ${previous.character}`;
  const nextLink = document.getElementById("next-type");
  nextLink.href = `type.html?id=${next.id}`;
  nextLink.textContent = `${next.id} ${next.character} →`;
  document.getElementById("result-back").addEventListener("click", () => {
    if (window.history.length > 1 && document.referrer) window.history.back();
    else window.location.href = "./";
  });
})();
