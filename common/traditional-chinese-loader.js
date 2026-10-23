(() => {
  if (window.__roaTraditionalChineseLoader) return;
  window.__roaTraditionalChineseLoader = true;

  const translator = document.createElement("script");
  translator.src = "/common/opencc-js-1.4.2-cn2t.js";
  translator.onload = () => {
    const switcher = document.createElement("script");
    switcher.src = "/common/traditional-chinese.js";
    document.head.appendChild(switcher);
  };
  translator.onerror = () => console.warn("Traditional Chinese conversion library could not be loaded.");
  document.head.appendChild(translator);
})();
