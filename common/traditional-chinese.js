(() => {
  const openCC = window.OpenCC;
  if (!openCC || typeof openCC.Converter !== "function" || !document.body) return;

  const toTraditional = openCC.Converter({ from: "cn", to: "twp" });
  const storageKey = "roaChineseScript";
  const textSources = new WeakMap();
  const attributeSources = new WeakMap();
  const languageAttributes = ["aria-label", "aria-description", "title", "alt"];
  let mode = "simplified";
  try {
    mode = localStorage.getItem(storageKey) === "traditional" ? "traditional" : "simplified";
  } catch {
    // The switch still works for this page if browser storage is unavailable.
  }

  const style = document.createElement("style");
  style.textContent = `
    .roa-script-toggle {
      position: fixed; z-index: 10000; left: 16px; bottom: 16px;
      display: inline-flex; align-items: center; gap: 7px;
      min-height: 42px; padding: 9px 14px; border: 1px solid rgba(130,180,225,.45);
      border-radius: 999px; color: #eef5ff;
      background: rgba(7,20,38,.94); box-shadow: 0 8px 28px rgba(0,0,0,.24);
      font: 600 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      cursor: pointer; backdrop-filter: blur(12px);
    }
    .roa-script-toggle:hover { background: #16365a; }
    .roa-script-toggle:focus-visible { outline: 3px solid #75b5ff; outline-offset: 3px; }
    @media print { .roa-script-toggle { display: none !important; } }
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.type = "button";
  button.className = "roa-script-toggle";
  button.setAttribute("data-no-traditional", "");
  button.setAttribute("aria-live", "polite");
  document.body.appendChild(button);

  function isExcluded(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    return Boolean(element.closest(
      'script,style,noscript,textarea,input,[contenteditable="true"],[data-no-traditional],[data-traditional-exclude],#passportDialog',
    ));
  }

  function renderText(node, resetSource = false) {
    const parent = node.parentElement;
    if (!parent || isExcluded(parent)) return;
    if (resetSource || !textSources.has(node)) textSources.set(node, node.nodeValue || "");
    const source = textSources.get(node);
    const rendered = mode === "traditional" ? toTraditional(source) : source;
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }

  function renderAttributes(element, changedAttribute = "") {
    if (isExcluded(element)) return;
    let sources = attributeSources.get(element);
    if (!sources) {
      sources = new Map();
      attributeSources.set(element, sources);
    }
    for (const attribute of languageAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      const current = element.getAttribute(attribute) || "";
      if (changedAttribute === attribute || !sources.has(attribute)) sources.set(attribute, current);
      const source = sources.get(attribute);
      const rendered = mode === "traditional" ? toTraditional(source) : source;
      if (current !== rendered) element.setAttribute(attribute, rendered);
    }
  }

  function renderSubtree(node) {
    if (!node) return;
    if (node.nodeType === Node.TEXT_NODE) {
      renderText(node);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || isExcluded(node)) return;
    if (node.tagName === "OPTION" && !node.hasAttribute("value")) node.setAttribute("value", node.value); renderAttributes(node);
    for (const child of node.childNodes) renderSubtree(child);
  }

  let observing = false;
  const observer = new MutationObserver((records) => {
    observer.disconnect();
    observing = false;
    for (const record of records) {
      if (record.type === "characterData") {
        renderText(record.target, true);
      } else if (record.type === "attributes") {
        renderAttributes(record.target, record.attributeName);
      } else {
        for (const node of record.addedNodes) renderSubtree(node);
      }
    }
    observer.observe(document.head, { childList: true, characterData: true, attributes: true, attributeFilter: languageAttributes, subtree: true });
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: languageAttributes, subtree: true });
    observing = true;
  });

  function applyMode(nextMode) {
    mode = nextMode;
    try {
      localStorage.setItem(storageKey, mode);
    } catch {
      // Keep the selected mode for the current page.
    }
    if (observing) {
      observer.disconnect();
      observing = false;
    }
    renderSubtree(document.head);
    renderSubtree(document.body);
    button.textContent = mode === "simplified" ? "繁體中文" : "簡體中文";
    button.setAttribute("aria-pressed", String(mode === "traditional"));
    button.setAttribute("aria-label", mode === "simplified" ? "切换为繁体中文" : "切換為簡體中文");
    observer.observe(document.head, { childList: true, characterData: true, attributes: true, attributeFilter: languageAttributes, subtree: true });
    observer.observe(document.body, { childList: true, characterData: true, attributes: true, attributeFilter: languageAttributes, subtree: true });
    observing = true;
  }

  button.addEventListener("click", () => {
    applyMode(mode === "simplified" ? "traditional" : "simplified");
  });
  applyMode(mode);
})();
