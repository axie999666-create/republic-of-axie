(() => {
  const audio = document.getElementById("anthem-audio");
  const currentLine = document.getElementById("anthem-current-line");
  const lyricLines = Array.from(
    document.querySelectorAll("[data-anthem-line]")
  );
  const playButton = document.getElementById("anthemPlayButton");
  const playbackStatus = document.getElementById("anthemPlaybackStatus");

  if (!audio) return;

  const playLabels = {
    zh: { play: "▶ 播放国歌", pause: "Ⅱ 暂停国歌", error: "国歌无法播放，请检查设备音量或稍后重试。" },
    en: { play: "▶ Play national anthem", pause: "Ⅱ Pause national anthem", error: "The anthem could not play. Check device audio or try again." },
    jp: { play: "▶ 国歌を再生", pause: "Ⅱ 国歌を一時停止", error: "国歌を再生できません。音量を確認してもう一度お試しください。" }
  };
  const getLanguage = () => {
    const lang = document.documentElement.lang || "zh-CN";
    return lang.startsWith("en") ? "en" : lang.startsWith("ja") ? "jp" : "zh";
  };
  const syncPlayButton = () => {
    if (playButton) playButton.textContent = audio.paused ? playLabels[getLanguage()].play : playLabels[getLanguage()].pause;
  };
  if (playButton) {
    playButton.addEventListener("click", async () => {
      if (playbackStatus) playbackStatus.textContent = "";
      if (audio.paused) {
        if (audio.ended) audio.currentTime = 0;
        try {
          await audio.play();
        } catch (error) {
          if (playbackStatus) playbackStatus.textContent = playLabels[getLanguage()].error;
          console.error("National anthem playback failed:", error);
        }
      } else {
        audio.pause();
      }
      syncPlayButton();
    });
    ["play", "playing", "pause", "ended"].forEach(type => audio.addEventListener(type, syncPlayButton));
    new MutationObserver(syncPlayButton).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    syncPlayButton();
  }

  if (!currentLine || lyricLines.length === 0) return;

  // Line starts follow the 68 BPM score and the measured coda ritardando.
  // The two-bar intro is instrumental, so the first lyric begins at 7.06s.
  const cues = [
    [7.059, 0], [14.118, 1], [21.176, 2], [28.235, 3],
    [35.294, 4], [49.412, 5], [56.471, 6], [63.529, 7],
    [77.647, 8], [84.706, 9], [91.765, 10], [98.824, 11],
    [105.882, 12], [120.000, 13], [127.059, 14], [134.118, 15],
    [148.235, 16], [162.620, 17]
  ];

  let lastActive = -2;

  function getPrompt() {
    const lang = document.documentElement.lang || "zh-CN";
    const key = lang.startsWith("en") ? "data-en"
      : lang.startsWith("ja") ? "data-jp"
      : "data-zh";
    return currentLine.getAttribute(key) || currentLine.textContent.trim();
  }

  function syncLyrics() {
    const time = audio.currentTime || 0;
    let active = -1;

    for (const [start, lineIndex] of cues) {
      if (time >= start) active = lineIndex;
      else break;
    }

    if (audio.ended) active = lyricLines.length - 1;
    if (active === lastActive) return;
    lastActive = active;

    lyricLines.forEach((line, index) => {
      const isActive = index === active;
      line.classList.toggle("is-active", isActive);
      if (isActive) line.setAttribute("aria-current", "true");
      else line.removeAttribute("aria-current");
    });

    currentLine.textContent = active >= 0
      ? lyricLines[active].textContent.trim()
      : getPrompt();
  }

  ["timeupdate", "seeked", "loadedmetadata", "play", "ended"].forEach(type => {
    audio.addEventListener(type, syncLyrics);
  });
})();
