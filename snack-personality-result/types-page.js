(() => {
  "use strict";
  const types = window.SNACK_TYPES;
  const grid = document.getElementById("types-grid");
  if (!types || !grid) return;
  const ordered = Object.values(types).sort((a, b) => a.id.localeCompare(b.id));

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  ordered.forEach((type) => {
    const card = make("article", "type-card");
    card.dataset.categories = type.categories.join(" ");
    card.style.setProperty("--type-color", type.color);
    const link = make("a", "type-card-link");
    link.href = `type.html?id=${type.id}`;
    link.setAttribute("aria-label", `${type.id} ${type.name}（${type.character}）の詳細を見る`);
    const visual = make("div", "type-card-visual");
    const id = make("span", "type-card-id", type.id);
    const image = make("img", "", "");
    image.src = type.image;
    image.alt = `${type.name}のキャラクター「${type.character}」`;
    image.width = 1024;
    image.height = 1024;
    visual.append(id, image);
    const body = make("div", "type-card-body");
    const name = make("h3", "", type.name);
    const character = make("p", "type-card-character", type.character);
    const copy = make("p", "type-card-copy", type.copy);
    const description = make("p", "type-card-description", type.shortDescription);
    const tags = make("div", "tag-row");
    type.tags.slice(0, 3).forEach((tag) => tags.append(make("span", "", tag)));
    const action = make("span", "type-card-action", "詳しく見る →");
    body.append(name, character, copy, description, tags, action);
    link.append(visual, body);
    card.append(link);
    grid.append(card);
  });

  const buttons = [...document.querySelectorAll(".filter-button")];
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      [...grid.children].forEach((card) => {
        card.hidden = filter !== "all" && !card.dataset.categories.split(" ").includes(filter);
      });
    });
  });
})();
