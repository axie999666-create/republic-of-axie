(() => {
  if (window.__roaTraditionalChineseLoader) return;
  window.__roaTraditionalChineseLoader = true;

  const loaderUrl = document.currentScript?.src || new URL("traditional-chinese-loader.js", document.baseURI).href;
  const commonUrl = new URL(".", loaderUrl);
  const translator = document.createElement("script");
  translator.src = new URL("opencc-js-1.4.2-cn2t.js", commonUrl).href;
  translator.onload = () => {
    const switcher = document.createElement("script");
    switcher.src = new URL("traditional-chinese.js", commonUrl).href;
    document.head.appendChild(switcher);
  };
  translator.onerror = () => console.warn("Traditional Chinese conversion library could not be loaded.");
  document.head.appendChild(translator);
})();
