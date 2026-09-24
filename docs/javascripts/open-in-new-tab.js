(function () {
  "use strict";

  const CONFIG = {
    addIcon: true,
    // Extensions opened in a new tab even when the link is internal (a PDF
    // or archive is a download, not a page navigation, regardless of host).
    downloadExtensions: ["pdf", "zip", "tar", "gz", "docx", "xlsx", "pptx"],
  };

  function isDownload(link) {
    const match = link.pathname.match(/\.([a-z0-9]+)$/i);
    return !!match && CONFIG.downloadExtensions.includes(match[1].toLowerCase());
  }

  function isExternal(link) {
    return link.hostname !== window.location.hostname;
  }

  function init() {
    document.querySelectorAll("a[href]").forEach((link) => {
      // Skip anchors/mailto/tel and anything already opted out or already
      // processed on a previous instant-navigation run.
      if (!link.href || link.dataset.newTabInit) return;
      if (["mailto:", "tel:", "javascript:"].some((p) => link.href.startsWith(p))) return;

      const external = isExternal(link);
      if (!external && !isDownload(link)) return;

      link.dataset.newTabInit = "true";
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      if (CONFIG.addIcon && external && !link.querySelector(".new-tab-icon")) {
        const icon = document.createElement("span");
        icon.className = "new-tab-icon";
        icon.setAttribute("aria-hidden", "true");
        link.appendChild(icon);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Re-run on every "instant navigation" (SPA-like) page change: a plain
  // page load only calls init() once, but Zensical's instant loading swaps
  // page content without a full reload, so new links need the same pass.
  if (typeof document$ !== "undefined" && document$?.subscribe) {
    document$.subscribe(init);
  }
})();
