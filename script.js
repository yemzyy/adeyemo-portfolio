/* ============================================================
   YEMZYY PORTFOLIO — SCRIPT
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     CENTRAL MEDIA PROVIDER CONFIG
     Change this single value to control where portfolio IMAGES load
     from. This is the one place to edit — every image on the site
     (design grid + avatars + portrait) reads from it.

       "auto"       (default) Try Cloudinary first. Only if it genuinely
                    fails to load in the browser (the normal <img> error
                    event — no HEAD requests, no credit checks, no
                    polling) does it silently swap to the matching
                    GitHub-hosted copy, once, with no further retries.
       "cloudinary" Cloudinary only. No fallback if it fails.
       "github"     GitHub only. Cloudinary is never requested at all.

     VIDEO NOTE: there is currently no GitHub fallback for video, so all
     video playback stays on Cloudinary regardless of this setting. If a
     video fallback provider is ever added, mirror the mediaSrc /
     mediaFallbackAttr pattern below for <video> instead of rewriting
     the whole media system.
     ============================================================ */
  const MEDIA_PROVIDER = "auto";

  // The src an <img> should start with, for the current MEDIA_PROVIDER.
  // cloudinaryUrl/githubPath are plain strings; either may be blank.
  function mediaSrc(cloudinaryUrl, githubPath) {
    if (MEDIA_PROVIDER === "github") return githubPath || cloudinaryUrl || "";
    return cloudinaryUrl || githubPath || ""; // "cloudinary" and "auto" both start with Cloudinary
  }

  // The onerror attribute string to pair with the src above. Only "auto"
  // mode actually has something to fall back to — the other two modes
  // intentionally have nowhere to fall back to, so a failure just hides
  // the image, matching the site's existing "missing media" placeholder.
  // Setting a fresh, no-op onerror handler *before* changing src is what
  // stops this from ever looping or re-requesting Cloudinary: if the
  // GitHub copy also fails, that new handler fires instead of this one.
  function mediaFallbackAttr(githubPath) {
    if (MEDIA_PROVIDER === "auto" && githubPath) {
      return `onerror="this.onerror=function(){this.style.display='none'};this.src='${githubPath}'"`;
    }
    return `onerror="this.style.display='none'"`;
  }

  // Static (non-JSON-driven) images — avatars, portrait — are marked up in
  // index.html with data-cloudinary / data-github instead of a src, so this
  // one function decides their src the same way as the JSON-driven grid.
  function initStaticMedia() {
    document.querySelectorAll("img[data-cloudinary], img[data-github]").forEach((img) => {
      const cloudinaryUrl = img.dataset.cloudinary || "";
      const githubPath = img.dataset.github || "";
      img.src = mediaSrc(cloudinaryUrl, githubPath);
      if (MEDIA_PROVIDER === "auto" && githubPath) {
        img.addEventListener("error", function onFirstError() {
          img.removeEventListener("error", onFirstError);
          img.addEventListener("error", () => { img.style.display = "none"; }, { once: true });
          img.src = githubPath;
        }, { once: true });
      } else {
        img.addEventListener("error", () => { img.style.display = "none"; }, { once: true });
      }
    });
  }
  initStaticMedia();

  /* ============================================================
     CENTRAL VIDEO PROVIDER CONFIG
     Portfolio video playback (the video/vlog grids) is separate from the
     image system above. Cloudinary is the primary provider; Google Drive
     is the CURRENT fallback provider — swappable for another one later
     (e.g. "github", "bunny", "git-lfs") by changing one value and adding
     one branch to getVideoSources(). Nothing else in the codebase needs
     to change when the fallback provider changes.
       VIDEO_PRIMARY_PROVIDER  — always "cloudinary" for now.
       VIDEO_FALLBACK_PROVIDER — the provider used only after a genuine
                                 Cloudinary playback failure.
     ============================================================ */
  const VIDEO_PRIMARY_PROVIDER = "cloudinary";
  const VIDEO_FALLBACK_PROVIDER = "google-drive";

  // Returns an ordered list of { provider, type, src } sources to attempt
  // for one portfolio video, primary first. The lightbox (below) tries
  // sources[0]; only on a genuine playback error does it move to the next
  // one — it never loads two sources at once, and it never goes past the
  // end of this list, so there's no possibility of a retry loop.
  function getVideoSources(item) {
    const sources = [];
    if (VIDEO_PRIMARY_PROVIDER === "cloudinary" && item.videoUrl) {
      sources.push({ provider: "cloudinary", type: "mp4", src: item.videoUrl });
    }
    if (VIDEO_FALLBACK_PROVIDER === "google-drive" && item.driveId) {
      sources.push({ provider: "google-drive", type: "drive-iframe", src: `https://drive.google.com/file/d/${item.driveId}/preview` });
    }
    // To add a future fallback provider, add one more branch here, e.g.:
    //   else if (VIDEO_FALLBACK_PROVIDER === "bunny" && item.bunnyUrl) {
    //     sources.push({ provider: "bunny", type: "mp4", src: item.bunnyUrl });
    //   }
    return sources;
  }

  // Correct MIME type for a <source type="..."> element, so the browser
  // knows what it's being asked to play instead of having to sniff it.
  function cloudinaryVideoMime(url) {
    if (/\.mp4(\?|$)/i.test(url)) return "video/mp4";
    if (/\.webm(\?|$)/i.test(url)) return "video/webm";
    if (/\.mov(\?|$)/i.test(url)) return "video/quicktime";
    return "";
  }

  // .mov (QuickTime) plays natively in Safari but most other mobile/desktop
  // browsers refuse it outright, regardless of the codec inside — that's a
  // real, separate compatibility problem from provider selection. Rather
  // than transforming every Cloudinary video (unnecessary Cloudinary usage
  // for files that are already plain .mp4/.webm and play everywhere), this
  // only asks Cloudinary to auto-negotiate a compatible format for sources
  // that actually need it, and only if the URL isn't already asking for
  // f_auto. Leaves already-fine URLs completely untouched.
  function cloudinaryCompatUrl(url) {
    if (!url || !url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return url;
    if (!/\.mov(\?|$)/i.test(url)) return url; // .mp4/.webm already broadly compatible
    if (url.includes("/video/upload/f_auto")) return url; // already asking for auto format
    return url.replace("/video/upload/", "/video/upload/f_auto,q_auto/");
  }

  // The thumbnail/poster is intentionally resolved independently of which
  // video provider ends up playing: it never reads driveId, and switching
  // VIDEO_FALLBACK_PROVIDER can never change or remove it. Falls back to a
  // frame auto-extracted from the Cloudinary video itself when no explicit
  // poster image has been set in the CMS.
  function getVideoPoster(item) {
    return item.poster || cloudinaryPoster(item.videoUrl) || "";
  }

  function cloudinaryPoster(videoUrl) {
    if (!videoUrl || !videoUrl.includes("res.cloudinary.com") || !videoUrl.includes("/video/upload/")) return "";
    return videoUrl.replace("/video/upload/", "/video/upload/so_0/").replace(/\.mp4(\?.*)?$/, ".jpg");
  }

  /* ============================================================
     HERO VIDEO URLs
     The 4 looping background clips in the homepage phone mockup are
     separate from the 52 portfolio videos / 8 vlogs above — they're not
     part of the CMS-managed project data, so they get their own small,
     explicit config right here instead of being buried in index.html.
     Paste the new Cloudinary cvnqmegn URL for each hero video here after
     uploading it. Do not change the slide1/slide2/slide3/slide4 keys —
     they must match the data-hero-slide values in index.html.
     An empty string is handled safely: that slide's <video> is simply
     left without a src (see initHeroVideos below), so it never fires a
     network request for a URL that doesn't exist yet — it just shows the
     existing "add this video" placeholder, same as any other empty slot
     on the site.
     ============================================================ */
  const HERO_VIDEO_URLS = {
  slide1: "https://res.cloudinary.com/cvnqmegn/video/upload/v1790027552/slide1.mov", 
  slide2: "https://res.cloudinary.com/cvnqmegn/video/upload/v1790027574/slide2.mov",
  slide3: "https://res.cloudinary.com/cvnqmegn/video/upload/v1790027555/slide3.mov",
  slide4: "https://res.cloudinary.com/cvnqmegn/video/upload/v1790027576/slide4.mov",
  };

  function initHeroVideos() {
    document.querySelectorAll("video[data-hero-slide]").forEach((video) => {
      const url = HERO_VIDEO_URLS[video.dataset.heroSlide];
      if (!url) return; // no URL yet — leave src unset, no network request, placeholder shows as normal
      video.src = url;
      const poster = cloudinaryPoster(url);
      if (poster) video.poster = poster;
    });
  }
  initHeroVideos();

  /* ---------- Loading screen (fast, with a small minimum so it doesn't flash-jank) ---------- */
  const loadingScreen = document.getElementById("loadingScreen");
  if (loadingScreen) {
    const loadStart = performance.now();
    const MIN_SHOW_MS = 350;
    const hideLoader = () => {
      const elapsed = performance.now() - loadStart;
      const remaining = Math.max(0, MIN_SHOW_MS - elapsed);
      setTimeout(() => loadingScreen.classList.add("is-hidden"), reduceMotion ? 0 : remaining);
    };
    if (document.readyState === "complete") hideLoader();
    else window.addEventListener("load", hideLoader);
    setTimeout(hideLoader, 2500); // safety net so it never gets stuck
  }

  /* ---------- Logo triple-click easter egg (spin + confetti + celebration sound) ---------- */
  function playCelebrationSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 — a short bright arpeggio
    notes.forEach((freq, i) => {
      const delay = i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.36);
    });
  }

  function launchConfetti() {
    const colors = ["#7c5cff", "#ff6b45", "#a78bfa", "#38d9c4", "#ff2d96"];
    const container = document.createElement("div");
    container.className = "confetti-container";
    document.body.appendChild(container);
    const COUNT = 60;
    for (let i = 0; i < COUNT; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.4 + "s";
      piece.style.animationDuration = 2.2 + Math.random() * 1.3 + "s";
      piece.style.setProperty("--drift", (Math.random() * 140 - 70) + "px");
      piece.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
      if (Math.random() < 0.4) piece.style.borderRadius = "50%";
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 3800);
  }

  const navLogo = document.getElementById("navLogo");
  if (navLogo) {
    let clickCount = 0;
    let clickTimer;
    navLogo.addEventListener("click", () => {
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => { clickCount = 0; }, 800);
      if (clickCount >= 3) {
        clickCount = 0;
        if (!reduceMotion) {
          navLogo.classList.remove("is-egg");
          void navLogo.offsetWidth;
          navLogo.classList.add("is-egg");
          launchConfetti();
          playCelebrationSound();
        }
      }
    });
  }

  /* ---------- Footer year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme toggle (persisted) ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const savedTheme = localStorage.getItem("yemzyy-theme");
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    if (next === "light") document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("yemzyy-theme", next);
  });

  /* ---------- Announcement banner (dismissible, remembered) ---------- */
  const banner = document.getElementById("banner");
  const bannerClose = document.getElementById("bannerClose");
  if (localStorage.getItem("yemzyy-banner-dismissed") === "1") banner.classList.add("is-hidden");
  bannerClose.addEventListener("click", () => {
    banner.classList.add("is-hidden");
    localStorage.setItem("yemzyy-banner-dismissed", "1");
  });

  /* ---------- Scroll progress bar ---------- */
  const progressBar = document.getElementById("progressBar");
  const updateProgress = () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = scrolled + "%";
  };
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------- Sticky nav background + back-to-top visibility ---------- */
  const nav = document.getElementById("nav");
  const backToTop = document.getElementById("backToTop");
  const onScroll = () => {
    if (window.scrollY > 40) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
    if (window.scrollY > 500) backToTop.classList.add("is-visible");
    else backToTop.classList.remove("is-visible");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen);
  });
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------- Glowing display slideshow (auto-rotating + manual arrows) ---------- */
  const slides = document.querySelectorAll(".phone-slide");
  const dotsWrap = document.getElementById("phoneDots");
  let current = 0;
  let autoTimer;
  if (slides.length && dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement("span");
      if (i === 0) dot.classList.add("is-active");
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll("span");
    // Only the visible slide's video should ever be decoding/playing — the
    // other three sit at preload="none" until their slide is actually shown,
    // so the page never downloads/plays four background videos at once.
    const playSlideVideo = (slideEl) => {
      const video = slideEl.querySelector("video.real-media");
      if (video && video.style.display !== "none") {
        if (video.preload === "none") video.preload = "metadata";
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };
    const pauseSlideVideo = (slideEl) => {
      const video = slideEl.querySelector("video.real-media");
      if (video) video.pause();
    };
    const goTo = (i) => {
      pauseSlideVideo(slides[current]);
      slides[current].classList.remove("is-active");
      dots[current].classList.remove("is-active");
      current = (i + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      dots[current].classList.add("is-active");
      playSlideVideo(slides[current]);
    };
    const startAuto = () => { autoTimer = setInterval(() => goTo(current + 1), 3200); };
    const stopAuto = () => clearInterval(autoTimer);
    if (!reduceMotion) startAuto();

    const nextBtn = document.getElementById("phoneNext");
    const prevBtn = document.getElementById("phonePrev");
    if (nextBtn) nextBtn.addEventListener("click", () => { goTo(current + 1); stopAuto(); if (!reduceMotion) startAuto(); });
    if (prevBtn) prevBtn.addEventListener("click", () => { goTo(current - 1); stopAuto(); if (!reduceMotion) startAuto(); });
  }

  /* ---------- Portfolio data ----------
     Loads assets/data/{design,video,vlog}.json (CMS-managed via Decap).
     If that fetch fails (e.g. previewing locally via file://, which
     browsers block from fetching), falls back to the defaults embedded
     below — same safe pattern used for pricing/stats/reviews. Either way
     the portfolio always renders. */
  const DESIGN_DEFAULT = [
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-01.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646635/design-01.png"
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-02.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646612/design-02.png"
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-03.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646635/design-03.png"
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-04.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646077/design-04.png"
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-05.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787645876/design-05.jpg"
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-06.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787645865/design-06.jpg"
  },
  {
    "title": "Thanksgiving Celebration",
    "category": "Faith & Church",
    "image": "assets/design/design-07.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646629/design-07.jpg"
  },
  {
    "title": "Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-08.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646638/design-08.png"
  },
  {
    "title": "Thanksgiving Service",
    "category": "Faith & Church",
    "image": "assets/design/design-09.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646629/design-09.png"
  },
  {
    "title": "Reunion & Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-10.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646617/design-10.jpg"
  },
  {
    "title": "Prayer & Fasting",
    "category": "Faith & Church",
    "image": "assets/design/design-11.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646622/design-11.jpg"
  },
  {
    "title": "Cloud VPS Hosting",
    "category": "Tech & Cloud",
    "image": "assets/design/design-12.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646629/design-12.jpg"
  },
  {
    "title": "Eid Mubarak",
    "category": "Faith & Church",
    "image": "assets/design/design-13.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646638/design-13.jpg"
  },
  {
    "title": "Cloud Hosting Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-14.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646635/design-14.jpg"
  },
  {
    "title": "Cloud Technology Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-15.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646633/design-15.jpg"
  },
  {
    "title": "Scale Your Business with Cloud VPS",
    "category": "Tech & Cloud",
    "image": "assets/design/design-16.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646637/design-16.jpg"
  },
  {
    "title": "Credit Card Services",
    "category": "Finance",
    "image": "assets/design/design-17.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646639/design-17.jpg"
  },
  {
    "title": "Credit Card Solutions",
    "category": "Finance",
    "image": "assets/design/design-18.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646639/design-18.jpg"
  },
  {
    "title": "Yemzyy Pay Credit Services",
    "category": "Finance",
    "image": "assets/design/design-19.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646639/design-19.jpg"
  },
  {
    "title": "Keep Learning Without Interruption",
    "category": "Education",
    "image": "assets/design/design-20.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646646/design-20.jpg"
  },
  {
    "title": "Auto Finance",
    "category": "Finance",
    "image": "assets/design/design-21.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646648/design-21.jpg"
  },
  {
    "title": "Secure Funds",
    "category": "Finance",
    "image": "assets/design/design-22.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646052/design-22.jpg"
  },
  {
    "title": "Credit Services",
    "category": "Finance",
    "image": "assets/design/design-23.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646654/design-23.jpg"
  },
  {
    "title": "Smart Spending",
    "category": "Finance",
    "image": "assets/design/design-24.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646657/design-24.jpg"
  },
  {
    "title": "Insurance Solutions",
    "category": "Finance",
    "image": "assets/design/design-25.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646644/design-25.jpg"
  },
  {
    "title": "Healthcare",
    "category": "Healthcare",
    "image": "assets/design/design-26.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646663/design-26.jpg"
  },
  {
    "title": "Motor Insurance",
    "category": "Finance",
    "image": "assets/design/design-27.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646654/design-27.jpg"
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-28.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646655/design-28.jpg"
  },
  {
    "title": "Consumer Electronics",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-29.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646652/design-29.jpg"
  },
  {
    "title": "Tech Deals",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-30.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646529/design-30.jpg"
  },
  {
    "title": "November Campaign",
    "category": "Marketing",
    "image": "assets/design/design-31.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646522/design-31.jpg"
  },
  {
    "title": "Digital Marketing",
    "category": "Marketing",
    "image": "assets/design/design-32.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646531/design-32.jpg"
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-33.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646520/design-33.jpg"
  },
  {
    "title": "Tech Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-34.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646521/design-34.jpg"
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-35.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646538/design-35.jpg"
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-36.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646539/design-36.jpg"
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-37.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646584/design-37.jpg"
  },
  {
    "title": "Tech Essentials",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-38.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646552/design-38.jpg"
  },
  {
    "title": "Smart Gadgets",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-39.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646586/design-39.jpg"
  },
  {
    "title": "Paper Cut",
    "category": "Lifestyle",
    "image": "assets/design/design-40.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646597/design-40.png"
  },
  {
    "title": "Footwear Collection",
    "category": "Fashion",
    "image": "assets/design/design-41.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646537/design-41.png"
  },
  {
    "title": "Shoe Collection",
    "category": "Fashion",
    "image": "assets/design/design-42.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646543/design-42.png"
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-43.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646530/design-43.jpg"
  },
  {
    "title": "Birthday Celebration",
    "category": "Lifestyle",
    "image": "assets/design/design-44.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646537/design-44.png"
  },
  {
    "title": "Digital Agency",
    "category": "Marketing",
    "image": "assets/design/design-45.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646550/design-45.png"
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-46.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646584/design-46.png"
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-47.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646608/design-47.png"
  },
  {
    "title": "Kings & Courage",
    "category": "Music & Sports",
    "image": "assets/design/design-48.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646596/design-48.png"
  },
  {
    "title": "Basketball",
    "category": "Music & Sports",
    "image": "assets/design/design-49.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646600/design-49.png"
  },
  {
    "title": "Christmas & New Year",
    "category": "Seasonal",
    "image": "assets/design/design-50.jpg",
    "recent": false,
    "imageUrl": "https://res.cloudinary.com/ztkrzhqm/image/upload/f_auto,q_auto,w_800,c_limit/v1787646603/design-50.png"
  }
];

  const VIDEO_DEFAULT = [
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859548/video-01.mov",
    "driveId": "1tEIH_vzytrYpT9lFOs4kQdmx3hQy8kmc",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Social Media Growth",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861362/video-02.mov",
    "driveId": "1fPKc-83OB-96fUx2H7fezhk0do7opNFZ",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "More Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862136/video-03.mov",
    "driveId": "1QXEQvl1JEKWLMjnYx5kp-fSgzDrcw2XC",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Healthy Living",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861481/video-04.mov",
    "driveId": "1tLReAJHEd_exxpwwvTnYVe_jmFj4riuK",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate Marketing",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861917/video-05.mov",
    "driveId": "1r1v87Ej0Y-2pAsBp6n5FtBjNF_lwnc8C",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Love & Understanding",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861497/video-06.mov",
    "driveId": "16G6BjfZxIy2ew5rIV5WjtMBHkQdmH7Y7",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Cillian Murphy Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859928/video-07.mov",
    "driveId": "1eg9QhxRcUYk5VqrYdu15oUc7oxLtk0Dk",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Retirement Planning",
    "category": "Life & Career",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789857497/video-08.mov",
    "driveId": "14q2L7CvEwXFSVblIEb7aso_WEaqrnfut",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Figma Tips",
    "category": "Creative & Design",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861731/video-09.mov",
    "driveId": "1A1kjthqR-jlMn4GfRhMr2dJqjeLGn5Za",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Menstrual Health",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862260/video-10.mov",
    "driveId": "1ID4pCGUQWITOZ52g5x73z8_4Z7omtZv0",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Gift Box Business",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861859/video-11.mov",
    "driveId": "1RwfZ5BIK9K9-Hq1EtHRsgR4ySatxIWCk",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Social Media Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860208/video-12.mov",
    "driveId": "1-plqJw-OvWZQlMHxJjkx-OCRVuTQD9zd",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Client & Firm Dynamics",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860315/video-13.mov",
    "driveId": "1LYWe8IgP0Z8BTejqoJGbjePW6ARxud48",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Successful Trading",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860533/video-14.mov",
    "driveId": "1C5-6dyhN-zkQVC4HBoyE0P-MCJMmWVjx",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Lightning Effects",
    "category": "Creative & Design",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860615/video-15.mov",
    "driveId": "14X3tGzCvyvDRm6V3ptktNFCeEJVX-lHx",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "From Social Manager to Realtor",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862153/video-16.mov",
    "driveId": "1eu7F247kioEyElSeA7iMjozgRvxq4Zp8",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860581/video-17.mov",
    "driveId": "10fULNND94sIHykN-gV6bwgGX4a2yjuV8",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858374/video-18.mov",
    "driveId": "1gTCgmno3bVgvSHvc8S8Cnl-Ofg7U9Z9m",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861418/video-19.mov",
    "driveId": "1Hg2pwYShAk4LBhxEKETMmZZxFJoHm1M9",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860814/video-20.mov",
    "driveId": "1HzlUJTo9T8w6AjfUSRvBUjjzO9yO_Yps",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Acne Care",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862046/video-21.mov",
    "driveId": "1Wqll2d4kEaicj4jLKkHHd3F-f6c-Lzl-",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859540/video-22.mov",
    "driveId": "12NNCXXzzzdzqo7GkNe4hsOxU48hGvZeP",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Content Creation",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861479/video-23.mov",
    "driveId": "10sAu9XDrr_U4AFvnARJapC3OpF8-Ycoi",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Audience vs. Clients",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789857320/video-24.mov",
    "driveId": "1tl550ldHlkdmRM-Ami4A_2qSwpJTIJYT",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Quality Over Quantity",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860064/video-25.mov",
    "driveId": "1GHbTyTFsGwO9hp102zgsKe-9NKeftg8i",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Lock In",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862211/video-26.mov",
    "driveId": "1c17U_ja6uFpNp3hgNHKBKWxQ0U8M5I7U",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Meet the McCarty Founder",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862192/video-27.mov",
    "driveId": "1d1fZyyXlwzVpj8Ym5GO8zE8pwVawyOwG",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861810/video-28.mov",
    "driveId": "1u6j0SN4iS3OvsJ4g12-W50E2Ro-Gx0iH",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858113/video-29.mov",
    "driveId": "1rUdWV01RtldQ4DVVYv1yjhFLhBeWkSAF",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "MrBeast",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858102/video-30.mov",
    "driveId": "1b_TWhj7Bc8cev1ZuacDi3tTCm0YbYtJs",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Business Growth Strategies",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860570/video-31.mov",
    "driveId": "1hmMBj5jn8RMkucGRYbac2u65wxL7a6kF",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Body Oil for People of Color",
    "category": "Fashion",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862073/video-32.mov",
    "driveId": "1p8EgE5V4agH-OGBR4fDNQP-m1N2ZY5HD",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Home Inspection vs. Appraisal",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862269/video-33.mov",
    "driveId": "1Vq5lpIkUzDPaKRH6RgafG6Ih_j3OqRdm",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860642/video-34.mov",
    "driveId": "1BtX81yFX-eYNIiny65Xi0rfTqWNzVacJ",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Podcast Production",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860628/video-35.mov",
    "driveId": "1jWxSjB3cqhFyVFROGbICSXl_z12kD8UH",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Original Ideas",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858813/video-36.mov",
    "driveId": "1wSF9aGF5dpQj4li15iQ4JcPBOCSuCEG3",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Spinal Cord Health",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858612/video-37.mov",
    "driveId": "1b8wXMRMpqtV4SEETvhNirYU9aZdVzpRF",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Mr. Puffs Advertisement",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862153/video-38.mov",
    "driveId": "1QS-qllDK3kGIXf-pRQEoBPHwgwKpObEx",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860884/video-39.mp4",
    "driveId": "1TN1s7bmAkJaaOSf_H3-mBWrd-OpcPwk6",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Earn vs. Learn",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862269/video-40.mp4",
    "driveId": "1TAkx4_NDzNPBbrmYLSOQIfilzHoGGXyJ",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Making Sales",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861048/video-41.mp4",
    "driveId": "18RnEEgWZOkQY3w_m0NQKjNGuvF4Ilxe5",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Earning in Dollars",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861115/video-42.mp4",
    "driveId": "1v8uY07qwoN4SdXw5s1YOPDv_njfCnmbF",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Business Flyers",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858960/video-43.mp4",
    "driveId": "1hAZcs-uUaZaZUJmoUlZGWaLfx2I2Qkk9",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Pesa Expansion",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861060/video-44.mp4",
    "driveId": "1JeZfYDwc71U5EJOKGMyX8c28SzDyYIBt",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Turning Points",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861682/video-45.mp4",
    "driveId": "18oWZ6uVsQIpNpo4GZaZ_-NYJoVM4Ar3i",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Fashion & Body Shorts",
    "category": "Fashion",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862230/video-46.mp4",
    "driveId": "1yl5EkA6I-mvjsMGOSs-jxzO9hMLLq0wh",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Career Paths",
    "category": "Life & Career",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861174/video-47.mp4",
    "driveId": "18v-DL6UIo_WFhwfdq_PeirMe18aL_4IX",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Compelling Narratives",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861096/video-48.mp4",
    "driveId": "1fPPeYP_5cvPfXtrYvrDWeNOJ1mRFczKi",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Creative Brand Growth",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859562/video-49.mp4",
    "driveId": "1zKwcxk0PFdYfQoq0FWrFPp1sPY2-1nHU",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate Documents",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861158/video-50.mp4",
    "driveId": "1iSSscaJbPTNmlCk-SKFmjKxgvZ87EUgp",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Consistency & Fitness",
    "category": "Fitness",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859577/video-51.mp4",
    "driveId": "",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Value & Problem Solving",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861198/video-52.mp4",
    "driveId": "",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "",
    "recent": false
  }
];

  const VLOG_DEFAULT = [
  {
    "title": "Day in the Life",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862259/vlog-01.mov",
    "driveId": "1QDL454gD3Ngq4X01gSvDWqGKGtqFSfp5",
    "poster": "",
    "aspectRatio": "4/3",
    "resolution": "1440x1080",
    "recent": false
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862244/vlog-02.mp4",
    "driveId": "10qUqrufG6BTqv2ydyCVrEX5wXLYu7gtZ",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "1920x1080",
    "recent": false
  },
  {
    "title": "Spider-Man/ Nigeria",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861235/vlog-03.mov",
    "driveId": "1HybuHl4k0PCYju58_nnXMhlXlfOJDt8I",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "1920x1080",
    "recent": false
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861307/vlog-04.mp4",
    "driveId": "1lni9S0fVwbvzb3FYGn_C-VrT1AYvyt5E",
    "poster": "",
    "aspectRatio": "16/9",
    "resolution": "1920x1080",
    "recent": false
  },
  {
    "title": "Life Lately",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789948189/vlog-05.mp4",
    "driveId": "1LFFmJzyqeHcuVUQfO_LNH-lTqGn60Brx",
    "poster": "",
    "aspectRatio": "4/3",
    "resolution": "1440x1080",
    "recent": false
  },
  {
    "title": "Daily Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862164/vlog-06.mp4",
    "driveId": "1xjX-d7ojfDEGrnSaBvyQD3YEJ10kNrpR",
    "poster": "",
    "aspectRatio": "4/3",
    "resolution": "1440x1080",
    "recent": false
  },
  {
    "title": "Content Ideas",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862249/vlog-07.mov",
    "driveId": "1zB3WqHm_trRNWzlgSUVoC__37xI96PoJ",
    "poster": "",
    "aspectRatio": "9/16",
    "resolution": "1080x1920",
    "recent": false
  }
];

  async function loadPortfolioData() {
    const safeFetch = (path, fallback) =>
      fetch(path).then((r) => (r.ok ? r.json() : null)).then((d) => (d && d.projects ? d.projects : fallback)).catch(() => fallback);
    const [design, video, vlog] = await Promise.all([
      safeFetch("assets/data/design.json", DESIGN_DEFAULT),
      safeFetch("assets/data/video.json", VIDEO_DEFAULT),
      safeFetch("assets/data/vlog.json", VLOG_DEFAULT),
    ]);
    return { design, video, vlog };
  }

  const isMobile = window.innerWidth < 720;
  const VISIBLE_INITIAL = isMobile ? 8 : 26;

  function pad(n) { return String(n).padStart(2, "0"); }

  function buildDesignGrid(projects) {
    const grid = document.getElementById("designGrid");
    let html = "";
    projects.forEach((item, idx) => {
      const i = idx + 1;
      const hiddenClass = i > VISIBLE_INITIAL ? " is-hidden" : "";
      const cloudinaryUrl = item.imageUrl || "";
      const githubPath = item.image || "";
      const src = mediaSrc(cloudinaryUrl, githubPath);
      html += `
        <article class="project-card${hiddenClass}" data-cursor="pen" data-category="${item.category}" data-recent="${!!item.recent}" style="animation-delay:${(idx % VISIBLE_INITIAL) * 0.03}s">
          <div class="project-media">
            <img src="${src}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" ${mediaFallbackAttr(githubPath)}>
            <div class="media-placeholder">
              <span class="mp-icon">🖼️</span>
              <span class="mp-file">${src}</span>
            </div>
            ${item.recent ? '<span class="recent-badge">NEW</span>' : ""}
          </div>
          <div class="project-info">
            <h3>${item.title}</h3>
            <p class="project-tag">Design ${pad(i)}</p>
          </div>
        </article>`;
    });
    grid.innerHTML = html;
  }

  function buildVideoGrid(projects) {
    const grid = document.getElementById("videoGrid");
    let html = "";
    projects.forEach((item, idx) => {
      const i = idx + 1;
      const hiddenClass = i > VISIBLE_INITIAL ? " is-hidden" : "";
      const poster = getVideoPoster(item);
      html += `
        <article class="project-card${hiddenClass}" data-cursor="play" data-category="${item.category}" data-recent="${!!item.recent}" data-video-type="video" data-video-index="${idx}" style="animation-delay:${(idx % VISIBLE_INITIAL) * 0.03}s">
          <div class="project-media">
            ${poster ? `<img src="${poster}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ""}
            <div class="media-placeholder">
              <span class="mp-icon">🎬</span>
              <span class="mp-file">${item.title}</span>
            </div>
            <div class="play-overlay is-visible"><span>▶</span></div>
            ${item.recent ? '<span class="recent-badge">NEW</span>' : ""}
          </div>
          <div class="project-info">
            <h3>${item.title}</h3>
            <p class="project-tag">Video ${pad(i)}</p>
          </div>
        </article>`;
    });
    grid.innerHTML = html;
  }

  function buildVlogGrid(projects) {
    const grid = document.getElementById("vlogGrid");
    if (!grid) return 0;
    const VLOG_VISIBLE = isMobile ? 4 : projects.length;
    let html = "";
    projects.forEach((item, idx) => {
      const i = idx + 1;
      const hiddenClass = i > VLOG_VISIBLE ? " is-hidden" : "";
      const orientationClass = item.aspectRatio === "9/16" ? " is-vertical" : "";
      const poster = getVideoPoster(item);
      html += `
        <article class="project-card vlog-card${orientationClass}${hiddenClass}" data-cursor="play" data-recent="${!!item.recent}" data-video-type="vlog" data-video-index="${idx}" style="animation-delay:${idx * 0.04}s">
          <div class="project-media" style="aspect-ratio:${item.aspectRatio}">
            ${poster ? `<img src="${poster}" alt="${item.title}" class="real-media is-contain" loading="lazy" decoding="async" onerror="this.style.display='none'">` : ""}
            <div class="media-placeholder">
              <span class="mp-icon">🎥</span>
              <span class="mp-file">${item.title}</span>
            </div>
            <div class="play-overlay is-visible"><span>▶</span></div>
            ${item.recent ? '<span class="recent-badge">NEW</span>' : ""}
          </div>
          <div class="project-info">
            <h3>${item.title}</h3>
            <p class="project-tag">Vlog ${pad(i)}</p>
          </div>
        </article>`;
    });
    grid.innerHTML = html;
  }

  function buildRecentStrip(data) {
    const section = document.getElementById("recentSection");
    const track = document.getElementById("recentTrack");
    if (!section || !track) return;
    const all = [
      ...data.design.map((p) => ({ ...p, type: "design", cloudinaryUrl: p.imageUrl || "", githubPath: p.image || "", icon: "🖼️" })),
      ...data.video.map((p) => ({ ...p, type: "video", poster: getVideoPoster(p), icon: "🎬" })),
      ...data.vlog.map((p) => ({ ...p, type: "vlog", poster: getVideoPoster(p), icon: "🎥" })),
    ].filter((p) => p.recent).slice(0, 8);
    if (!all.length) { section.style.display = "none"; return; }
    section.style.display = "block";
    track.innerHTML = all.map((item) => `
      <div class="recent-card">
        <div class="project-media">
          ${item.type === "design"
            ? `<img src="${mediaSrc(item.cloudinaryUrl, item.githubPath)}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" ${mediaFallbackAttr(item.githubPath)}>`
            : (item.poster ? `<img src="${item.poster}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" onerror="this.style.display='none'">` : "")}
          <div class="media-placeholder"><span class="mp-icon">${item.icon}</span></div>
          ${item.type !== "design" ? `<div class="play-overlay is-visible"><span>▶</span></div>` : ""}
          <span class="recent-badge">NEW</span>
        </div>
        <div class="project-info"><h3>${item.title}</h3><p class="project-tag">${item.category}</p></div>
      </div>
    `).join("");
  }

  const portfolioData = await loadPortfolioData();
  buildDesignGrid(portfolioData.design);
  buildVideoGrid(portfolioData.video);
  buildVlogGrid(portfolioData.vlog);
  buildRecentStrip(portfolioData);

  /* ---------- View more buttons (auto-hide if nothing is hidden to reveal) ---------- */
  document.querySelectorAll(".view-more-btn").forEach((btn) => {
    const grid = document.getElementById(btn.dataset.viewMore + "Grid");
    if (!grid || grid.querySelectorAll(".is-hidden").length === 0) { btn.style.display = "none"; return; }
    btn.addEventListener("click", () => {
      grid.querySelectorAll(".is-hidden").forEach((card) => card.classList.remove("is-hidden"));
      btn.style.display = "none";
    });
  });

  /* ---------- Filters (design + video) ---------- */
  function initFilters(prefix) {
    const grid = document.getElementById(prefix + "Grid");
    const filterBar = document.getElementById(prefix + "Filters");
    const emptyState = document.getElementById(prefix + "Empty");
    const viewMoreBtn = document.querySelector(`.view-more-btn[data-view-more="${prefix}"]`);
    if (!grid || !filterBar) return;

    const cards = Array.from(grid.querySelectorAll(".project-card"));
    const categories = ["All", ...new Set(cards.map((c) => c.dataset.category))];

    filterBar.innerHTML = categories.map((cat, i) =>
      `<button class="filter-pill${i === 0 ? " is-active" : ""}" data-filter="${cat}">${cat}</button>`
    ).join("");

    function applyFilter(cat) {
      let visibleCount = 0;
      cards.forEach((card) => {
        const matches = cat === "All" || card.dataset.category === cat;
        card.classList.toggle("is-filtered-out", !matches);
        if (matches) visibleCount++;
        // While filtering to a specific category, ignore pagination limits so results aren't hidden
        if (cat !== "All" && matches) card.classList.remove("is-hidden");
      });
      if (cat === "All") {
        // restore original pagination state
        cards.forEach((card, i) => card.classList.toggle("is-hidden", i >= VISIBLE_INITIAL));
        if (viewMoreBtn) viewMoreBtn.style.display = cards.some((c) => c.classList.contains("is-hidden")) ? "" : "none";
      } else if (viewMoreBtn) {
        viewMoreBtn.style.display = "none";
      }
      emptyState.classList.toggle("is-visible", visibleCount === 0);
    }

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-pill");
      if (!btn) return;
      filterBar.querySelectorAll(".filter-pill").forEach((p) => p.classList.remove("is-active"));
      btn.classList.add("is-active");
      applyFilter(btn.dataset.filter);
    });

    const clearBtn = document.querySelector(`[data-clear-filter="${prefix}"]`);
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        filterBar.querySelectorAll(".filter-pill").forEach((p) => p.classList.toggle("is-active", p.dataset.filter === "All"));
        applyFilter("All");
      });
    }
  }
  initFilters("design");
  initFilters("video");

  /* ---------- Portfolio tabs ---------- */
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".work-panel");
  const decoArtboard = document.getElementById("decoArtboard");
  const decoTimeline = document.getElementById("decoTimeline");

  function playDecoFor(target) {
    if (target === "design") {
      decoArtboard.classList.remove("animate-in");
      void decoArtboard.offsetWidth;
      decoArtboard.classList.add("animate-in");
    } else {
      decoTimeline.classList.remove("animate-in");
      void decoTimeline.offsetWidth;
      decoTimeline.classList.add("animate-in");
    }
  }

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      tabBtns.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === target));
      playDecoFor(target);
    });
  });

  const workObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        playDecoFor("design");
        workObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });
  const workSection = document.getElementById("work");
  if (workSection) workObserver.observe(workSection);

  /* ---------- Video/vlog cards now open a Google Drive embed on click instead
     of a hover-preview (Drive can't be autoplayed muted inline like Cloudinary
     could) — the play-overlay is rendered permanently visible for those cards
     instead. See the lightbox section below for the click handling. ---------- */

  /* ---------- Click-to-preview lightbox (design + video cards) ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightboxContent");
  const lightboxClose = document.getElementById("lightboxClose");
  const toastEl = document.getElementById("toast");

  function showToastMsg(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    setTimeout(() => toastEl.classList.remove("is-visible"), 2200);
  }

  function openLightbox(mediaEl) {
    document.body.classList.add("lightbox-open");
    lightboxContent.innerHTML = "";
    if (mediaEl.tagName === "IMG") {
      const img = document.createElement("img");
      img.src = mediaEl.currentSrc || mediaEl.src;
      img.alt = mediaEl.alt || "";
      lightboxContent.appendChild(img);
    } else {
      const vid = document.createElement("video");
      vid.src = mediaEl.currentSrc || mediaEl.src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      lightboxContent.appendChild(vid);
    }
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  // Sizes a Drive iframe to fit the lightbox without cropping, for ANY
  // aspect ratio — not just a hardcoded 16:9/9:16 pair. An iframe has no
  // intrinsic size the way <video> does, so the browser can't work this
  // out on its own from CSS alone; this computes the same "contain" math
  // (fit inside the available box, preserve ratio, never crop) a <video>
  // gets for free, using the real viewport size so it's correct at any
  // screen width. Recomputed on resize/orientation-change while open.
  function sizeDriveFrame(iframe, aspectRatio) {
    const parts = String(aspectRatio || "16/9").split("/").map(Number);
    const ratio = (parts[0] && parts[1]) ? parts[0] / parts[1] : 16 / 9;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight * 0.85;
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    iframe.style.width = `${Math.round(w)}px`;
    iframe.style.height = `${Math.round(h)}px`;
  }
  let driveFrameResizeHandler = null;

  // Provider-agnostic video lightbox: tries getVideoSources(item) in order,
  // starting with Cloudinary. It only ever mounts one source at a time —
  // the next one is requested solely on a genuine playback error from the
  // current one — so Drive is never touched while Cloudinary is working,
  // and once a source plays there's no further switching this session.
  function openVideoLightbox(item) {
    const sources = getVideoSources(item);
    if (!sources.length) {
      showToastMsg("This video isn't available yet — check back soon");
      return;
    }
    document.body.classList.add("lightbox-open");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    let attempt = 0;
    const PROVIDER_LABEL = { cloudinary: "Cloudinary", "google-drive": "Google Drive" };
    const tryNext = () => {
      if (attempt >= sources.length) {
        showToastMsg("This video couldn't be played right now");
        closeLightbox();
        return;
      }
      const source = sources[attempt];
      attempt += 1;
      lightboxContent.innerHTML = "";
      const label = PROVIDER_LABEL[source.provider] || source.provider;

      if (source.type === "mp4") {
        const finalSrc = cloudinaryCompatUrl(source.src);
        const mime = cloudinaryVideoMime(finalSrc);
        const vid = document.createElement("video");
        vid.controls = true;
        vid.autoplay = true;
        vid.playsInline = true;
        const sourceEl = document.createElement("source");
        sourceEl.src = finalSrc;
        if (mime) sourceEl.type = mime;
        vid.appendChild(sourceEl);
        // eslint-disable-next-line no-console -- temporary debug logging, see report
        console.log(`[VIDEO] Attempting ${label}: ${finalSrc}`);
        // "loadeddata" only fires once actual frame data is available — a
        // genuine signal of usable playback, not just that the element/DOM
        // node exists (which would fire even for a URL that never resolves).
        vid.addEventListener("loadeddata", () => {
          console.log(`[VIDEO] ${label} loaded successfully`);
        }, { once: true });
        vid.addEventListener("error", () => {
          const nextLabel = attempt < sources.length ? (PROVIDER_LABEL[sources[attempt].provider] || sources[attempt].provider) : null;
          console.log(nextLabel ? `[VIDEO] ${label} failed, trying ${nextLabel}` : `[VIDEO] ${label} failed, no further fallback configured`);
          tryNext();
        }, { once: true });
        lightboxContent.appendChild(vid);
      } else if (source.type === "drive-iframe") {
        const iframe = document.createElement("iframe");
        iframe.src = source.src;
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        iframe.setAttribute("frameborder", "0");
        iframe.className = "drive-frame";
        lightboxContent.appendChild(iframe);
        sizeDriveFrame(iframe, item.aspectRatio);
        if (driveFrameResizeHandler) window.removeEventListener("resize", driveFrameResizeHandler);
        driveFrameResizeHandler = () => sizeDriveFrame(iframe, item.aspectRatio);
        window.addEventListener("resize", driveFrameResizeHandler);
        console.log(`[VIDEO] ${label} fallback mounted`);
        // Cross-origin iframes don't reliably fire a load-failure "error"
        // event the way <video>/<img> do, so a broken Drive ID just shows
        // Drive's own "can't preview" state inside the frame rather than
        // silently trying a further source.
      }
    };
    tryNext();
  }

  function closeLightbox() {
    document.body.classList.remove("lightbox-open");
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxContent.innerHTML = ""; // also stops Cloudinary/Drive playback
    if (driveFrameResizeHandler) {
      window.removeEventListener("resize", driveFrameResizeHandler);
      driveFrameResizeHandler = null;
    }
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  const VIDEO_TYPE_DATA = { video: () => portfolioData.video, vlog: () => portfolioData.vlog };

  ["designGrid", "videoGrid", "vlogGrid"].forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".project-card");
      if (!card) return;

      // Video/vlog cards carry data-video-type + data-video-index (a lookup
      // into the loaded portfolio data); design cards carry neither.
      const videoType = card.dataset.videoType;
      if (videoType && VIDEO_TYPE_DATA[videoType]) {
        const item = VIDEO_TYPE_DATA[videoType]()[Number(card.dataset.videoIndex)];
        if (item) openVideoLightbox(item);
        return;
      }

      const media = card.querySelector(".real-media");
      const hasReal = media && media.style.display !== "none";
      if (!hasReal) {
        const fileLabel = card.querySelector(".mp-file");
        const fileName = fileLabel ? fileLabel.textContent.split("/").pop() : "your file";
        showToastMsg(`Add ${fileName} to preview this project`);
        return;
      }
      openLightbox(media);
    });
  });

  /* ---------- Count-up animation (stats, prices, client count) — scroll-trigger fires once, hover always replays ---------- */
  function runCountUp(el) {
    const target = parseInt(el.dataset.countTo, 10);
    if (reduceMotion) { el.textContent = target; return; }
    const token = (parseInt(el.dataset.animToken || "0", 10) + 1);
    el.dataset.animToken = String(token);
    const duration = 1100;
    const start = performance.now();
    el.textContent = "0";
    function tick(now) {
      if (String(token) !== el.dataset.animToken) return; // a newer trigger superseded this one
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { runCountUp(entry.target); countObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.3 });

  function bindCountUps(root) {
    (root || document).querySelectorAll("[data-count-to]").forEach((el) => {
      countObserver.observe(el);
      const hoverTarget = el.closest(".stat-card, .price-card") || el;
      hoverTarget.addEventListener("mouseenter", () => runCountUp(el));
    });
  }
  bindCountUps();
  window.__yemzyyBindCountUps = bindCountUps; // exposed so CMS-loaded content (pricing/stats) can re-bind after render

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const answer = item.querySelector(".faq-answer");
      const isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item").forEach((i) => { i.classList.remove("is-open"); i.querySelector(".faq-answer").style.maxHeight = null; });
      if (!isOpen) { item.classList.add("is-open"); answer.style.maxHeight = answer.scrollHeight + "px"; }
    });
  });

  /* ---------- Copy email button + toast ---------- */
  const copyBtn = document.getElementById("copyEmailBtn");
  const toast = document.getElementById("toast");
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  copyBtn.addEventListener("click", async () => {
    const email = "dadeyemo483@gmail.com";
    try {
      await navigator.clipboard.writeText(email);
      showToast("Email copied ✓");
    } catch (e) {
      showToast("Copy failed — email: " + email);
    }
  });

  /* ---------- Inquiry form (Web3Forms — free, no backend needed) ---------- */
  const inquiryForm = document.getElementById("inquiryForm");
  const fFound = document.getElementById("fFound");
  const fFoundOther = document.getElementById("fFoundOther");
  if (fFound && fFoundOther) {
    fFound.addEventListener("change", () => {
      const isOther = fFound.value === "Other";
      fFoundOther.style.display = isOther ? "block" : "none";
      if (!isOther) fFoundOther.value = "";
    });
  }
  const formStatus = document.getElementById("formStatus");
  const inquirySubmit = document.getElementById("inquirySubmit");
  if (inquiryForm) {
    inquiryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      formStatus.className = "form-status";
      const accessKey = inquiryForm.querySelector('[name="access_key"]').value;
      if (!accessKey || accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
        formStatus.textContent = "Form isn't connected yet — add a free Web3Forms access key (see README) to start receiving inquiries by email.";
        formStatus.classList.add("is-error");
        return;
      }
      inquirySubmit.disabled = true;
      inquirySubmit.querySelector("span").textContent = "Sending...";
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(inquiryForm))),
        });
        const data = await res.json();
        if (data.success) {
          formStatus.textContent = "Thanks — your inquiry is in! I'll get back to you soon.";
          formStatus.classList.add("is-success");
          inquiryForm.reset();
        } else {
          throw new Error(data.message || "Something went wrong");
        }
      } catch (err) {
        formStatus.textContent = "Couldn't send — please try again or email dadeyemo483@gmail.com directly.";
        formStatus.classList.add("is-error");
      } finally {
        inquirySubmit.disabled = false;
        inquirySubmit.querySelector("span").textContent = "Send Inquiry";
      }
    });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = document.getElementById("cursorFollower");
  const cursorIcon = document.getElementById("cursorIcon");
  const supportsFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (supportsFinePointer) {
    window.addEventListener("mousemove", (e) => {
      cursor.style.left = e.clientX + "px";
      cursor.style.top = e.clientY + "px";
    });
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest("[data-cursor]");
      cursor.classList.remove("cursor-grow", "cursor-play", "cursor-pen");
      if (target) {
        const type = target.dataset.cursor;
        if (type === "play") { cursor.classList.add("cursor-play"); cursorIcon.textContent = "▶"; }
        else if (type === "pen") { cursor.classList.add("cursor-pen"); cursorIcon.textContent = "🎨"; }
      } else if (e.target.closest("a, button")) {
        cursor.classList.add("cursor-grow");
        cursorIcon.textContent = "";
      } else {
        cursorIcon.textContent = "";
      }
    });
  }

  /* ---------- Plasma wave background ---------- */
  const canvas = document.getElementById("plasmaCanvas");
  const ctx = canvas.getContext("2d");
  let w, h, dpr;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  resize();
  window.addEventListener("resize", resize);

  const blobs = [
    { color: "124,92,255", rx: 0.3, ry: 0.34, speed: 0.00075, phase: 0 },
    { color: "255,107,69", rx: 0.26, ry: 0.24, speed: 0.0006, phase: 2 },
    { color: "167,139,250", rx: 0.34, ry: 0.28, speed: 0.00085, phase: 4 },
    { color: "56,217,196", rx: 0.28, ry: 0.32, speed: 0.00055, phase: 6 },
    { color: "255,45,150", rx: 0.22, ry: 0.26, speed: 0.0007, phase: 8 },
  ];

  const PARTICLE_COUNT = 55;
  const particleColors = ["124,92,255", "255,107,69", "167,139,250", "56,217,196"];
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 2 + 0.6,
    speedY: (Math.random() * 0.00006 + 0.00002) * (Math.random() < 0.5 ? 1 : -1),
    speedX: (Math.random() * 0.00004 - 0.00002),
    color: particleColors[Math.floor(Math.random() * particleColors.length)],
    twinkle: Math.random() * Math.PI * 2,
  }));

  function drawFrame(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    blobs.forEach((b) => {
      const cx = w / 2 + Math.sin(t * b.speed + b.phase) * w * b.rx;
      const cy = h / 2 + Math.cos(t * b.speed * 1.3 + b.phase) * h * b.ry;
      const radius = Math.min(w, h) * 0.4;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, `rgba(${b.color},0.32)`);
      grad.addColorStop(1, `rgba(${b.color},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    });

    particles.forEach((p) => {
      p.x = (p.x + p.speedX * dpr * 1000 + 1) % 1;
      p.y = (p.y + p.speedY * dpr * 1000 + 1) % 1;
      const twinkle = 0.4 + Math.sin(t * 0.002 + p.twinkle) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.color}, ${Math.max(twinkle, 0.08)})`;
      ctx.arc(p.x * w, p.y * h, p.r * dpr, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";
  }

  let rafId;
  function loop(t) {
    drawFrame(t);
    rafId = requestAnimationFrame(loop);
  }
  const saveData = navigator.connection && navigator.connection.saveData;
  if (reduceMotion || saveData) {
    drawFrame(0);
  } else {
    rafId = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) cancelAnimationFrame(rafId);
      else rafId = requestAnimationFrame(loop);
    });
  }

  /* ---------- Interactive mascot ---------- */
  const mascot = document.getElementById("mascot");
  const isNarrowScreen = window.matchMedia("(max-width: 640px)").matches;

  if (mascot && !isNarrowScreen) {
    if (reduceMotion) {
      // Static, no scroll-linked movement — just sits near the hero display.
      const hero = document.getElementById("glowDisplay");
      if (hero) {
        const r = hero.getBoundingClientRect();
        mascot.style.transform = `translate(${r.right - 20}px, ${r.top - 10}px)`;
      }
      mascot.classList.add("is-visible");
    } else {
      const waypoints = [
        { section: "#hero", target: "#glowDisplay", dx: -10, dy: -20 },
        { section: "#work", target: "#decoArtboard", dx: 40, dy: -10 },
        { section: "#work", target: '.tab-btn[data-tab="video"]', dx: 10, dy: -40 },
        { section: "#more", target: ".stat-card", dx: 20, dy: -18 },
        { section: "#more", target: ".tool-badge", dx: 10, dy: -34 },
        { section: "#contact", target: ".contact-inner", dx: -30, dy: -30 },
      ].map((wp) => ({ ...wp, targetEl: document.querySelector(wp.target) })).filter((wp) => wp.targetEl);

      let activeIndex = 0;
      const sectionEls = [...new Set(waypoints.map((w) => w.section))].map((sel) => document.querySelector(sel)).filter(Boolean);

      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = waypoints.findIndex((w) => document.querySelector(w.section) === entry.target);
            if (idx !== -1) {
              if (idx !== activeIndex) {
                activeIndex = idx;
                mascot.classList.remove("is-hopping");
                void mascot.offsetWidth;
                mascot.classList.add("is-hopping");
              }
            }
          }
        });
      }, { threshold: 0.4 });
      sectionEls.forEach((s) => sectionObserver.observe(s));

      mascot.classList.add("is-visible");
      let ticking = false;
      function updateMascotPosition() {
        ticking = false;
        const wp = waypoints[activeIndex];
        if (!wp) return;
        const rect = wp.targetEl.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return; // hidden element (inactive tab panel etc.)
        const x = rect.right + wp.dx;
        const y = rect.top + wp.dy;
        mascot.style.transform = `translate(${x}px, ${y}px)`;
      }
      window.addEventListener("scroll", () => {
        if (!ticking) { ticking = true; requestAnimationFrame(updateMascotPosition); }
      }, { passive: true });
      updateMascotPosition();
    }
  }

  /* ---------- Synthesized sound effects (Web Audio API — no audio files needed) ---------- */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }
  function playSquishSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }
  function playChirpSound() {
    const ctx = getAudioCtx();
    if (!ctx) return;
    [0, 0.09].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1400, ctx.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(2100, ctx.currentTime + delay + 0.06);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.09);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.09);
    });
  }
  function triggerBurst(el) {
    if (!el) return;
    el.classList.remove("is-bursting");
    void el.offsetWidth;
    el.classList.add("is-bursting");
  }

  /* ---------- Interactive spider (click to squash — easter egg) ---------- */
  const spider = document.getElementById("spider");
  if (spider) {
    let squashed = false;
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));

    function randomEdgePoint() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) return { x: -50, y: Math.random() * vh };
      if (edge === 1) return { x: vw + 50, y: Math.random() * vh };
      if (edge === 2) return { x: Math.random() * vw, y: -50 };
      return { x: Math.random() * vw, y: vh + 50 };
    }
    function randomOnScreenPoint() {
      const vw = window.innerWidth, vh = window.innerHeight;
      return { x: Math.random() * (vw - 80) + 20, y: Math.random() * (vh - 140) + 80 };
    }
    function moveSpiderTo(x, y, duration) {
      spider.style.transition = `top ${duration}ms linear, left ${duration}ms linear`;
      spider.style.left = x + "px";
      spider.style.top = y + "px";
    }
    function scheduleNextCrawl() {
      setTimeout(runCrawl, 22000 + Math.random() * 23000);
    }

    async function runCrawl() {
      if (reduceMotion) { scheduleNextCrawl(); return; }
      squashed = false;
      spider.classList.remove("is-squashed");
      spider.classList.add("is-active");
      const start = randomEdgePoint();
      spider.style.transition = "none";
      spider.style.left = start.x + "px";
      spider.style.top = start.y + "px";
      void spider.offsetWidth;

      let prev = start;
      const stops = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < stops; i++) {
        if (squashed) return;
        const target = randomOnScreenPoint();
        const dist = Math.hypot(target.x - prev.x, target.y - prev.y);
        const duration = Math.max(1000, dist * 5);
        moveSpiderTo(target.x, target.y, duration);
        await wait(duration);
        if (squashed) return;
        await wait(400 + Math.random() * 700);
        prev = target;
      }
      if (squashed) return;
      const exit = randomEdgePoint();
      const dist = Math.hypot(exit.x - prev.x, exit.y - prev.y);
      moveSpiderTo(exit.x, exit.y, Math.max(900, dist * 5));
      await wait(Math.max(900, dist * 5));
      if (!squashed) spider.classList.remove("is-active");
      scheduleNextCrawl();
    }

    const handleSpiderHit = () => {
      if (squashed) return;
      squashed = true;
      spider.classList.add("is-squashed");
      triggerBurst(document.getElementById("spiderBurst"));
      playSquishSound();
      if (typeof showToastMsg === "function") showToastMsg("Splat! 🕷️");
      setTimeout(() => {
        spider.classList.remove("is-active", "is-squashed");
        scheduleNextCrawl();
      }, 550);
    };
    spider.addEventListener("click", handleSpiderHit);
    spider.addEventListener("touchstart", (e) => { e.preventDefault(); handleSpiderHit(); }, { passive: false });

    setTimeout(runCrawl, 6000 + Math.random() * 8000);
  }

  /* ---------- Interactive bird (click/tap to startle it — easter egg) ---------- */
  const bird = document.getElementById("bird");
  if (bird) {
    let startled = false;
    const waitB = (ms) => new Promise((res) => setTimeout(res, ms));

    function offscreenSidePoint(side, vh) {
      const y = 40 + Math.random() * (vh * 0.55);
      return side === "left" ? { x: -70, y } : { x: window.innerWidth + 70, y };
    }
    function moveBirdTo(x, y, duration) {
      bird.style.transition = `top ${duration}ms ease-in-out, left ${duration}ms ease-in-out`;
      bird.style.left = x + "px";
      bird.style.top = y + "px";
    }
    function scheduleNextFlight() {
      setTimeout(runFlight, 28000 + Math.random() * 27000);
    }

    async function runFlight() {
      if (reduceMotion) { scheduleNextFlight(); return; }
      startled = false;
      bird.classList.remove("is-startled");
      bird.classList.add("is-active");
      const vh = window.innerHeight;
      const fromLeft = Math.random() < 0.5;
      const start = offscreenSidePoint(fromLeft ? "left" : "right", vh);
      const mid = { x: window.innerWidth / 2 + (Math.random() * 200 - 100), y: 40 + Math.random() * (vh * 0.4) };
      const end = offscreenSidePoint(fromLeft ? "right" : "left", vh);

      bird.style.transition = "none";
      bird.style.left = start.x + "px";
      bird.style.top = start.y + "px";
      bird.style.transform = fromLeft ? "scaleX(-1)" : "scaleX(1)";
      void bird.offsetWidth;

      const leg1 = Math.max(1800, Math.hypot(mid.x - start.x, mid.y - start.y) * 4);
      moveBirdTo(mid.x, mid.y, leg1);
      await waitB(leg1);
      if (startled) return;
      const leg2 = Math.max(1800, Math.hypot(end.x - mid.x, end.y - mid.y) * 4);
      moveBirdTo(end.x, end.y, leg2);
      await waitB(leg2);
      if (!startled) bird.classList.remove("is-active");
      scheduleNextFlight();
    }

    const handleBirdHit = () => {
      if (startled) return;
      startled = true;
      bird.classList.add("is-startled");
      triggerBurst(document.getElementById("birdBurst"));
      playChirpSound();
      if (typeof showToastMsg === "function") showToastMsg("Chirp! 🐦");
      // dart off in the direction it was already heading
      const vw = window.innerWidth;
      const dartX = parseFloat(bird.style.left) < vw / 2 ? -80 : vw + 80;
      moveBirdTo(dartX, parseFloat(bird.style.top) - 40, 500);
      setTimeout(() => {
        bird.classList.remove("is-active", "is-startled");
        scheduleNextFlight();
      }, 550);
    };
    bird.addEventListener("click", handleBirdHit);
    bird.addEventListener("touchstart", (e) => { e.preventDefault(); handleBirdHit(); }, { passive: false });

    setTimeout(runFlight, 14000 + Math.random() * 10000);
  }

  /* ---------- Visitor rating slider (submits via Web3Forms — arrives by email, not stored on-site) ---------- */
  const ratingSlider = document.getElementById("ratingSlider");
  const ratingValue = document.getElementById("ratingValue");
  const ratingSubmit = document.getElementById("ratingSubmit");
  const ratingStatus = document.getElementById("ratingStatus");
  const WEB3FORMS_KEY = "c625cf34-da77-41c9-8062-ba8499391b77";
  if (ratingSlider) {
    ratingSlider.addEventListener("input", () => { ratingValue.textContent = parseFloat(ratingSlider.value).toFixed(1); });
    ratingSubmit.addEventListener("click", async () => {
      ratingSubmit.disabled = true;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "New portfolio rating", Rating: ratingSlider.value }),
        });
        const data = await res.json();
        ratingStatus.textContent = data.success ? "Thanks for rating! 🙌" : "Couldn't submit — try again later.";
        ratingStatus.className = "form-status " + (data.success ? "is-success" : "is-error");
      } catch (e) {
        ratingStatus.textContent = "Couldn't submit — try again later.";
        ratingStatus.className = "form-status is-error";
      } finally {
        ratingSubmit.disabled = false;
      }
    });
  }

  /* ---------- Visitor review submission (via Web3Forms; owner approves + adds to reviews.json in the CMS) ---------- */
  const reviewForm = document.getElementById("reviewForm");
  const reviewStatus = document.getElementById("reviewStatus");
  if (reviewForm) {
    reviewForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = reviewForm.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: "New portfolio review",
            Name: document.getElementById("reviewName").value || "Anonymous",
            Review: document.getElementById("reviewText").value,
          }),
        });
        const data = await res.json();
        if (data.success) {
          reviewStatus.textContent = "Thanks — your review is in for approval!";
          reviewStatus.className = "form-status is-success";
          reviewForm.reset();
        } else throw new Error();
      } catch (e) {
        reviewStatus.textContent = "Couldn't submit — please try again.";
        reviewStatus.className = "form-status is-error";
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  /* ---------- CMS-managed content (pricing, stats, reviews) ----------
     Loads assets/data/*.json. If it fails (e.g. previewing locally by
     double-clicking index.html, where browsers block fetching local
     files), the page silently keeps the built-in defaults already
     written in the HTML — nothing breaks either way. Once hosted on
     Netlify/GitHub Pages, this fetch works normally and the CMS takes
     over as the source of truth. */
  function renderPricing(data) {
    function buildCol(containerId, items, titleHTML) {
      const col = document.getElementById(containerId);
      if (!col || !items) return;
      const cards = items.map((item) => `
        <div class="price-card"><div class="price-card-top"><h4>${item.name}</h4><span class="price">$<span class="price-number" data-count-to="${item.price}">0</span>${item.unit ? `<span class="price-unit">${item.unit}</span>` : ""}</span></div><p>${item.desc}</p></div>
      `).join("");
      col.innerHTML = titleHTML + cards;
    }
    buildCol("designPricingCards", data.design, `<h3 class="service-col-title">Graphic Design</h3>`);
    buildCol("videoPricingCards", data.video, `<h3 class="service-col-title">Video Editing <span class="service-note italic">(short form)</span></h3>`);
    if (window.__yemzyyBindCountUps) window.__yemzyyBindCountUps(document.getElementById("services"));
  }

  function renderStats(data) {
    const grid = document.getElementById("statsGrid");
    const items = data && data.stats;
    if (!grid || !items) return;
    grid.innerHTML = items.map((s) => `
      <div class="stat-card">
        <span class="stat-number" data-count-to="${s.value}">0</span><span class="stat-suffix">${s.suffix}</span>
        <p>${s.label}</p>
      </div>
    `).join("");
    if (window.__yemzyyBindCountUps) window.__yemzyyBindCountUps(grid);
  }

  function renderReviews(data) {
    const grid = document.getElementById("testimonialsTrack");
    const items = data && data.reviews;
    if (!grid || !Array.isArray(items)) return;
    const approved = items.filter((r) => r.approved);
    if (!approved.length) return; // keep the built-in placeholder set if nothing's approved yet
    grid.innerHTML = approved.map((r) => `
      <div class="testimonial-card">
        <p class="italic">"${r.quote}"</p>
        <span class="testimonial-name">${r.name}${r.role ? " — " + r.role : ""}</span>
      </div>
    `).join("");
  }

  async function loadCMSData() {
    const safeFetch = (path) => fetch(path).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const [pricing, stats, reviews] = await Promise.all([
      safeFetch("assets/data/pricing.json"),
      safeFetch("assets/data/stats.json"),
      safeFetch("assets/data/reviews.json"),
    ]);
    if (pricing) renderPricing(pricing);
    if (stats) renderStats(stats);
    if (reviews) renderReviews(reviews);
  }
  loadCMSData();

  /* ---------- Chatbot (lightweight, rule-based — no AI API) ---------- */
  const CHATBOT_DEFAULT = {
    greeting: "Hi! Have a question about my services, pricing, portfolio, or working with me? Ask me anything, or tap a question below.",
    fallback: "I'm not totally sure about that one — but here's what I can help with, or reach out directly through the contact form!",
    questions: [
      { q: "What services do you offer?", a: "I offer graphic design (posters, social graphics, brand identity, carousels) and video editing (short-form content, vlogs, promos). Scroll up to the Work section to see examples!", keywords: ["service", "offer", "what do you do"] },
      { q: "How much do you charge for video editing?", a: "Video editing starts at $20 for a single short-form video, $35 for two videos, or $10/hr for longer projects. Rush delivery is available too.", keywords: ["video price", "video cost", "charge for video", "video editing price", "how much video"] },
      { q: "What graphic design services do you provide?", a: "Graphic design starts at $10 for a single design, $30 for a design package (multiple related graphics like a carousel or artboard), or $10/hr for detailed work.", keywords: ["design price", "design cost", "graphic design service", "how much design"] },
      { q: "How can I work with you?", a: "It's simple: send an enquiry → we discuss the project → you submit your materials → editing/design begins → you review & request changes → final delivery. Want to start now?", keywords: ["work with you", "how do we start", "process", "get started", "how it works"] },
      { q: "Can I see your previous work?", a: "Of course! Scroll up to the Work section — you can filter by category for both Graphic Design and Video Editing, plus a dedicated Vlog Edits section.", keywords: ["portfolio", "previous work", "see your work", "examples", "past projects"] },
      { q: "How can I contact you?", a: "Best way is the inquiry form below, or message me on Instagram. I reply to every serious enquiry!", keywords: ["contact", "reach you", "email", "whatsapp", "instagram", "phone"] },
    ],
    ctaText: "Go to Contact Form",
    ctaTarget: "#contact",
  };

  const chatbotToggle = document.getElementById("chatbotToggle");
  const chatbotPanel = document.getElementById("chatbotPanel");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotMessages = document.getElementById("chatbotMessages");
  const chatbotSuggestions = document.getElementById("chatbotSuggestions");
  const chatbotForm = document.getElementById("chatbotForm");
  const chatbotInput = document.getElementById("chatbotInput");

  if (chatbotToggle && chatbotPanel) {
    let chatbotData = CHATBOT_DEFAULT;
    let hasGreeted = false;

    fetch("assets/data/chatbot.json").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) chatbotData = d; }).catch(() => {});

    function addMessage(text, sender) {
      const el = document.createElement("div");
      el.className = "chat-msg " + sender;
      el.textContent = text;
      chatbotMessages.appendChild(el);
      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function renderSuggestions() {
      chatbotSuggestions.innerHTML = "";
      chatbotData.questions.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = "chat-suggestion";
        btn.textContent = item.q;
        btn.addEventListener("click", () => {
          addMessage(item.q, "user");
          setTimeout(() => addMessage(item.a, "bot"), 300);
        });
        chatbotSuggestions.appendChild(btn);
      });
      const ctaBtn = document.createElement("button");
      ctaBtn.className = "chat-suggestion is-cta";
      ctaBtn.textContent = chatbotData.ctaText;
      ctaBtn.addEventListener("click", () => {
        closeChat();
        document.querySelector(chatbotData.ctaTarget)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
      chatbotSuggestions.appendChild(ctaBtn);
    }

    function openChat() {
      chatbotPanel.classList.add("is-open");
      chatbotToggle.classList.add("is-open");
      chatbotPanel.setAttribute("aria-hidden", "false");
      chatbotToggle.setAttribute("aria-expanded", "true");
      if (!hasGreeted) {
        hasGreeted = true;
        addMessage(chatbotData.greeting, "bot");
        renderSuggestions();
      }
    }
    function closeChat() {
      chatbotPanel.classList.remove("is-open");
      chatbotToggle.classList.remove("is-open");
      chatbotPanel.setAttribute("aria-hidden", "true");
      chatbotToggle.setAttribute("aria-expanded", "false");
    }

    chatbotToggle.addEventListener("click", () => {
      chatbotPanel.classList.contains("is-open") ? closeChat() : openChat();
    });
    chatbotClose.addEventListener("click", closeChat);

    // Auto-open once, shortly after load, with the welcome message + suggestions.
    // Visitor can close it and reopen anytime via the floating chat button.
    setTimeout(() => {
      if (!chatbotPanel.classList.contains("is-open")) openChat();
    }, 1800);

    chatbotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = chatbotInput.value.trim();
      if (!text) return;
      addMessage(text, "user");
      chatbotInput.value = "";
      const lower = text.toLowerCase();
      const match = chatbotData.questions.find((item) => item.keywords.some((k) => lower.includes(k)));
      setTimeout(() => {
        addMessage(match ? match.a : chatbotData.fallback, "bot");
      }, 300);
    });
  }

});
