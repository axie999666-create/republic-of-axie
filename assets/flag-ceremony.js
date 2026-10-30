(() => {
  const startButton = document.getElementById("startFlagCeremony");
  const closeButton = document.getElementById("closeFlagCeremony");
  const dialog = document.getElementById("flagRaisingCeremony");
  const canvas = document.getElementById("flagRaisingCanvas");
  const completeNotice = document.getElementById("ceremonyComplete");
  const audio = document.getElementById("anthem-audio");
  const flag = document.querySelector(".flag-figure img");
  if (!startButton || !closeButton || !dialog || !canvas || !audio || !flag) return;

  // The source track is 184.19s, with about 3 seconds of digital silence after its final audible fade.
  // The flag reaches the masthead at the measured end of that fade.
  const finalAudibleTime = 181.2;
  const context = canvas.getContext("2d");
  if (!context) return;
  let width = 0, height = 0, dpr = 1, frameId = 0, playing = false;
  let finished = false;
  let flagImage = null;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const mix = (a, b, amount) => Math.round(a + (b - a) * amount);
  const color = (a, b, amount) => `rgb(${mix(a[0], b[0], amount)},${mix(a[1], b[1], amount)},${mix(a[2], b[2], amount)})`;

  function draw(time, progress) {
    context.clearRect(0, 0, width, height);
    const dawn = Math.min(1, Math.max(0, progress));
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, color([4, 10, 27], [12, 34, 65], dawn));
    sky.addColorStop(.55, color([8, 23, 48], [31, 86, 127], dawn));
    sky.addColorStop(1, color([10, 38, 69], [232, 148, 91], dawn));
    context.fillStyle = sky; context.fillRect(0, 0, width, height);

    // The stars gently fade into the dawn as the anthem progresses.
    const starAlpha = Math.max(0, .75 * (1 - dawn * 1.25));
    for (let i = 0; i < 72; i++) {
      const x = ((i * 7919 + 419) % 10000) / 10000 * width;
      const y = ((i * 3571 + 173) % 10000) / 10000 * height * .72;
      const twinkle = .55 + .45 * Math.sin(time * 1.5 + i * 2.2);
      context.globalAlpha = starAlpha * twinkle;
      context.fillStyle = "#d7eaff";
      context.beginPath(); context.arc(x, y, 1 + (i % 3) * .35, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;

    // Dawn glow rises behind the mast in step with the flag.
    const sunX = width * .72;
    const sunY = height * (.91 - dawn * .36);
    const sunRadius = Math.min(width, height) * (.035 + dawn * .025);
    const glow = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 4.5);
    glow.addColorStop(0, `rgba(255,224,166,${.12 + dawn * .44})`);
    glow.addColorStop(1, "rgba(255,214,151,0)");
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
    context.fillStyle = `rgba(255,232,190,${.3 + dawn * .7})`;
    context.beginPath(); context.arc(sunX, sunY, sunRadius, 0, Math.PI * 2); context.fill();

    // A quiet futuristic skyline anchors the ceremony scene.
    const ground = height * .86;
    context.fillStyle = "rgba(4,12,28,.72)";
    context.beginPath(); context.moveTo(0, ground);
    for (let i = 0; i <= 14; i++) {
      const x = width * i / 14;
      const top = ground - (i % 3 === 1 ? height * (.07 + (i % 5) * .012) : height * .025);
      context.lineTo(x, top); context.lineTo(Math.min(width, x + width / 28), ground);
    }
    context.lineTo(width, height); context.lineTo(0, height); context.closePath(); context.fill();
    for (let i = 0; i < 52; i++) {
      const x = ((i * 673 + 107) % 1000) / 1000 * width;
      const y = ground + 8 + (i % 4) * 7;
      context.fillStyle = `rgba(124,245,210,${.16 + dawn * .24})`;
      context.fillRect(x, y, 2, 5);
    }

    const poleX = width * .31;
    const mastTop = height * .14;
    const mastBottom = height * .87;
    const flagWidth = Math.min(width * .38, 360);
    const flagHeight = flagWidth * 529 / 831;
    const flagTop = mastTop + 12;
    const flagBottom = mastBottom - flagHeight - 8;
    const flagY = flagBottom + (flagTop - flagBottom) * dawn;

    context.save();
    context.lineCap = "round";
    context.strokeStyle = "rgba(220,238,255,.88)"; context.lineWidth = Math.max(4, width * .006);
    context.shadowColor = "rgba(79,195,255,.62)"; context.shadowBlur = 15;
    context.beginPath(); context.moveTo(poleX, mastBottom); context.lineTo(poleX, mastTop); context.stroke();
    context.shadowBlur = 0;
    const cap = Math.max(6, width * .009);
    context.fillStyle = "#ffe39a"; context.beginPath(); context.arc(poleX, mastTop, cap, 0, Math.PI * 2); context.fill();
    context.restore();

    if (flagImage?.complete && flagImage.naturalWidth) {
      const slices = 28;
      for (let i = 0; i < slices; i++) {
        const sourceX = flagImage.naturalWidth * i / slices;
        const sourceWidth = flagImage.naturalWidth / slices + 1;
        const sliceX = flagWidth * i / slices;
        const wave = Math.sin(time * 2.2 - i * .24) * (3 + dawn * 5) * i / slices;
        const waveY = Math.cos(time * 1.6 - i * .19) * (2 + dawn * 3) * i / slices;
        context.drawImage(flagImage, sourceX, 0, sourceWidth, flagImage.naturalHeight, poleX + 9 + sliceX + wave, flagY + waveY, flagWidth / slices + 1, flagHeight);
      }
      context.strokeStyle = "rgba(255,255,255,.52)"; context.lineWidth = 1;
      context.strokeRect(poleX + 9, flagY, flagWidth, flagHeight);
    }

    // Small rising glints lead the flag; the final glow lands at the masthead.
    if (dawn < 1) {
      for (let i = 0; i < 22; i++) {
        const phase = (time * .12 + i / 22) % 1;
        const px = poleX + 4 + Math.sin(i * 11 + time) * 10;
        const py = mastBottom - phase * (mastBottom - mastTop);
        context.globalAlpha = (1 - phase) * .56;
        context.fillStyle = i % 2 ? "#7cf5d2" : "#ffe39a";
        context.beginPath(); context.arc(px, py, 1.5 + i % 3 * .35, 0, Math.PI * 2); context.fill();
      }
      context.globalAlpha = 1;
    } else {
      const flare = context.createRadialGradient(poleX, mastTop, 0, poleX, mastTop, 90);
      flare.addColorStop(0, "rgba(255,235,174,.85)"); flare.addColorStop(1, "rgba(255,220,120,0)");
      context.fillStyle = flare; context.fillRect(poleX - 90, mastTop - 90, 180, 180);
    }
  }

  function paint() {
    if (!playing) return;
    const progress = Math.min(1, Math.max(0, audio.currentTime / finalAudibleTime));
    draw(audio.currentTime, progress);
    if (audio.currentTime >= finalAudibleTime || audio.ended) {
      audio.pause();
      playing = false; finished = true;
      if (completeNotice) completeNotice.hidden = false;
      return;
    }
    frameId = requestAnimationFrame(paint);
  }

  async function start() {
    if (!flag.complete || !flag.naturalWidth) await flag.decode();
    flagImage = flag;
    finished = false;
    completeNotice.hidden = true;
    dialog.hidden = false;
    document.body.classList.add("ceremony-open");
    resize(); draw(0, 0);
    audio.pause(); audio.currentTime = 0;
    try {
      await audio.play();
      playing = true;
      closeButton.focus();
      frameId = requestAnimationFrame(paint);
    } catch (error) {
      playing = false;
      dialog.hidden = true;
      document.body.classList.remove("ceremony-open");
      console.error("Could not start the anthem for the flag-raising ceremony:", error);
    }
  }

  function close() {
    playing = false;
    cancelAnimationFrame(frameId);
    audio.pause(); audio.currentTime = 0;
    dialog.hidden = true;
    document.body.classList.remove("ceremony-open");
    completeNotice.hidden = true;
    startButton.focus();
  }

  startButton.addEventListener("click", start);
  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", event => { if (event.target === dialog) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !dialog.hidden) close(); });
  window.addEventListener("resize", () => { if (!dialog.hidden) resize(); }, { passive: true });
  audio.addEventListener("ended", () => {
    if (!playing) return;
    draw(finalAudibleTime, 1); playing = false; finished = true;
    if (completeNotice) completeNotice.hidden = false;
  });
})();
