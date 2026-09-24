// Fusion de blur-code.js et collapsible-code.js en un seul fichier.
// blur-code doit toujours s'abonner à document$ avant collapsible-code:
// sur un bloc .codeblock contenant une commande "$ ...", collapsible-code
// reconstruit entièrement le DOM du bloc (le <code> d'origine disparaît),
// donc si blur-code s'exécutait après, il ne retrouverait plus rien à flouter.
// L'ordre des deux IIFE ci-dessous n'est donc pas interchangeable.
//
// data-blur exige aussi .codeblock (comme toutes les autres options): pas
// de flou "léger" isolé sans le reste des features, tout passe par le même
// interrupteur.

document$.subscribe(function () {
  document.querySelectorAll(".codeblock[data-blur]").forEach(function (container) {
    if (container.dataset.blurInit) return;
    container.dataset.blurInit = "true";

    var code = container.querySelector("code");
    if (!code) return;

    // One <span id="__span-N-M"> per source line, in order: index directly
    // into code.children by line number (1-indexed), same convention as
    // pymdownx.highlight's own hl_lines. Same syntax too: space-separated
    // entries, each either a single line ("3") or an inclusive range
    // ("1-5"), any number of either mixed together ("1-5 8 14-26").
    var lines = code.children;
    container.getAttribute("data-blur").trim().split(/\s+/).forEach(function (entry) {
      var bounds = entry.split("-").map(Number);
      var start = bounds[0];
      var end = bounds.length > 1 ? bounds[1] : bounds[0];
      for (var n = start; n <= end; n++) {
        var line = lines[n - 1];
        if (line) line.classList.add("blurred");
      }
    });
  });
});

document$.subscribe(function () {
  var ICON_COPY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';

  // Detects a "$ ..." command line. Only "$" counts (not "#" too): a bare
  // "#" collides with real comment lines in YAML/Dockerfile/shell/etc
  // content, wrongly flipping those blocks into transcript mode.
  // Root/elevated commands are shown as "$ sudo ..." instead of a literal
  // "#" prompt, which is what every example on this page already does.
  var PROMPT_RE = /^\s*\$\s/;
  // Same prompt, but for *stripping* it from displayed/copied text: the
  // trailing space is optional here (a lone "$" with nothing after it is
  // still a prompt to strip), unlike PROMPT_RE's detection use above.
  var PROMPT_STRIP_RE = /^\s*\$\s?/;

  // seg.command/seg.output come from code.innerHTML (raw HTML, tags already
  // stripped by the caller via regex): Pygments escapes literal ">"/"<"/"&"
  // as "&gt;"/"&lt;"/"&amp;" in that markup, so a copy button built from the
  // tag-stripped string alone would still copy those entities literally
  // (e.g. a real ">" redirect pasted into a shell as the useless "&gt;").
  // A <textarea> round-trip lets the browser's own HTML parser do the
  // decoding instead of hand-rolling one entity table here.
  var entityDecoder = document.createElement("textarea");
  function decodeEntities(text) {
    entityDecoder.innerHTML = text;
    return entityDecoder.value;
  }

  // Builds the <svg> markup for a {path, color} Simple Icons entry, shared
  // by the title-banner icon and the per-command terminal icon so both
  // stay in sync instead of duplicating the markup string by hand at each
  // call site. A null color means Simple Icons' own brand color is pure
  // black (OpenJDK, JSON, Markdown): unreadable on a dark background, so
  // fall back to the theme's own text color instead of a hardcoded one.
  function renderIconSvg(icon) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="' +
      (icon.color || "currentColor") +
      '"><path d="' + icon.path + '"/></svg>';
  }

  // Wires a copy-to-clipboard button shared by all three copy buttons on
  // this page (plain file content, a command, a peek-mode output): write
  // getText()'s current value to the clipboard, flash a checkmark, revert.
  function wireCopyButton(btn, getText) {
    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(getText()).catch(function () {});
      btn.innerHTML = ICON_CHECK;
      setTimeout(function () {
        btn.innerHTML = ICON_COPY;
      }, 1000);
    });
  }

  // Vertically centers a floating button between topEl's own top edge and
  // lineEl's bottom edge, relative to referenceRect (a getBoundingClientRect()
  // already computed by the caller, so a loop over several lines only pays
  // for it once). Deliberately NOT just lineEl's own midpoint: topEl (code
  // or .code-output) carries real top padding above its first line
  // (Zensical's native "padding:.82em 1.25em" for code, this file's own
  // "0.8em 1em" for .code-output), and centering on the line alone ignored
  // that empty padding strip, landing the button visibly closer to the
  // line's own text than to the top of the card as a whole. Including
  // topEl's top in the midpoint centers the button in that whole first
  // "row" (padding + line) instead, matching what actually reads as
  // vertically centered at a glance. getBoundingClientRect() is always in
  // the same (viewport) space for every element, so subtracting rects
  // this way is safe regardless of how deeply nested either one is (e.g.
  // inside a <table> layout).
  function centerOnLine(topEl, lineEl, referenceRect) {
    var zoneTop = topEl.getBoundingClientRect().top;
    var lineRect = lineEl.getBoundingClientRect();
    return (zoneTop + lineRect.bottom) / 2 - referenceRect.top - 8;
  }

  // Badge shown in the title banner when title="..." looks like (or is told
  // to be, via data-filetype) a real filename, scoped to .codeblock blocks
  // only: default Zensical title banners elsewhere are left untouched.
  // Icon paths and official brand colors are real Simple Icons data
  // (https://simpleicons.org), fetched from the simple-icons npm package
  // (jsdelivr CDN) rather than hand-drawn, so the shapes are accurate.
  var FILE_ICONS = (function () {
    var icon_python = { path: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z", color: "#3776AB" };
    var icon_openjdk = { path: "M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942zM8.685 7.983a3.515 3.515 0 0 0-.145.997c0 1.951 1.6 3.55 3.55 3.55 1.95 0 3.55-1.598 3.55-3.55 0-.329-.046-.648-.132-.951.334.095.64.208.915.336a42.699 42.699 0 0 1 2.042 5.829c.678 2.545 1.01 4.92.846 6.607-.082.844-.29 1.51-.606 1.94-.315.431-.713.651-1.315.651-.593 0-.932-.27-1.673-.61-.741-.338-1.825-.694-3.792-.758-1.974-.064-3.073.293-3.821.669-.375.188-.659.373-.911.5s-.466.2-.752.2c-.53 0-.876-.209-1.16-.64-.285-.43-.474-1.101-.545-1.948-.141-1.693.176-4.069.823-6.614a43.155 43.155 0 0 1 1.934-5.783c.348-.167.749-.31 1.192-.425zm-3.382 4.362a.216.216 0 0 1 .13.031c-.166.56-.323 1.116-.463 1.665a33.849 33.849 0 0 0-.547 2.555 3.9 3.9 0 0 0-.2-.39c-.58-1.012-.914-1.642-1.16-2.08.315-.24 1.679-1.755 2.24-1.781zm13.394.01c.562.027 1.926 1.543 2.24 1.783-.246.438-.58 1.068-1.16 2.08a4.428 4.428 0 0 0-.163.309 32.354 32.354 0 0 0-.562-2.49 40.579 40.579 0 0 0-.482-1.652.216.216 0 0 1 .127-.03z", color: null };
    var icon_typescript = { path: "M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z", color: "#3178C6" };
    var icon_javascript = { path: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z", color: "#F7DF1E" };
    var icon_yaml = { path: "m0 .97 4.111 6.453v4.09h2.638v-4.09L11.053.969H8.214L5.58 5.125 2.965.969Zm12.093.024-4.47 10.544h2.114l.97-2.345h4.775l.804 2.345h2.26L14.255.994Zm1.133 2.225 1.463 3.87h-3.096zm3.06 9.475v10.29H24v-2.199h-5.454v-8.091zm-12.175.002v10.335h2.217v-7.129l2.32 4.792h1.746l2.4-4.96v7.295h2.127V12.696h-2.904L9.44 17.37l-2.455-4.674Z", color: "#CB171E" };
    var icon_json = { path: "M12.043 23.968c.479-.004.953-.029 1.426-.094a11.805 11.805 0 003.146-.863 12.404 12.404 0 003.793-2.542 11.977 11.977 0 002.44-3.427 11.794 11.794 0 001.02-3.476c.149-1.16.135-2.346-.045-3.499a11.96 11.96 0 00-.793-2.788 11.197 11.197 0 00-.854-1.617c-1.168-1.837-2.861-3.314-4.81-4.3a12.835 12.835 0 00-2.172-.87h-.005c.119.063.24.132.345.201.12.074.239.146.351.225a8.93 8.93 0 011.559 1.33c1.063 1.145 1.797 2.548 2.218 4.041.284.982.434 1.998.495 3.017.044.743.044 1.491-.047 2.229-.149 1.27-.554 2.51-1.228 3.596a7.475 7.475 0 01-1.903 2.084c-1.244.928-2.877 1.482-4.436 1.114a3.916 3.916 0 01-.748-.258 4.692 4.692 0 01-.779-.45 6.08 6.08 0 01-1.244-1.105 6.507 6.507 0 01-1.049-1.747 7.366 7.366 0 01-.494-2.54c-.03-1.273.225-2.553.854-3.67a6.43 6.43 0 011.663-1.918c.225-.178.464-.333.704-.479l.016-.007a5.121 5.121 0 00-1.441-.12 4.963 4.963 0 00-1.228.24c-.359.12-.704.27-1.019.45a6.146 6.146 0 00-.733.494c-.211.18-.42.36-.615.555-1.123 1.153-1.768 2.682-2.022 4.256-.15.973-.15 1.96-.091 2.95.105 1.395.391 2.787.945 4.062a8.518 8.518 0 001.348 2.173 8.14 8.14 0 003.132 2.23 7.934 7.934 0 002.113.54c.074.015.149.015.209.015zm-2.934-.398a4.102 4.102 0 01-.45-.228 8.5 8.5 0 01-2.038-1.534c-1.094-1.137-1.827-2.566-2.247-4.08a15.184 15.184 0 01-.495-3.172 12.14 12.14 0 01.046-2.082c.135-1.257.495-2.501 1.124-3.58a6.889 6.889 0 011.783-2.053 6.23 6.23 0 011.633-.9 5.363 5.363 0 013.522-.045c.029 0 .029 0 .045.03.015.015.045.015.06.03.045.016.104.045.165.074.239.12.479.271.704.42a6.294 6.294 0 012.097 2.502c.42.914.615 1.934.631 2.938.014 1.079-.18 2.157-.645 3.146a6.42 6.42 0 01-2.638 2.832c.09.03.18.045.271.075.225.044.449.074.688.074 1.468.045 2.892-.66 3.94-1.647.195-.18.375-.375.54-.585.225-.27.435-.54.614-.823.239-.375.435-.75.614-1.154a8.112 8.112 0 00.509-1.664c.196-1.004.211-2.022.149-3.026-.135-2.022-.673-4.045-1.842-5.724a9.054 9.054 0 00-.555-.719 9.868 9.868 0 00-1.063-1.034 8.477 8.477 0 00-1.363-.915 9.927 9.927 0 00-1.692-.598l-.3-.06c-.209-.03-.42-.044-.634-.06a8.453 8.453 0 00-1.015.016c-.704.045-1.412.16-2.112.337C5.799 1.227 2.863 3.566 1.3 6.67A11.834 11.834 0 00.238 9.801a11.81 11.81 0 00-.104 3.775c.12 1.02.374 2.023.778 2.977.227.57.511 1.124.825 1.648 1.094 1.783 2.683 3.236 4.51 4.24.688.39 1.408.69 2.157.944.226.074.45.15.689.21z", color: null };
    var icon_gnubash = { path: "M21.038,4.9l-7.577-4.498C13.009,0.134,12.505,0,12,0c-0.505,0-1.009,0.134-1.462,0.403L2.961,4.9 C2.057,5.437,1.5,6.429,1.5,7.503v8.995c0,1.073,0.557,2.066,1.462,2.603l7.577,4.497C10.991,23.866,11.495,24,12,24 c0.505,0,1.009-0.134,1.461-0.402l7.577-4.497c0.904-0.537,1.462-1.529,1.462-2.603V7.503C22.5,6.429,21.943,5.437,21.038,4.9z M15.17,18.946l0.013,0.646c0.001,0.078-0.05,0.167-0.111,0.198l-0.383,0.22c-0.061,0.031-0.111-0.007-0.112-0.085L14.57,19.29 c-0.328,0.136-0.66,0.169-0.872,0.084c-0.04-0.016-0.057-0.075-0.041-0.142l0.139-0.584c0.011-0.046,0.036-0.092,0.069-0.121 c0.012-0.011,0.024-0.02,0.036-0.026c0.022-0.011,0.043-0.014,0.062-0.006c0.229,0.077,0.521,0.041,0.802-0.101 c0.357-0.181,0.596-0.545,0.592-0.907c-0.003-0.328-0.181-0.465-0.613-0.468c-0.55,0.001-1.064-0.107-1.072-0.917 c-0.007-0.667,0.34-1.361,0.889-1.8l-0.007-0.652c-0.001-0.08,0.048-0.168,0.111-0.2l0.37-0.236 c0.061-0.031,0.111,0.007,0.112,0.087l0.006,0.653c0.273-0.109,0.511-0.138,0.726-0.088c0.047,0.012,0.067,0.076,0.048,0.151 l-0.144,0.578c-0.011,0.044-0.036,0.088-0.065,0.116c-0.012,0.012-0.025,0.021-0.038,0.028c-0.019,0.01-0.038,0.013-0.057,0.009 c-0.098-0.022-0.332-0.073-0.699,0.113c-0.385,0.195-0.52,0.53-0.517,0.778c0.003,0.297,0.155,0.387,0.681,0.396 c0.7,0.012,1.003,0.318,1.01,1.023C16.105,17.747,15.736,18.491,15.17,18.946z M19.143,17.859c0,0.06-0.008,0.116-0.058,0.145 l-1.916,1.164c-0.05,0.029-0.09,0.004-0.09-0.056v-0.494c0-0.06,0.037-0.093,0.087-0.122l1.887-1.129 c0.05-0.029,0.09-0.004,0.09,0.056V17.859z M20.459,6.797l-7.168,4.427c-0.894,0.523-1.553,1.109-1.553,2.187v8.833 c0,0.645,0.26,1.063,0.66,1.184c-0.131,0.023-0.264,0.039-0.398,0.039c-0.42,0-0.833-0.114-1.197-0.33L3.226,18.64 c-0.741-0.44-1.201-1.261-1.201-2.142V7.503c0-0.881,0.46-1.702,1.201-2.142l7.577-4.498c0.363-0.216,0.777-0.33,1.197-0.33 c0.419,0,0.833,0.114,1.197,0.33l7.577,4.498c0.624,0.371,1.046,1.013,1.164,1.732C21.686,6.557,21.12,6.411,20.459,6.797z", color: "#4EAA25" };
    var icon_terraform = { path: "M1.44 0v7.575l6.561 3.79V3.787zm21.12 4.227l-6.561 3.791v7.574l6.56-3.787zM8.72 4.23v7.575l6.561 3.787V8.018zm0 8.405v7.575L15.28 24v-7.578z", color: "#844FBA" };
    var icon_html5 = { path: "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z", color: "#E34F26" };
    var icon_css = { path: "M0 0v20.16A3.84 3.84 0 0 0 3.84 24h16.32A3.84 3.84 0 0 0 24 20.16V3.84A3.84 3.84 0 0 0 20.16 0Zm14.256 13.08c1.56 0 2.28 1.08 2.304 2.64h-1.608c.024-.288-.048-.6-.144-.84-.096-.192-.288-.264-.552-.264-.456 0-.696.264-.696.84-.024.576.288.888.768 1.08.72.288 1.608.744 1.92 1.296q.432.648.432 1.656c0 1.608-.912 2.592-2.496 2.592-1.656 0-2.4-1.032-2.424-2.688h1.68c0 .792.264 1.176.792 1.176.264 0 .456-.072.552-.24.192-.312.24-1.176-.048-1.512-.312-.408-.912-.6-1.32-.816q-.828-.396-1.224-.936c-.24-.36-.36-.888-.36-1.536 0-1.44.936-2.472 2.424-2.448m5.4 0c1.584 0 2.304 1.08 2.328 2.64h-1.608c0-.288-.048-.6-.168-.84-.096-.192-.264-.264-.528-.264-.48 0-.72.264-.72.84s.288.888.792 1.08c.696.288 1.608.744 1.92 1.296.264.432.408.984.408 1.656.024 1.608-.888 2.592-2.472 2.592-1.68 0-2.424-1.056-2.448-2.688h1.68c0 .744.264 1.176.792 1.176.264 0 .456-.072.552-.24.216-.312.264-1.176-.048-1.512-.288-.408-.888-.6-1.32-.816-.552-.264-.96-.576-1.2-.936s-.36-.888-.36-1.536c-.024-1.44.912-2.472 2.4-2.448m-11.031.018c.711-.006 1.419.198 1.839.63.432.432.672 1.128.648 1.992H9.336c.024-.456-.096-.792-.432-.96-.312-.144-.768-.048-.888.24-.12.264-.192.576-.168.864v3.504c0 .744.264 1.128.768 1.128a.65.65 0 0 0 .552-.264c.168-.24.192-.552.168-.84h1.776c.096 1.632-.984 2.712-2.568 2.688-1.536 0-2.496-.864-2.472-2.472v-4.032c0-.816.24-1.44.696-1.848.432-.408 1.146-.624 1.857-.63", color: "#663399" };
    var icon_sass = { path: "M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zM9.615 15.998c.175.645.156 1.248-.024 1.792l-.065.18c-.024.061-.052.12-.078.176-.14.29-.326.56-.555.81-.698.759-1.672 1.047-2.09.805-.45-.262-.226-1.335.584-2.19.871-.918 2.12-1.509 2.12-1.509v-.003l.108-.061zm9.911-10.861c-.542-2.133-4.077-2.834-7.422-1.645-1.989.707-4.144 1.818-5.693 3.267C4.568 8.48 4.275 9.98 4.396 10.607c.427 2.211 3.457 3.657 4.703 4.73v.006c-.367.18-3.056 1.529-3.686 2.925-.675 1.47.105 2.521.615 2.655 1.575.436 3.195-.36 4.065-1.649.84-1.261.766-2.881.404-3.676.496-.135 1.08-.195 1.83-.104 2.101.24 2.521 1.56 2.43 2.1-.09.539-.523.854-.674.944-.15.091-.195.12-.181.181.015.09.091.09.21.075.165-.03 1.096-.45 1.141-1.471.045-1.29-1.186-2.729-3.375-2.7-.9.016-1.471.091-1.875.256-.03-.045-.061-.075-.105-.105-1.35-1.455-3.855-2.475-3.75-4.41.03-.705.285-2.564 4.8-4.814 3.705-1.846 6.661-1.335 7.171-.21.733 1.604-1.576 4.59-5.431 5.024-1.47.165-2.235-.404-2.431-.615-.209-.225-.239-.24-.314-.194-.12.06-.045.255 0 .375.12.3.585.825 1.396 1.095.704.225 2.43.359 4.5-.45 2.324-.899 4.139-3.405 3.614-5.505l.073.067z", color: "#CC6699" };
    var icon_markdown = { path: "M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z", color: null };
    var icon_gradle = { path: "M22.695 4.297a3.807 3.807 0 0 0-5.29-.09.368.368 0 0 0 0 .533l.46.47a.363.363 0 0 0 .474.032 2.182 2.182 0 0 1 2.86 3.291c-3.023 3.02-7.056-5.447-16.211-1.083a1.24 1.24 0 0 0-.534 1.745l1.571 2.713a1.238 1.238 0 0 0 1.681.461l.037-.02-.029.02.688-.384a16.083 16.083 0 0 0 2.193-1.635.384.384 0 0 1 .499-.016.357.357 0 0 1 .016.534 16.435 16.435 0 0 1-2.316 1.741H8.77l-.696.39a1.958 1.958 0 0 1-.963.25 1.987 1.987 0 0 1-1.726-.989L3.9 9.696C1.06 11.72-.686 15.603.26 20.522a.363.363 0 0 0 .354.296h1.675a.363.363 0 0 0 .37-.331 2.478 2.478 0 0 1 4.915 0 .36.36 0 0 0 .357.317h1.638a.363.363 0 0 0 .357-.317 2.478 2.478 0 0 1 4.914 0 .363.363 0 0 0 .358.317h1.627a.363.363 0 0 0 .363-.357c.037-2.294.656-4.93 2.42-6.25 6.108-4.57 4.502-8.486 3.088-9.9zm-6.229 6.901l-1.165-.584a.73.73 0 1 1 1.165.587z", color: "#02303A" };
    var icon_docker = { path: "M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z", color: "#2496ED" };
    var icon_toml = { path: "M.014 0h5.34v2.652H2.888v18.681h2.468V24H.015V0Zm17.622 5.049v2.78h-4.274v12.935h-3.008V7.83H6.059V5.05h11.577ZM23.986 24h-5.34v-2.652h2.467V2.667h-2.468V0h5.34v24Z", color: "#9C4121" };
    var icon_dotenv = { path: "M24 0v24H0V0h24ZM10.933 15.89H6.84v5.52h4.198v-.93H7.955v-1.503h2.77v-.93h-2.77v-1.224h2.978v-.934Zm2.146 0h-1.084v5.52h1.035v-3.6l2.226 3.6h1.118v-5.52h-1.036v3.686l-2.259-3.687Zm5.117 0h-1.208l1.973 5.52h1.19l1.976-5.52h-1.182l-1.352 4.085-1.397-4.086ZM5.4 19.68H3.72v1.68H5.4v-1.68Z", color: "#ECD53F" };
    // Not a file extension, only used to mark a "$ ..." command row (see
    // cmdIcon below): kept in this same map purely so it shares
    // detectIcon()/applyTitleIcon()'s existing rendering code.
    var icon_gnometerminal = { path: "M1.846 0A1.841 1.841 0 000 1.846v18.463c0 1.022.823 1.845 1.846 1.845h20.308A1.841 1.841 0 0024 20.31V1.846A1.841 1.841 0 0022.154 0H1.846zm0 .924h20.308c.512 0 .922.41.922.922v18.463c0 .511-.41.921-.922.921H1.846a.919.919 0 01-.922-.921V1.846c0-.512.41-.922.922-.922zm0 .922v18.463h20.308V1.846H1.846zm1.845 2.14l3.235 1.758v.836L3.69 8.477V7.385l2.243-1.207v-.033L3.69 5.076v-1.09zM7.846 9.23h3.693v.924H7.846V9.23zM0 21.736v.418C0 23.177.823 24 1.846 24h20.308A1.841 1.841 0 0024 22.154v-.418a2.334 2.334 0 01-1.846.918H1.846A2.334 2.334 0 010 21.736Z", color: "#241F31" };
    return {
      py: icon_python,
      java: icon_openjdk,
      ts: icon_typescript,
      tsx: icon_typescript,
      js: icon_javascript,
      jsx: icon_javascript,
      yaml: icon_yaml,
      yml: icon_yaml,
      json: icon_json,
      sh: icon_gnubash,
      bash: icon_gnubash,
      tf: icon_terraform,
      html: icon_html5,
      css: icon_css,
      scss: icon_sass,
      md: icon_markdown,
      gradle: icon_gradle,
      dockerfile: icon_docker,
      toml: icon_toml,
      env: icon_dotenv,
      terminal: icon_gnometerminal,
    };
  })();

  // Precomputed once (not rebuilt per command row in the loop further
  // down): the terminal icon's markup never changes between commands.
  var ICON_TERMINAL = renderIconSvg(FILE_ICONS.terminal);

  function detectIcon(container, filename) {
    var key = null;
    var explicit = container.getAttribute("data-filetype");
    if (explicit) {
      key = explicit.toLowerCase();
    } else if (/^dockerfile$/i.test(filename.trim())) {
      key = "dockerfile";
    } else {
      var match = filename.match(/\.([a-zA-Z0-9]+)$/);
      if (match) key = match[1].toLowerCase();
    }
    if (!key) return null;
    var icon = FILE_ICONS[key];
    if (icon) return icon;
    // data-filetype was explicit but we have no real icon for it: fall back
    // to a plain text badge rather than showing nothing.
    return explicit ? { fallbackLabel: explicit.toUpperCase() } : null;
  }

  // A block with title= + linenums= both set gets its whole line-numbers
  // layout wrapped in <table class="highlighttable">: shared by the title
  // icon lookup below and the peek-crop target selection further down.
  function getLinenumsTable(container) {
    return container.querySelector(":scope > table.highlighttable");
  }

  // title="..." (pymdownx.superfences) renders as a <span class="filename">
  // sibling of <pre> inside .highlight, UNLESS linenums= is also set, in
  // which case it's nested one level deeper inside a
  // <th class="filename"><span class="filename">...</span></th> in that
  // <table class="highlighttable">: the <th> carries the same "filename"
  // class as the real span, and appears first in document order, so an
  // untagged ".filename" selector would grab the <th> instead of the span
  // (which is what actually needs the icon inside it). Querying inside the
  // table explicitly (via getLinenumsTable) rather than a bare descendant
  // selector rules that out. Adds the file icon in place and returns the
  // span (or null) so callers can re-home it.
  function applyTitleIcon(container) {
    var linenumsTable = getLinenumsTable(container);
    var titleSpan =
      container.querySelector(":scope > span.filename") ||
      (linenumsTable && linenumsTable.querySelector("span.filename"));
    if (!titleSpan) return null;
    var icon = detectIcon(container, titleSpan.textContent.trim());
    if (icon && icon.fallbackLabel) {
      var badgeEl = document.createElement("span");
      badgeEl.className = "file-badge";
      badgeEl.textContent = icon.fallbackLabel;
      titleSpan.insertBefore(badgeEl, titleSpan.firstChild);
    } else if (icon) {
      var iconEl = document.createElement("span");
      iconEl.className = "file-icon";
      iconEl.innerHTML = renderIconSvg(icon);
      titleSpan.insertBefore(iconEl, titleSpan.firstChild);
    }
    return titleSpan;
  }

  // Shared by both the plain-file-content path and the transcript-output
  // path below: crops clipTarget to exactly "peekLines" of lineHost's
  // children (one <span id="__span-N-M"> per Pygments-rendered line in
  // both cases), then appends a fade + reversible "afficher tout" button
  // right after it. clipTarget and lineHost are the same element in the
  // simple case, but differ when linenums= is also in play (see call site).
  function applyPeekCrop(clipTarget, lineHost, peekLines) {
    var cutoffLine = lineHost.children[peekLines];
    if (!cutoffLine) return;
    var totalLines = lineHost.children.length;
    var visibleHeight = cutoffLine.getBoundingClientRect().top - clipTarget.getBoundingClientRect().top;
    clipTarget.classList.add("peeked");
    clipTarget.style.maxHeight = visibleHeight + "px";

    var fade = document.createElement("div");
    fade.className = "code-peek-fade";
    var expandBtn = document.createElement("button");
    expandBtn.type = "button";
    expandBtn.className = "code-peek-expand";
    expandBtn.textContent = "Afficher tout (" + totalLines + " lignes)";
    fade.appendChild(expandBtn);
    clipTarget.insertAdjacentElement("afterend", fade);

    var isPeeked = true;
    expandBtn.addEventListener("click", function () {
      isPeeked = !isPeeked;
      if (isPeeked) {
        clipTarget.style.maxHeight = visibleHeight + "px";
        clipTarget.classList.add("peeked");
        fade.classList.remove("is-expanded");
        expandBtn.textContent = "Afficher tout (" + totalLines + " lignes)";
      } else {
        clipTarget.style.maxHeight = "";
        clipTarget.classList.remove("peeked");
        fade.classList.add("is-expanded");
        expandBtn.textContent = "Réduire";
      }
    });
  }

  document.querySelectorAll(".highlight.codeblock code").forEach(function (code) {
    if (code.dataset.collapseInit) return;
    code.dataset.collapseInit = "true";

    var container = code.closest(".highlight");
    var startExpanded = container.classList.contains("expanded");
    // Alternative to the full collapse-behind-a-click toggle: when present,
    // output is always shown up to this many lines (no click needed to see
    // anything at all), with a fade + "afficher tout" control if there's
    // more beyond that. Mutually exclusive with the toggle by design (one
    // or the other per block, not both).
    var peekLines = parseInt(container.getAttribute("data-peek"), 10);
    var peekTargets = [];

    // A .codeblock block only makes sense as a command/output transcript.
    // If no line starts with "$ " at all, this is plain file content (like a
    // YAML manifest) shown for its own sake: leave Pygments' native
    // rendering completely untouched (so linenums=/hl_lines= keep working,
    // which they can't once the block below rebuilds everything from
    // scratch), just add the title icon if requested.
    var hasCommand = Array.prototype.some.call(code.children, function (line) {
      return PROMPT_RE.test(line.textContent);
    });
    if (!hasCommand) {
      applyTitleIcon(container);
      // No command row exists in this mode to carry a copy button, and
      // .no-copy (used throughout this page's examples) turns out to
      // suppress Zensical's own native one too: without this, there would
      // be no way at all to copy a plain file's content.
      // Read live at click time (not captured once here into a fixed
      // string): a placeholder span (see placeholders.js) can still be
      // edited by the reader after this button is built, and code stays
      // the same live element throughout, so code.textContent always
      // reflects whatever is currently displayed, edits included.
      var plainCopyBtn = document.createElement("span");
      plainCopyBtn.className = "plain-copy-btn";
      plainCopyBtn.title = "Copier le contenu";
      plainCopyBtn.innerHTML = ICON_COPY;
      wireCopyButton(plainCopyBtn, function () {
        return code.textContent;
      });
      // Floats over the code area itself (like Zensical's own native copy
      // button normally does), not the title bar. Command-row copy buttons
      // (.code-copy-btn) land perfectly centered on their text for free,
      // since both are flex children of the same row (align-items: center).
      // This button has no such row to share, so its "top" is computed to
      // center it on the first code line's own real vertical center
      // instead: offsetTop/offsetHeight would be tempting but are relative
      // to each element's own offsetParent, which for a table cell is the
      // <table> itself, not .highlight, so mixing them with a "top" set on
      // a sibling of .highlight was consistently a few pixels off.
      container.appendChild(plainCopyBtn);
      var firstLine = code.children[0];
      if (firstLine) {
        plainCopyBtn.style.top = centerOnLine(code, firstLine, container.getBoundingClientRect()) + "px";
      }

      if (peekLines && code.children.length > peekLines) {
        // With linenums= the real lines live inside <code>, but that <code>
        // is nested in a <table class="highlighttable"> alongside a
        // separate .linenos column: cropping just the <pre> around <code>
        // would leave the line-number column showing every line while the
        // code column shows only the first few, visibly out of sync. Crop
        // the whole table in that case so both columns stay in lockstep;
        // otherwise crop the plain <pre> that directly wraps <code>.
        var clipTarget = getLinenumsTable(container) || code.parentElement;
        applyPeekCrop(clipTarget, code, peekLines);
      }
      return;
    }

    // title="..." is saved before wiping the container below, so a titled
    // block keeps its filename banner (with icon already applied) once
    // rebuilt.
    var titleSpan = applyTitleIcon(container);

    // linenums= never survives as a literal attribute (pymdownx consumes it
    // to build the <table class="highlighttable"> line-numbers column
    // instead), so its only trace once we get here is that table itself.
    // Reuse getLinenumsTable (same detection already used for peek-crop
    // above) to tell whether it was requested at all, and read its actual
    // starting number (matters for a numbered excerpt, e.g. linenums="8").
    var linenumsTable = getLinenumsTable(container);
    var showLineNumbers = !!linenumsTable;
    var lineNumStart = 1;
    if (linenumsTable) {
      var firstNumEl = linenumsTable.querySelector(".linenos span");
      if (firstNumEl) lineNumStart = parseInt(firstNumEl.textContent, 10) || 1;
    }

    var lines = code.innerHTML.split("\n");
    var segments = [];
    var current = null;
    // A multi-line "$ curl ... \" command (trailing backslash) spreads its
    // continuation across several raw source lines, none of which start
    // with "$" themselves: without tracking this, each continuation line
    // fails the isCommand test and gets wrongly appended to the *previous*
    // command's output instead of staying part of the command itself.
    var inContinuation = false;

    lines.forEach(function (line, i) {
      var lineNum = lineNumStart + i;
      var plain = line.replace(/<[^>]+>/g, "");
      if (inContinuation) {
        current.command += "\n" + line;
        inContinuation = /\\$/.test(plain.trim());
        return;
      }
      var isCommand = PROMPT_RE.test(plain);
      if (isCommand || !current) {
        current = { command: line, commandLineNum: lineNum, output: [], outputLineNums: [] };
        segments.push(current);
        inContinuation = /\\$/.test(plain.trim());
      } else {
        current.output.push(line);
        current.outputLineNums.push(lineNum);
      }
    });

    var wrapper = document.createElement("div");

    segments.forEach(function (seg) {
      var rawCommand = decodeEntities(seg.command.replace(/<[^>]+>/g, "")).replace(
        PROMPT_STRIP_RE,
        ""
      );

      var cmdRow = document.createElement("div");
      cmdRow.className = "code-command";

      // Every command row is a real shell command typed at a "$" prompt,
      // regardless of which Pygments lexer happens to color its output
      // (bash/console/etc): the GNOME Terminal icon marks that fact directly
      // on the row itself, since a plain "$ ..." block (no title=) has no
      // title banner of its own to carry a file-type icon in.
      var cmdIcon = document.createElement("span");
      // "command-icon" (on top of the usual "file-icon") lets CSS single
      // this one out: GNOME Terminal's real brand color (#241F31) is a
      // near-black that all but disappears on the dark theme, so a
      // dark-mode-only override switches it to currentColor there while
      // keeping the true brand color in light mode.
      cmdIcon.className = "file-icon command-icon";
      cmdIcon.innerHTML = ICON_TERMINAL;

      // A dedicated wrapper (not appending the icon straight to cmdRow) so
      // "justify-content: space-between" on .code-command still splits the
      // row into exactly two groups: icon+command on the left, copy button
      // on the right.
      var cmdLeft = document.createElement("span");
      cmdLeft.className = "code-command-left";
      // Set on cmdLeft (not cmdRow): cmdRow is the flex row split into two
      // groups by "justify-content: space-between" (icon+command vs. the
      // copy button), so a 3rd flex item here would space itself away from
      // the group instead of sitting right before the icon inside it.
      if (showLineNumbers) {
        cmdLeft.setAttribute("data-line-number", seg.commandLineNum);
      }
      cmdLeft.appendChild(cmdIcon);

      // Built as two separate elements (not one innerHTML string) on purpose:
      // seg.command carries Pygments' line-span markup, which is often left
      // unclosed here (closed only by the following source line, see the
      // trailing-empty-line comment below). Concatenating a closing </span>
      // after it would just close that dangling Pygments tag instead of ours,
      // nesting the copy button inside it and breaking the flex layout.
      var cmdText = document.createElement("span");
      cmdText.className = "code-command-text";
      cmdText.innerHTML = seg.command;
      cmdLeft.appendChild(cmdText);
      cmdRow.appendChild(cmdLeft);

      // The "$" prompt is dropped from the *displayed* command too (the
      // row is already visually distinct enough without it), but every
      // Pygments lexer marks it up differently: "console" wraps it as
      // <span class="gp">$ </span>, "bash" leaves it as a bare unclassed
      // "$" character, "yaml" merges the whole line (prompt included) into
      // a single <span class="l l-Scalar-Plain">. Rather than pile up one
      // regex per lexer, walk the now-parsed cmdText DOM (already correctly
      // self-closed by the browser, however seg.command's raw HTML was
      // structured) to its first real text node, and trim the prompt off
      // that node's own text data directly: works the same regardless of
      // which element happens to wrap it.
      var walker = document.createTreeWalker(cmdText, NodeFilter.SHOW_TEXT);
      var firstText = walker.nextNode();
      while (firstText && firstText.data.trim() === "") {
        firstText = walker.nextNode();
      }
      if (firstText) {
        var strippedFirst = firstText.data.replace(PROMPT_STRIP_RE, "");
        firstText.data = strippedFirst;
        // Pygments sometimes wraps the bare "$" in its own <span> (e.g. the
        // "console" lexer's "gp" class), separate from the following text:
        // stripping it here can empty this node entirely, leaving the space
        // that used to visually separate "$" from the command as *leading*
        // whitespace on the next text node instead, a visible extra gap
        // between the row's icon and the command text.
        if (strippedFirst === "") {
          var nextText = walker.nextNode();
          if (nextText) {
            nextText.data = nextText.data.replace(/^\s+/, "");
          }
        }
      }

      var copyBtn = document.createElement("span");
      copyBtn.className = "code-copy-btn";
      copyBtn.title = "Copier la commande";
      copyBtn.innerHTML = ICON_COPY;
      cmdRow.appendChild(copyBtn);

      wireCopyButton(copyBtn, function () {
        return rawCommand;
      });

      wrapper.appendChild(cmdRow);

      // Pygments' line-span markup leaves a dangling closing tag as the last
      // split segment (the line-span for the final code line isn't closed
      // until the following line), which shows up here as an extra empty
      // trailing entry: drop it so the count/rendered output reflect real lines.
      while (seg.output.length && seg.output[seg.output.length - 1].replace(/<[^>]+>/g, "").trim() === "") {
        seg.output.pop();
      }

      if (seg.output.length > 0) {
        var lineCount = seg.output.length;
        var pre = document.createElement("pre");
        pre.className = "code-output";
        pre.innerHTML = seg.output.join("\n");

        // One <span id="__span-N-M"> per line already (same convention
        // relied on everywhere else in this file): a data attribute per
        // line, read by a CSS ::before, keeps the number purely visual
        // (never part of pre.textContent, so the output copy button still
        // copies exactly the real output, no numbers mixed in).
        if (showLineNumbers) {
          Array.prototype.forEach.call(pre.children, function (lineEl, i) {
            lineEl.setAttribute("data-line-number", seg.outputLineNums[i]);
          });
        }

        // A wide output line (e.g. a "docker ps" table row) needs to
        // scroll horizontally rather than wrap (see the pre/pre-wrap
        // comment on .code-output below), but a highlighted (hl_lines=)
        // line's background is a block-level Pygments span with
        // width:auto: inside an overflow-x:auto box, width:auto resolves
        // against that box's OWN (visible, unscrolled) width, not the
        // true scrollable content width, so the highlight visibly stopped
        // partway across a wide line instead of reaching it. Moving
        // overflow-x onto this separate wrapper, while .code-output itself
        // sizes to its natural content width (width: max-content), lets
        // Pygments' block-level highlight span size against that same
        // natural width instead, so it always reaches the true end of the
        // line, however wide.
        var scrollWrapper = document.createElement("div");
        scrollWrapper.className = "code-output-scroll";
        scrollWrapper.appendChild(pre);

        if (peekLines) {
          // Peek mode: always visible from the start, no toggle row at all.
          // Height-capping happens in a second pass below, once this pre is
          // actually attached to the page (getBoundingClientRect on a
          // detached node returns zeroes, so it can't be measured yet here).
          pre.classList.add("is-open");
          wrapper.appendChild(scrollWrapper);
          if (lineCount > peekLines) {
            peekTargets.push({ pre: pre, scrollWrapper: scrollWrapper });
          }
        } else {
          var toggle = document.createElement("div");
          toggle.className = "code-collapse-toggle";
          toggle.textContent =
            "Afficher la sortie (" + lineCount + (lineCount > 1 ? " lignes)" : " ligne)");

          if (startExpanded) {
            pre.classList.add("is-open");
            toggle.classList.add("is-open");
          }

          toggle.addEventListener("click", function () {
            var open = pre.classList.toggle("is-open");
            toggle.classList.toggle("is-open", open);
          });

          wrapper.appendChild(toggle);
          wrapper.appendChild(scrollWrapper);
        }
      }
    });

    container.innerHTML = "";
    if (titleSpan) {
      container.appendChild(titleSpan);
    }
    container.appendChild(wrapper);

    // Cap each peek-mode output to its requested line count and add the
    // fade + expand control, now that these <pre> elements are attached to
    // the page and can actually be measured. Each line is its own element
    // (one <span id="__span-N-M"> per Pygments-rendered line, same
    // convention relied on elsewhere in this file and in blur-code.js), so
    // the pixel height of exactly "peekLines" of them is the distance from
    // the pre's own top to the top of the first line past that limit: exact
    // regardless of font-size/zoom, no line-height math to get wrong.
    // Measured once outside the loop: container's own top doesn't move as
    // each peek target below gets cropped (shrinking a descendant's height
    // never shifts what's above it), so re-querying it per iteration would
    // just force the same reflow repeatedly for an identical value.
    var containerRect = container.getBoundingClientRect();
    peekTargets.forEach(function (target) {
      var pre = target.pre;
      var scrollWrapper = target.scrollWrapper;
      // clipTarget is the scroll wrapper (not pre itself): capping pre's
      // own height would fight with its "width: max-content" sizing, and
      // the fade/expand control needs to sit outside the horizontally
      // scrolling area, not inside it (see the wrapper's own comment above).
      applyPeekCrop(scrollWrapper, pre, peekLines);

      // A command's own copy button only ever copies the command itself
      // (see copyBtn above): output has no equivalent anywhere, peek mode
      // included, even though it's often exactly the part worth copying
      // (e.g. a file listing like this one). Same icon/behavior, placed
      // over the output's own corner this time. Anchored to scrollWrapper
      // (not pre) for the same reason as applyPeekCrop above: pre lives
      // inside an overflow-x:auto box, and an absolutely positioned
      // descendant of a scrolling ancestor risks being clipped or
      // scrolled along with it even though its containing block (.highlight)
      // is further up the tree.
      var outputCopyBtn = document.createElement("span");
      outputCopyBtn.className = "code-copy-btn code-output-copy-btn";
      outputCopyBtn.title = "Copier la sortie";
      outputCopyBtn.innerHTML = ICON_COPY;
      // Read live at click time, same reasoning as plainCopyBtn above: a
      // placeholder inside this output can still be edited afterwards.
      wireCopyButton(outputCopyBtn, function () {
        return pre.textContent;
      });
      scrollWrapper.insertAdjacentElement("beforebegin", outputCopyBtn);
      var firstOutputLine = pre.children[0];
      if (firstOutputLine) {
        outputCopyBtn.style.top = centerOnLine(pre, firstOutputLine, containerRect) + "px";
      }
    });
  });
});

// Independent of the two IIFEs above: only touches the native
// linenums=+title= table (.highlighttable .linenos), which exists purely
// in plain-file mode straight from the static build, never something the
// other two rebuild or depend on, so its own ordering doesn't matter.
//
// .linenos' line numbers keep the "\n" between them as a separate
// sibling text node ("<span>1</span>\n<span>2</span>..."), unlike the
// matching code column where pymdownx bakes the trailing "\n" *inside*
// each line's own span ("<span>foo\n</span><span>bar\n</span>..."). The
// .zebra CSS rule (display:block on alternating spans, for a full-width
// background) relies on that code-side convention: giving a *sibling*
// text node's neighbor display:block still leaves the "\n" itself as its
// own separate inline text run, which a block-level neighbor turns into
// its own anonymous line box, doubling every row's height. Rehoming each
// "\n" into the end of the span right before it (same DOM operation,
// just moved, nothing cloned or lost) makes .linenos structurally match
// code's own convention exactly, so the same CSS approach that already
// works there works here too, without special-casing the stylesheet.
document$.subscribe(function () {
  document.querySelectorAll(".codeblock.zebra .linenos pre").forEach(function (pre) {
    if (pre.dataset.zebraNormalized) return;
    pre.dataset.zebraNormalized = "true";
    var node = pre.firstChild;
    while (node) {
      var next = node.nextSibling;
      if (node.nodeType === Node.TEXT_NODE && node.previousSibling instanceof Element) {
        node.previousSibling.appendChild(node);
      }
      node = next;
    }
  });
});
