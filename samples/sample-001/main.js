(() => {
  "use strict";

  const config = window.FOLIO_CONFIG || {};
  const siteUrl = config.siteUrl || "https://elev-ate.jp/folio";
  const ogpImage =
    config.ogpImage || "https://elev-ate.jp/folio/ogp/folio-ogp.png";
  const lineUrl = config.lineUrl || "https://lin.ee/rQYI2iX";

  document.querySelectorAll("[data-site-url]").forEach((element) => {
    const attributeName = element.tagName === "LINK" ? "href" : "content";
    element.setAttribute(attributeName, siteUrl);
  });

  document.querySelectorAll("[data-ogp-image]").forEach((element) => {
    element.setAttribute("content", ogpImage);
  });

  const structuredData = document.querySelector("#structured-data");
  if (structuredData) {
    try {
      const data = JSON.parse(structuredData.textContent);
      data.url = siteUrl;
      structuredData.textContent = JSON.stringify(data);
    } catch (error) {
      console.error("Structured data could not be updated.", error);
    }
  }

  document.querySelectorAll("[data-line-link]").forEach((link) => {
    link.setAttribute("href", lineUrl);
  });
})();
