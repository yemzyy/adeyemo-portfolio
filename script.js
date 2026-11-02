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

     VIDEO NOTE: Canva is the gallery player; Cloudinary is the startup
     backup. Local JPEG video thumbnails are independent of either player.
     The image-provider setting below does not change video hosting.
     Keep that separation when changing
     the whole media system.
     ============================================================ */
  const MEDIA_PROVIDER = "github";

  // The src an <img> should start with, for the current MEDIA_PROVIDER.
  // cloudinaryUrl/githubPath are plain strings; either may be blank.
  function mediaSrc(cloudinaryUrl, githubPath) {
    if (MEDIA_PROVIDER === "github") {
      // Local gallery previews avoid downloading full-size artwork on first view.
      return (githubPath || "").replace("assets/design/", "assets/graphic-previews/");
    }
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

  // Canva players are embedded directly in visible cards. A visitor's first
  // click reaches Canva's actual Play button rather than opening a second player.
  function safeCanvaUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === "https:" && url.hostname === "www.canva.com" &&
        /^\/design\/[^/]+\/[^/]+\/(watch|view)$/.test(url.pathname) &&
        url.searchParams.has("embed") ? url.href : "";
    } catch { return ""; }
  }
  function getVideoPoster(item) { return item.poster || ""; }
  function escapeMediaText(value) {
    return String(value || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  let mediaInteractionActive = false;
  function setMediaInteraction(active) {
    if (mediaInteractionActive === active) return;
    mediaInteractionActive = active;
    document.body.classList.toggle("is-watching-video", active);
    window.dispatchEvent(new Event("portfolio:mediafocus"));
  }
  // The silent hero playlist is managed by hero-player.js.

  // Render immediately rather than waiting for all images and fonts.

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
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsTY2rLk/l2bixvyHhOoeKa27CU5MJw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-02.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsYCvXOo/Zd0MnCmhRRfvib9Z8eg0tA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-03.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsQRVZH4/V4p7jc0VSFl7pW3khOsKDg/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-04.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZseHQTiE/OYKb9hU09ozdbZYM1C24EQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-05.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsZSBfIA/GU37zXIorwAHdqCsS1DT-g/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-06.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsT8MUzg/VOfFckXkt112z7D_ZZlEUA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Thanksgiving Celebration",
    "category": "Faith & Church",
    "image": "assets/design/design-07.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsdMCHJg/_h08Q4IoS6oPIhhY9JM2Ww/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-08.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsas3jO0/sQTC3v8nusuTcLQvGKanyA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Thanksgiving Service",
    "category": "Faith & Church",
    "image": "assets/design/design-09.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsdYA0Qw/VZNgVZ_TU1VDI6BF9L0VUQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Reunion & Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-10.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsUdytY8/958dENH5h0CRiJiCJIk7zw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Prayer & Fasting",
    "category": "Faith & Church",
    "image": "assets/design/design-11.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsagPIHg/wc0qCsX7SC4syJxYLKerAQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Cloud VPS Hosting",
    "category": "Tech & Cloud",
    "image": "assets/design/design-12.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbDKjUw/JpN2XmXL8qlxZEHckd3FgQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Eid Mubarak",
    "category": "Faith & Church",
    "image": "assets/design/design-13.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsSsvPGY/xdWnHSv59XPg-v7ViTQzPA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Cloud Hosting Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-14.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsTA0wrs/qVkDDW5rK7ilJl-TZBrQzw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Cloud Technology Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-15.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbrGGnc/xsf8a8p-vFX9TgxoAp-dlw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Scale Your Business with Cloud VPS",
    "category": "Tech & Cloud",
    "image": "assets/design/design-16.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsSjJzxo/b9lu7kgrFBfMUOrYyDzblA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Credit Card Services",
    "category": "Finance",
    "image": "assets/design/design-17.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsWn_pf0/G-6Mz532Fh1iPVzuAmA1_A/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Credit Card Solutions",
    "category": "Finance",
    "image": "assets/design/design-18.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsThB4YA/chV0n0Nylb29jtxe0FmVIg/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Yemzyy Pay Credit Services",
    "category": "Finance",
    "image": "assets/design/design-19.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsdlbvL0/vEvtAnfveDeAWwYPQASi8A/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Keep Learning Without Interruption",
    "category": "Education",
    "image": "assets/design/design-20.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsXNKdc4/trAMKGB_nGJggC1xSPjWng/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Auto Finance",
    "category": "Finance",
    "image": "assets/design/design-21.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsdtc-Ho/4xJ5PIl_j7UQQY0wEpUASQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Secure Funds",
    "category": "Finance",
    "image": "assets/design/design-22.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsXTzz9s/maHz4O9jjdtI5h-aI_toEw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Credit Services",
    "category": "Finance",
    "image": "assets/design/design-23.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsZm69Iw/APrGQWhlkUI8CmHghZHw3A/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Smart Spending",
    "category": "Finance",
    "image": "assets/design/design-24.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsRVTdYA/DM5IjZXzcs4zbCdUgAmcxw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Insurance Solutions",
    "category": "Finance",
    "image": "assets/design/design-25.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsRcHG0w/NyOoveebWNUlYAiAgJzvQA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Healthcare",
    "category": "Healthcare",
    "image": "assets/design/design-26.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZscmjAEA/_6ImTTj_Tl3rT06mx0zM8A/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Motor Insurance",
    "category": "Finance",
    "image": "assets/design/design-27.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbasoSU/AU4r2mMGgJYuSePxiJMqLA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-28.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbRP1N4/TW2YeO9sU4AKPVibm6MlQw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Consumer Electronics",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-29.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZseRPK7c/PZPHc09_TPlBgwSyO7tdkQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Tech Deals",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-30.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsd6f2Qk/AffYB1Rfml_gL7noPvS2gw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "November Campaign",
    "category": "Marketing",
    "image": "assets/design/design-31.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbpC-4U/pVpSTpptn5fz8WU_0hYEiQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Digital Marketing",
    "category": "Marketing",
    "image": "assets/design/design-32.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbbB-BQ/z20nPdw80gQiAf7PC3ENfg/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-33.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsRoXbAA/cWzHBmvzDyPLEOM11kaq8Q/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Tech Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-34.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsanSy54/nVWs_Hw6ObhWkABzjrrHUA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-35.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsaFr_Vg/tARpvNsKy7IEvDClTAi2RQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-36.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsZ4cb7E/IcicyF1_agElfgCofZPGTQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-37.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbN6BDg/SLyFGpEVXmgEInYyS3BtOw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Tech Essentials",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-38.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsZAWMaw/KcMYOGo1nXIgOLqngeUCmw/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Smart Gadgets",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-39.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsQ41_K4/KOlSmRN6WLC4diaKkcGoDg/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Paper Cut",
    "category": "Lifestyle",
    "image": "assets/design/design-40.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsVuY0DQ/muTaUNcEI1iS-HBysAnmrQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Footwear Collection",
    "category": "Fashion",
    "image": "assets/design/design-41.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsi66OSE/rHVq0W117HE59AWGPx6n7Q/view?embed",
    "aspectRatio": "70/99",
    "pendingCanva": false
  },
  {
    "title": "Shoe Collection",
    "category": "Fashion",
    "image": "assets/design/design-42.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZspgRIcU/krNriXbrLtmqvssE1dUMBA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-43.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZskZOxfo/VNXwmVXH7Pxn1Rt_Cn04SA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Birthday Celebration",
    "category": "Lifestyle",
    "image": "assets/design/design-44.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsgFk95k/kDcXDDnO-gJ0zEIxDKmhLQ/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Digital Agency",
    "category": "Marketing",
    "image": "assets/design/design-45.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZssvRCBs/7E3FWBAayaz9L6tpP5BogA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-46.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsqx6hgA/AMpT_SwUuxrF-46ceV_FCA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-47.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZshodpM4/Bwa9DOKz61fwJpkgPqFpAA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Kings & Courage",
    "category": "Music & Sports",
    "image": "assets/design/design-48.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsgguXO8/s5XCKCbQ6uH_JiyOo5k5UA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Basketball",
    "category": "Music & Sports",
    "image": "assets/design/design-49.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsnqS828/f3u2WqyysNnFOAN5K6fUHA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  },
  {
    "title": "Christmas & New Year",
    "category": "Seasonal",
    "image": "assets/design/design-50.jpg",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsqrLZHg/QmxyELqPnCNE_DLZRUiHiA/view?embed",
    "aspectRatio": "4/5",
    "pendingCanva": false
  }
];

  const VIDEO_DEFAULT = [
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859548/video-01.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-01.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrUdcKvE/_S10xa77UFtQYu95POHgXg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Social Media Growth",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861362/video-02.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-02.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZr223Lfo/tfhXdTtzD04ZjzqXfQagBA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "More Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862136/video-03.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-03.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrwdJpkE/HzMwGSdyR8eQUfitZyBojw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Healthy Living",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861481/video-04.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-04.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrzmnjzU/OfAmj_bQPxifSK6ngosbhQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate Marketing",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861917/video-05.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-05.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsMOC8aM/U_QSb5WeH1HMev9TRQIyug/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Love & Understanding",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861497/video-06.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-06.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZr_bHQ1o/qRLm2Gq69lo1ZQ610PB32Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Cillian Murphy Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859928/video-07.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-07.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrxB6Hys/a_BOSg83cofeDfVz5PDpfg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Retirement Planning",
    "category": "Life & Career",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789857497/video-08.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-08.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrzm9e7k/Y7jSH5ydRdMYnSMpGRGC-Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Figma Tips",
    "category": "Creative & Design",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861731/video-09.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-09.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZrwp-PGQ/4w2RTVMW4YQHyhuU936LTg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Menstrual Health",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862260/video-10.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-10.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZr2-j2bc/ihXkMOqu6Vs3tHrXo4p_dw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Gift Box Business",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861859/video-11.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-11.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsCMVZps/ysHkqoaSw0L6aIFUP6cHng/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Social Media Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860208/video-12.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-12.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsO7lDWs/7OKCb4AGzE77TRwNbBmKww/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Client & Firm Dynamics",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860315/video-13.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-13.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsDSK150/KavNpdhO8JVYX7tNMexeQg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Successful Trading",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860533/video-14.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-14.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsInAgvo/J45gwVLLF9h18BuSE9RQww/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Lightning Effects",
    "category": "Creative & Design",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860615/video-15.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-15.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsGGsuDo/PnVYEwhQz_i-x8zDCLN58g/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "From Social Manager to Realtor",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862153/video-16.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-16.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsFSV5_U/7Cx1tNjC2btNjCIlO8CDSg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860581/video-17.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-17.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsFbFcTg/EwRQTmHlSqI1VMHMRcr54Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858374/video-18.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-18.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsLymCNc/so-meqz6eKs860WxLa1FMw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861418/video-19.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-19.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsHKltRA/Lwq32NsA8Hv527oWqzpf2g/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860814/video-20.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-20.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsHNjClA/UzVH0g6BHZ5gfyCUFqddfA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Acne Care",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862046/video-21.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-21.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsP-Pjj4/XOUKZPgpLVGsU8JRNsdGSg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859540/video-22.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-22.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsBsv7_c/7AF5wufSHw1LM3tiA9Ea7g/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Content Creation",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861479/video-23.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-23.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsNSsW2U/r0o0E9I67Iz25gBPYOUNAQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Audience vs. Clients",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789857320/video-24.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-24.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsPxR6ww/da7nfaKkW6aT3laseIu8zg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Quality Over Quantity",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860064/video-25.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-25.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsGc8JNs/pJJn6zuu--iejTk8aVN3Lw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Lock In",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862211/video-26.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-26.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsEq_xDQ/RQHGHDY6hrr5SB1-okG6Qw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Meet the McCarty Founder",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862192/video-27.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-27.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsNLC2Qc/jEmf2PMdq5FSchGepblyIA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861810/video-28.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-28.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsBaoAmg/EdToObqq-xn4CDtgwvZoMw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858113/video-29.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-29.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsLKg0z4/D2gYdKzeeYLVu-8bo_VsVw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "MrBeast",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858102/video-30.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-30.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsIfqxt0/Xg3Rcd5y3CXVNdoLsdXQxA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Business Growth Strategies",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860570/video-31.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-31.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsMwyvZg/7BKLZIPSj6mx0piM9ZkSxQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Body Oil for People of Color",
    "category": "Fashion",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862073/video-32.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-32.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsO3eQGg/gWk3NmB82LSlBjA7RwMTew/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Home Inspection vs. Appraisal",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862269/video-33.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-33.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsE3nzxU/uQSJywsGhOPGeKyfLUmEtg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860642/video-34.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-34.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsKUo9cQ/ii-_L4lukiOOr80HwMcWjg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Podcast Production",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860628/video-35.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-35.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsD3ZMPE/MBBl25TFOFR4YMvwCvWRBw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Original Ideas",
    "category": "Content & Social",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858813/video-36.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-36.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsBynC30/Lj6OQTbnjV5JNV_EEMlThA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Spinal Cord Health",
    "category": "Health",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858612/video-37.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-37.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsG5I_S0/6mJShkeaws3M6dUfB53C5Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Mr. Puffs Advertisement",
    "category": "Brand & Personality",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862153/video-38.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-38.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsCvvb0Y/uMydw8-9GQ-Mcojm-Nq4Rw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789860884/video-39.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-39.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsAlQeXg/KiQuA73S6KGD-t6gWbzULQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Earn vs. Learn",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862269/video-40.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-40.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsN-SoZk/LLaoOixp_6aKKNN4WzezHA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Making Sales",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861048/video-41.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-41.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsE0zQFw/RfYM1vFpuiWT2QVkhQZ-EQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Earning in Dollars",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861115/video-42.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-42.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsGT5gxA/wZgNSJzDkN1-nHjauy2n3g/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Business Flyers",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789858960/video-43.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-43.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsKzZ028/Thu6ZBO36K_k7Br8lYZnDQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Pesa Expansion",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861060/video-44.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-44.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsKPaNBw/SP6Mjx_5Jn6f8MAAQx3thA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Turning Points",
    "category": "Motivation",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861682/video-45.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-45.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsOgvsXs/Y0r_CV3CkxyK5EZ3xylC1Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Fashion & Body Shorts",
    "category": "Fashion",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862230/video-46.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-46.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsEAi2xE/jkVU71629HxtA26W8FjHiQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Career Paths",
    "category": "Life & Career",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861174/video-47.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-47.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsN2tpfM/-9sIrnqgACYcwzI7bQYm6Q/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Compelling Narratives",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861096/video-48.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-48.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsFzmWEc/aQMiqEnHxTZ8ksQgwzNxQA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Creative Brand Growth",
    "category": "Other",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859562/video-49.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-49.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsHBChEA/7mtZ-j5UaMQplaAGavkh6w/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Real Estate Documents",
    "category": "Real Estate",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861158/video-50.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-50.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsLneoAo/SM9vcejDd6AR7bQ-So0avg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Consistency & Fitness",
    "category": "Fitness",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789859577/video-51.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-51.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsPfXkIs/pEkDBiAul5Mqn0QD8Rz4yA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Value & Problem Solving",
    "category": "Business & Finance",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861198/video-52.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/video-52.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsLDPvPw/rxxSgIDO0b-8xDbHmyL3QQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  }
];

  const VLOG_DEFAULT = [
  {
    "title": "Day in the Life",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862259/vlog-01.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-01.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsOEDB4A/A-QGy9vk1UaXytQl9yWXAw/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "4/3"
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862244/vlog-02.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-02.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsDdSpw8/dt8ff8ccOQAuKzPBO_WvHQ/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Spider-Man/ Nigeria",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861235/vlog-03.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-03.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsGoiqHY/EljdYQh4tfM1NDPJ1CKYpg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789861307/vlog-04.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-04.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsIOSXKk/wxFmOWcKBqfLk82nc_IlCA/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "16/9"
  },
  {
    "title": "Life Lately",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789948189/vlog-05.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-05.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsbCJOUc/sEWRnijxgwzVB8mZ0_fpUg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "4/3"
  },
  {
    "title": "Daily Vlog",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862164/vlog-06.mp4",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-06.jpg",
    "aspectRatio": "16/9",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsZHqepo/4GvmsCb5zaJ_DWDzG_nZbg/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "4/3"
  },
  {
    "title": "Content Ideas",
    "category": "Vlog",
    "videoUrl": "https://res.cloudinary.com/cvnqmegn/video/upload/v1789862249/vlog-07.mov",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-07.jpg",
    "aspectRatio": "9/16",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsX-HhVE/jk3WvVWFsE4PHLwxBWR25g/watch?embed",
    "pendingCanva": false,
    "backupAspectRatio": "9/16"
  },
  {
    "title": "Vlog 08",
    "category": "Vlog",
    "recent": false,
    "canvaEmbedUrl": "https://www.canva.com/design/DAHZsUokDJ8/2jDpXKxtIiKyQQZxabhaqQ/watch?embed",
    "aspectRatio": "9/16",
    "pendingCanva": false,
    "videoUrl": "",
    "driveId": "",
    "poster": "assets/video-thumbnails/vlog-08.jpg",
    "backupAspectRatio": "9/16"
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
        <article class="project-card${hiddenClass}" role="button" tabindex="0" data-design-index="${idx}" data-cursor="pen" data-category="${item.category}" data-recent="${!!item.recent}" style="animation-delay:${(idx % VISIBLE_INITIAL) * 0.03}s">
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

  function buildCanvaVideoGrid(projects, gridId, type, visibleCount) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = projects.map((item, idx) => {
      const hidden = idx >= visibleCount ? " is-hidden" : "";
      const title = escapeMediaText(item.title);
      const ratio = /^[0-9.]+\/[0-9.]+$/.test(item.aspectRatio || "") ? item.aspectRatio : "9/16";
      return `<article class="project-card canva-video-card${hidden}" data-video-type="${type}" data-video-index="${idx}" data-media-key="${type}-${idx + 1}" data-category="${escapeMediaText(item.category)}" data-recent="${!!item.recent}">
        <button type="button" class="video-preview-trigger" aria-label="Preview ${title}">
          <span class="project-media" style="aspect-ratio:${ratio}">
            <img class="canva-video-poster" src="${escapeMediaText(getVideoPoster(item))}" alt="" loading="lazy" decoding="async">
            <span class="video-preview-play" aria-hidden="true">▶</span>
          </span>
          <span class="project-info"><span class="video-card-title">${title}</span><span class="project-tag">${type === "vlog" ? "Vlog" : "Video"} ${pad(idx + 1)}</span></span>
        </button>
      </article>`;
    }).join("");
  }

  function buildVideoGrid(projects) { buildCanvaVideoGrid(projects, "videoGrid", "video", VISIBLE_INITIAL); }
  function buildVlogGrid(projects) { buildCanvaVideoGrid(projects, "vlogGrid", "vlog", isMobile ? 4 : projects.length); }

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

  // Gallery cards are image-only; only the selected preview creates a player.

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
      img.src = (mediaEl.currentSrc || mediaEl.src).replace("/assets/graphic-previews/", "/assets/design/");
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
    if (!lightbox.open) lightbox.showModal();
    lightboxClose.focus();
  }

  // Sizes a Canva design iframe to fit the lightbox without cropping, for ANY
  // aspect ratio — not just a hardcoded 16:9/9:16 pair. An iframe has no
  // intrinsic size the way <video> does, so the browser can't work this
  // out on its own from CSS alone; this computes the same "contain" math
  // (fit inside the available box, preserve ratio, never crop) a <video>
  // gets for free, using the real viewport size so it's correct at any
  // screen width. Recomputed on resize/orientation-change while open.
  function sizeCanvaFrame(iframe, aspectRatio) {
    const parts = String(aspectRatio || "16/9").split("/").map(Number);
    const ratio = (parts[0] && parts[1]) ? parts[0] / parts[1] : 16 / 9;
    const viewport = window.visualViewport;
    const maxW = Math.min((viewport?.width || window.innerWidth) - 24, 1100);
    const maxH = Math.max(120, (viewport?.height || window.innerHeight) - 150);
    let w = maxW;
    let h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    iframe.style.width = `${Math.round(w)}px`;
    iframe.style.height = `${Math.round(h)}px`;
  }
  let canvaFrameResizeHandler = null;

  let designPreviewTimer = null;
  // Canva stays primary; missing initial viewer load switches to the GitHub image.
  // Cross-origin iframe load cannot diagnose every internal Canva error.
  function openVideoLightbox(item) {
    stopPreviewMedia();
    const src = safeCanvaUrl(item.canvaEmbedUrl);
    const localPath = item.image || "";
    lightboxContent.innerHTML = "";
    const stage = document.createElement("div");
    stage.className = "design-preview-stage";
    lightboxContent.appendChild(stage);
    const showLocal = () => {
      clearTimeout(designPreviewTimer);
      designPreviewTimer = null;
      if (!stage.isConnected || !localPath) return;
      stage.innerHTML = "";
      if (canvaFrameResizeHandler) {
        window.removeEventListener("resize", canvaFrameResizeHandler);
        canvaFrameResizeHandler = null;
      }
      const image = document.createElement("img");
      image.src = localPath;
      image.alt = item.title || "Portfolio design";
      stage.appendChild(image);
      stage.dataset.provider = "github";
    };
    if (src) {
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = `${item.title} — Canva design`;
      iframe.allow = "fullscreen";
      iframe.allowFullscreen = true;
      iframe.className = "drive-frame";
      iframe.addEventListener("load", () => {
        if (!iframe.isConnected) return;
        clearTimeout(designPreviewTimer);
        designPreviewTimer = null;
      }, {once: true});
      stage.appendChild(iframe);
      stage.dataset.provider = "canva";
      sizeCanvaFrame(iframe, item.aspectRatio);
      canvaFrameResizeHandler = () => sizeCanvaFrame(iframe, item.aspectRatio);
      window.addEventListener("resize", canvaFrameResizeHandler);
      if (localPath) designPreviewTimer = setTimeout(showLocal, 15000);
    } else if (localPath) showLocal();
    else { showToastMsg("This preview will be available soon"); return; }
    document.body.classList.add("lightbox-open");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (!lightbox.open) lightbox.showModal();
    lightboxClose.focus();
  }

  let previewTimer = null;
  let previewReturnFocus = null;
  let selectedVideo = null;
  function stopPreviewMedia() {
    clearTimeout(designPreviewTimer);
    designPreviewTimer = null;
    clearTimeout(previewTimer);
    previewTimer = null;
    lightboxContent.querySelectorAll("video").forEach(video => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    });
    // Removing the iframe destroys its playback context, including audio.
    lightboxContent.querySelectorAll("iframe").forEach(frame => frame.remove());
    if (canvaFrameResizeHandler) {
      window.removeEventListener("resize", canvaFrameResizeHandler);
      window.visualViewport?.removeEventListener("resize", canvaFrameResizeHandler);
      canvaFrameResizeHandler = null;
    }
  }
  function openPortfolioVideo(item, opener) {
    stopPreviewMedia();
    selectedVideo = item;
    previewReturnFocus = opener || document.activeElement;
    lightboxContent.innerHTML = "";
    lightbox.classList.add("is-video-preview");
    const toolbar = document.createElement("div");
    toolbar.className = "video-preview-toolbar";
    const heading = document.createElement("h2");
    heading.id = "videoPreviewTitle";
    heading.textContent = item.title || "Video preview";
    const reload = document.createElement("button");
    reload.type = "button";
    reload.className = "preview-reload";
    reload.textContent = "↻";
    reload.setAttribute("aria-label", "Reload this video");
    reload.addEventListener("click", () => openPortfolioVideo(item, previewReturnFocus));
    toolbar.append(heading, reload);
    const stage = document.createElement("div");
    stage.className = "video-preview-stage";
    const cover = document.createElement("img");
    cover.src = getVideoPoster(item);
    cover.alt = "";
    cover.className = "preview-cover";
    stage.appendChild(cover);
    lightboxContent.append(toolbar, stage);
    lightbox.setAttribute("aria-labelledby", heading.id);
    lightbox.setAttribute("aria-label", "Video preview");
    const sizeStage = ratio => {
      const parts = String(ratio || "16/9").split("/").map(Number);
      const aspect = parts[0] > 0 && parts[1] > 0 ? parts[0] / parts[1] : 16/9;
      const viewport = window.visualViewport;
      const maxW = Math.min((viewport?.width || innerWidth) - 24, 1100);
      const maxH = Math.max(120, (viewport?.height || innerHeight) - 150);
      // Landscape embeds need vertical room for Canva's own toolbar.
      // The complete player remains visible; no controls are clipped or covered.
      const controlsRoom = aspect > 1 && stage.dataset.provider !== "cloudinary" ? 112 : 0;
      const width = Math.min(maxW, Math.max(120, maxH - controlsRoom) * aspect);
      const playerWidth = aspect <= 1 ? Math.min(maxW, Math.max(width, 320)) : width;
      stage.style.width = `${Math.round(playerWidth)}px`;
      stage.style.height = `${Math.round(width / aspect + controlsRoom)}px`;
    };
    sizeStage(item.aspectRatio);
    canvaFrameResizeHandler = () => sizeStage(stage.dataset.ratio || item.aspectRatio);
    window.addEventListener("resize", canvaFrameResizeHandler);
    window.visualViewport?.addEventListener("resize", canvaFrameResizeHandler);
    const backup = () => {
      if (!lightbox.open || selectedVideo !== item || !stage.isConnected) return;
      let url;
      try { url = new URL(item.videoUrl); } catch { return; }
      if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return;
      stage.querySelector("iframe")?.remove();
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.preload = "none";
      video.poster = getVideoPoster(item);
      video.src = /\.mov(?:\?|$)/i.test(url.href) ? url.href.replace("/video/upload/", "/video/upload/f_mp4,q_auto/") : url.href;
      video.dataset.nativeBackup = "selected";
      video.addEventListener("loadedmetadata", () => {
        if (video.videoWidth && video.videoHeight) {
          stage.dataset.ratio = `${video.videoWidth}/${video.videoHeight}`;
          sizeStage(stage.dataset.ratio);
        }
      }, { once: true });
      stage.appendChild(video);
      stage.dataset.provider = "cloudinary";
    };
    const src = safeCanvaUrl(item.canvaEmbedUrl);
    if (src) {
      const frame = document.createElement("iframe");
      frame.title = `${item.title || "Portfolio video"} — Canva player`;
      frame.allow = "fullscreen; picture-in-picture";
      frame.allowFullscreen = true;
      frame.src = src;
      frame.addEventListener("load", () => {
        if (!frame.isConnected || selectedVideo !== item) return;
        clearTimeout(previewTimer);
        previewTimer = null;
        frame.classList.add("is-loaded");
      }, { once: true });
      stage.appendChild(frame);
      stage.dataset.provider = "canva";
      // Startup timeout only; iframe load cannot report internal buffering/errors.
      previewTimer = setTimeout(backup, 30000);
    }
    document.body.classList.add("lightbox-open");
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (!lightbox.open) lightbox.showModal();
    if (!src) backup();
    lightboxClose.focus();
    setMediaInteraction(true);
  }

  function closeLightbox() {
    stopPreviewMedia();
    selectedVideo = null;
    lightbox.classList.remove("is-video-preview");
    lightbox.removeAttribute("aria-labelledby");
    lightbox.setAttribute("aria-label", "Portfolio preview");
    if (lightbox.open) lightbox.close();
    document.body.classList.remove("lightbox-open");
    setMediaInteraction(false);
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxContent.innerHTML = "";
    previewReturnFocus?.focus();
    previewReturnFocus = null;
    if (canvaFrameResizeHandler) {
      window.removeEventListener("resize", canvaFrameResizeHandler);
      canvaFrameResizeHandler = null;
    }
  }

  lightbox.addEventListener("cancel", event => { event.preventDefault(); closeLightbox(); });
  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  const VIDEO_TYPE_DATA = { video: () => portfolioData.video, vlog: () => portfolioData.vlog };

  ["designGrid", "videoGrid", "vlogGrid"].forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.matches(".project-card[data-design-index]")) {
        e.preventDefault();
        e.target.click();
      }
    });
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".project-card");
      if (!card) return;


      if (card.dataset.designIndex !== undefined) {
        const item = portfolioData.design[Number(card.dataset.designIndex)];
        if (item) openVideoLightbox(item);
        return;
      }

      // Video/vlog cards carry data-video-type + data-video-index (a lookup
      // into the loaded portfolio data); design cards carry neither.
      const videoType = card.dataset.videoType;
      if (videoType && VIDEO_TYPE_DATA[videoType]) {
        const item = VIDEO_TYPE_DATA[videoType]()[Number(card.dataset.videoIndex)];
        if (item) openPortfolioVideo(item, e.target.closest("button"));
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
          formStatus.textContent = "Thanks, your inquiry is in! I'll get back to you soon.";
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

  let rafId = null;
  let lastDrawTime = -Infinity;
  const saveData = navigator.connection && navigator.connection.saveData;
  const canAnimateBackground = () => !reduceMotion && !saveData && !document.hidden && !mediaInteractionActive;
  function loop(t) {
    rafId = null;
    if (!canAnimateBackground()) return;
    if (t - lastDrawTime >= 1000 / 30) { drawFrame(t); lastDrawTime = t; }
    rafId = requestAnimationFrame(loop);
  }
  function syncBackgroundAnimation() {
    if (canAnimateBackground()) {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    } else if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  drawFrame(0);
  syncBackgroundAnimation();
  document.addEventListener("visibilitychange", syncBackgroundAnimation);
  window.addEventListener("portfolio:mediafocus", syncBackgroundAnimation);

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
