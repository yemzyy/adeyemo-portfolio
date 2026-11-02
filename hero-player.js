/* Silent, native-video hero sequence. Only the current and next clip are prefetched. */
document.addEventListener("DOMContentLoaded", () => {
  const screen = document.getElementById("phoneScreen");
  const slides = [...document.querySelectorAll(".phone-slide")];
  const videos = slides.map(slide => slide.querySelector("video"));
  if (!screen || videos.length !== 4 || videos.some(video => !video)) return;
  const failed = new Set();
  let current = 0;
  let switching = false;
  let inView = true;
  const permitted = () => inView && !document.hidden && !document.body.classList.contains("lightbox-open");
  function prepare(index, preload) {
    const video = videos[index];
    video.preload = preload;
    if (!video.getAttribute("src")) video.src = video.dataset.heroSrc;
    return video;
  }
  function warmNext(index) {
    prepare((index + 1) % videos.length, navigator.connection?.saveData ? "metadata" : "auto");
  }
  async function playAt(index, restart) {
    if (!permitted() || switching || failed.size === videos.length) return;
    if (failed.has(index)) index = (index + 1) % videos.length;
    if (failed.has(index)) { index = videos.findIndex((_, i) => !failed.has(i)); }
    switching = true;
    const video = prepare(index, "auto");
    if (restart) {
      try { video.currentTime = 0; } catch {}
    }
    try {
      await video.play();
      if (!permitted()) { video.pause(); return; }
      videos.forEach((other, i) => { if (i !== index) other.pause(); });
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      current = index;
      screen.dataset.heroIndex = String(index + 1);
      screen.dataset.heroHistory = [...(screen.dataset.heroHistory || "").split(",").filter(Boolean), String(index + 1)].slice(-12).join(",");
      warmNext(index);
    } catch {
      if (video.error && failed.size < videos.length) {
        failed.add(index);
        queueMicrotask(() => playAt((index + 1) % videos.length, true));
      }
      // Low-power or autoplay-blocking browsers retain the poster until interaction.
    } finally { switching = false; }
  }
  videos.forEach((video, index) => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.playsInline = true;
    video.loop = false;
    video.autoplay = false;
    video.disablePictureInPicture = true;
    video.setAttribute("aria-hidden", "true");
    video.tabIndex = -1;
    video.addEventListener("ended", () => { if (index === current) playAt((index + 1) % videos.length, true); });
    video.addEventListener("error", () => {
      failed.add(index);
      if (index === current && failed.size < videos.length) playAt((index + 1) % videos.length, true);
    });
  });
  const resume = () => {
    if (!permitted()) videos.forEach(video => video.pause());
    else if (videos[current].paused) playAt(videos[current].ended ? (current + 1) % videos.length : current, videos[current].ended);
  };
  window.addEventListener("portfolio:mediafocus", resume);
  document.addEventListener("visibilitychange", resume);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    resume();
  }, { threshold: 0 }).observe(screen);
  document.addEventListener("pointerdown", resume, { once: true, passive: true });
  window.addEventListener("pageshow", resume);
  screen.dataset.heroIndex = "1";
  playAt(0, true);
});
