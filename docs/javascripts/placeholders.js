(function () {
  "use strict";

  const STORAGE_PREFIX = "zts-placeholder:";
  // Two syntaxes, scoped to two different contexts on purpose:
  // - "{{ name }}" in normal page text (paragraphs, headings). Not
  //   attr_list-based: needs to match inside any text, not just a block's
  //   own header line.
  // - "<name>" inside a code block, the common convention for a
  //   placeholder in a config/command example (<TOKEN>, <namespace>...).
  //   Safe there specifically: Pygments-highlighted code is real escaped
  //   text, not parsed as HTML, so "<name>" never risks being swallowed as
  //   an unknown element the way it would in plain paragraph text.
  const TEXT_RE = /\{\{\s*([a-zA-Z_][\w-]*)\s*\}\}/g;
  const CODE_RE = /<([a-zA-Z_][\w-]*)>/g;

  function loadValue(name) {
    try {
      return localStorage.getItem(STORAGE_PREFIX + name);
    } catch {
      return null;
    }
  }

  function saveValue(name, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + name, value);
    } catch {
      // Ignore (private browsing, storage disabled, quota, etc.): the
      // placeholders still work for the current page view, just without
      // persisting across reloads/navigation.
    }
  }

  // Replaces every placeholder occurrence in root's text with an editable
  // span, without touching existing elements: only real text nodes are
  // walked, so no risk of breaking Pygments' own span markup or any other
  // element structure.
  function applyPlaceholders(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    textNodes.forEach((textNode) => {
      // Three cases, not two: a fenced block is always <pre><code>, inline
      // code (single backtick) is a bare <code> with no <pre> ancestor,
      // and everything else is plain prose. Inline code is deliberately
      // skipped entirely (neither regex): it's how prose documents the
      // "{{ name }}"/"<name>" syntax itself (this very page does both),
      // and that example text must never turn live on its own.
      const parent = textNode.parentElement;
      const inPre = !!(parent && parent.closest("pre"));
      const inInlineCode = !inPre && !!(parent && parent.closest("code"));
      if (inInlineCode) return;
      const re = inPre ? CODE_RE : TEXT_RE;
      const text = textNode.data;
      re.lastIndex = 0;
      if (!re.test(text)) return;
      re.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let cursor = 0;
      let match;
      while ((match = re.exec(text))) {
        if (match.index > cursor) {
          frag.appendChild(document.createTextNode(text.slice(cursor, match.index)));
        }
        const name = match[1];
        const span = document.createElement("span");
        span.className = "var-placeholder";
        span.contentEditable = "true";
        span.spellcheck = false;
        span.dataset.var = name;
        span.textContent = loadValue(name) || name;
        frag.appendChild(span);
        cursor = match.index + match[0].length;
      }
      if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function syncPlaceholders(name, value, exceptEl) {
    document.querySelectorAll('.var-placeholder[data-var="' + name + '"]').forEach((el) => {
      if (el !== exceptEl) el.textContent = value;
    });
  }

  // Clears every persisted value (all variables, not just the ones on this
  // page: they're shared site-wide, see syncPlaceholders) and resets every
  // placeholder currently on screen back to its default (its own name).
  // Triggered by any element marked ".placeholder-reset" (e.g. an attr_list
  // link: `[Réinitialiser](#){: .placeholder-reset }`), not a fixed button
  // this file creates itself, so it can be placed anywhere in the Markdown
  // (an admonition, a page footer...).
  function resetAllPlaceholders() {
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(STORAGE_PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore, same as saveValue: storage may be unavailable.
    }
    document.querySelectorAll(".var-placeholder").forEach((el) => {
      el.textContent = el.dataset.var;
    });
  }

  function init() {
    document.querySelectorAll(".md-content__inner").forEach(applyPlaceholders);
  }

  // Event delegation (not one listener per span): survives spans being
  // replaced/recreated on every instant-navigation pass without rebinding.
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement) || !el.classList.contains("var-placeholder")) return;
    const name = el.dataset.var;
    const value = el.textContent;
    saveValue(name, value);
    syncPlaceholders(name, value, el);
  });

  // A contenteditable span defaults to allowing multi-line content (a
  // literal Enter/newline): a placeholder is meant to be a short inline
  // value, so Enter confirms/blurs instead of inserting a line break.
  document.addEventListener("keydown", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement) || !el.classList.contains("var-placeholder")) return;
    if (event.key === "Enter") {
      event.preventDefault();
      el.blur();
    }
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof HTMLElement && event.target.closest(".placeholder-reset");
    if (!trigger) return;
    event.preventDefault();
    resetAllPlaceholders();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  if (typeof document$ !== "undefined" && document$?.subscribe) {
    document$.subscribe(init);
  }
})();
