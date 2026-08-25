/* ============================================================
   YEMZYY PORTFOLIO — SCRIPT
   ============================================================ */

document.addEventListener("DOMContentLoaded", async () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const goTo = (i) => {
      slides[current].classList.remove("is-active");
      dots[current].classList.remove("is-active");
      current = (i + slides.length) % slides.length;
      slides[current].classList.add("is-active");
      dots[current].classList.add("is-active");
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
    "recent": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-02.jpg",
    "recent": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-03.jpg",
    "recent": false
  },
  {
    "title": "Fashion Collection",
    "category": "Fashion",
    "image": "assets/design/design-04.jpg",
    "recent": false
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-05.jpg",
    "recent": false
  },
  {
    "title": "Sermon Notes",
    "category": "Faith & Church",
    "image": "assets/design/design-06.jpg",
    "recent": false
  },
  {
    "title": "Thanksgiving Celebration",
    "category": "Faith & Church",
    "image": "assets/design/design-07.jpg",
    "recent": false
  },
  {
    "title": "Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-08.jpg",
    "recent": false
  },
  {
    "title": "Thanksgiving Service",
    "category": "Faith & Church",
    "image": "assets/design/design-09.jpg",
    "recent": false
  },
  {
    "title": "Reunion & Communion Service",
    "category": "Faith & Church",
    "image": "assets/design/design-10.jpg",
    "recent": false
  },
  {
    "title": "Prayer & Fasting",
    "category": "Faith & Church",
    "image": "assets/design/design-11.jpg",
    "recent": false
  },
  {
    "title": "Cloud VPS Hosting",
    "category": "Tech & Cloud",
    "image": "assets/design/design-12.jpg",
    "recent": false
  },
  {
    "title": "Eid Mubarak",
    "category": "Faith & Church",
    "image": "assets/design/design-13.jpg",
    "recent": false
  },
  {
    "title": "Cloud Hosting Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-14.jpg",
    "recent": false
  },
  {
    "title": "Cloud Technology Solutions",
    "category": "Tech & Cloud",
    "image": "assets/design/design-15.jpg",
    "recent": false
  },
  {
    "title": "Scale Your Business with Cloud VPS",
    "category": "Tech & Cloud",
    "image": "assets/design/design-16.jpg",
    "recent": false
  },
  {
    "title": "Credit Card Services",
    "category": "Finance",
    "image": "assets/design/design-17.jpg",
    "recent": false
  },
  {
    "title": "Credit Card Solutions",
    "category": "Finance",
    "image": "assets/design/design-18.jpg",
    "recent": false
  },
  {
    "title": "Yemzyy Pay Credit Services",
    "category": "Finance",
    "image": "assets/design/design-19.jpg",
    "recent": false
  },
  {
    "title": "Keep Learning Without Interruption",
    "category": "Education",
    "image": "assets/design/design-20.jpg",
    "recent": false
  },
  {
    "title": "Auto Finance",
    "category": "Finance",
    "image": "assets/design/design-21.jpg",
    "recent": false
  },
  {
    "title": "Secure Funds",
    "category": "Finance",
    "image": "assets/design/design-22.jpg",
    "recent": false
  },
  {
    "title": "Credit Services",
    "category": "Finance",
    "image": "assets/design/design-23.jpg",
    "recent": false
  },
  {
    "title": "Smart Spending",
    "category": "Finance",
    "image": "assets/design/design-24.jpg",
    "recent": false
  },
  {
    "title": "Insurance Solutions",
    "category": "Finance",
    "image": "assets/design/design-25.jpg",
    "recent": false
  },
  {
    "title": "Healthcare",
    "category": "Healthcare",
    "image": "assets/design/design-26.jpg",
    "recent": false
  },
  {
    "title": "Motor Insurance",
    "category": "Finance",
    "image": "assets/design/design-27.jpg",
    "recent": false
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-28.jpg",
    "recent": false
  },
  {
    "title": "Consumer Electronics",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-29.jpg",
    "recent": false
  },
  {
    "title": "Tech Deals",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-30.jpg",
    "recent": false
  },
  {
    "title": "November Campaign",
    "category": "Marketing",
    "image": "assets/design/design-31.jpg",
    "recent": false
  },
  {
    "title": "Digital Marketing",
    "category": "Marketing",
    "image": "assets/design/design-32.jpg",
    "recent": false
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-33.jpg",
    "recent": false
  },
  {
    "title": "Tech Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-34.jpg",
    "recent": false
  },
  {
    "title": "Gadget Lifestyle",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-35.jpg",
    "recent": false
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-36.jpg",
    "recent": false
  },
  {
    "title": "Gadget Collection",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-37.jpg",
    "recent": false
  },
  {
    "title": "Tech Essentials",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-38.jpg",
    "recent": false
  },
  {
    "title": "Smart Gadgets",
    "category": "Tech & Gadgets",
    "image": "assets/design/design-39.jpg",
    "recent": false
  },
  {
    "title": "Paper Cut",
    "category": "Lifestyle",
    "image": "assets/design/design-40.jpg",
    "recent": false
  },
  {
    "title": "Footwear Collection",
    "category": "Fashion",
    "image": "assets/design/design-41.jpg",
    "recent": false
  },
  {
    "title": "Shoe Collection",
    "category": "Fashion",
    "image": "assets/design/design-42.jpg",
    "recent": false
  },
  {
    "title": "Music Promotion",
    "category": "Music & Sports",
    "image": "assets/design/design-43.jpg",
    "recent": false
  },
  {
    "title": "Birthday Celebration",
    "category": "Lifestyle",
    "image": "assets/design/design-44.jpg",
    "recent": false
  },
  {
    "title": "Digital Agency",
    "category": "Marketing",
    "image": "assets/design/design-45.jpg",
    "recent": false
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-46.jpg",
    "recent": false
  },
  {
    "title": "Sunday Service",
    "category": "Faith & Church",
    "image": "assets/design/design-47.jpg",
    "recent": false
  },
  {
    "title": "Kings & Courage",
    "category": "Music & Sports",
    "image": "assets/design/design-48.jpg",
    "recent": false
  },
  {
    "title": "Basketball",
    "category": "Music & Sports",
    "image": "assets/design/design-49.jpg",
    "recent": false
  },
  {
    "title": "Christmas & New Year",
    "category": "Seasonal",
    "image": "assets/design/design-50.jpg",
    "recent": false
  }
];

  const VIDEO_DEFAULT = [
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-01.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562461/video-01.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Social Media Growth",
    "category": "Content & Social",
    "videoFile": "assets/video/video-02.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562661/video-02.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "More Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-03.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562699/video-03.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Healthy Living",
    "category": "Health",
    "videoFile": "assets/video/video-04.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562694/video-04.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate Marketing",
    "category": "Real Estate",
    "videoFile": "assets/video/video-05.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562684/video-05.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Love & Understanding",
    "category": "Other",
    "videoFile": "assets/video/video-06.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562505/video-06.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Cillian Murphy Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-07.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562479/video-07.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Retirement Planning",
    "category": "Life & Career",
    "videoFile": "assets/video/video-08.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562228/video-08.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Figma Tips",
    "category": "Creative & Design",
    "videoFile": "assets/video/video-09.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562693/video-09.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Menstrual Health",
    "category": "Health",
    "videoFile": "assets/video/video-10.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562789/video-10.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Gift Box Business",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-11.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562688/video-11.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Social Media Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-12.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562472/video-12.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Client & Firm Dynamics",
    "category": "Other",
    "videoFile": "assets/video/video-13.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562483/video-13.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Successful Trading",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-14.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562511/video-14.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Lightning Effects",
    "category": "Creative & Design",
    "videoFile": "assets/video/video-15.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562520/video-15.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "From Social Manager to Realtor",
    "category": "Other",
    "videoFile": "assets/video/video-16.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562703/video-16.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-17.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562538/video-17.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-18.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562273/video-18.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-19.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562556/video-19.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-20.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562547/video-20.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Acne Care",
    "category": "Health",
    "videoFile": "assets/video/video-21.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562711/video-21.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-22.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562590/video-22.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Content Creation",
    "category": "Content & Social",
    "videoFile": "assets/video/video-23.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562700/video-23.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Audience vs. Clients",
    "category": "Content & Social",
    "videoFile": "assets/video/video-24.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562315/video-24mp4.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Quality Over Quantity",
    "category": "Content & Social",
    "videoFile": "assets/video/video-25.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562565/video-25.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Lock In",
    "category": "Motivation",
    "videoFile": "assets/video/video-26.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562763/video-26.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Meet the McCarty Founder",
    "category": "Brand & Personality",
    "videoFile": "assets/video/video-27.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562768/video-27.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate",
    "category": "Real Estate",
    "videoFile": "assets/video/video-28.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562736/video-28.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-29.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562351/video-29.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "MrBeast",
    "category": "Brand & Personality",
    "videoFile": "assets/video/video-30.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562325/video-30.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Business Growth Strategies",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-31.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562573/video-31.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Body Oil for People of Color",
    "category": "Fashion",
    "videoFile": "assets/video/video-32.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562726/video-32.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Home Inspection vs. Appraisal",
    "category": "Real Estate",
    "videoFile": "assets/video/video-33.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562755/video-33.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-34.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562585/video-34.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Podcast Production",
    "category": "Content & Social",
    "videoFile": "assets/video/video-35.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562576/video-35.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Original Ideas",
    "category": "Content & Social",
    "videoFile": "assets/video/video-36.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562349/video-36.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Spinal Cord Health",
    "category": "Health",
    "videoFile": "assets/video/video-37.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562363/video-37.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Mr. Puffs Advertisement",
    "category": "Brand & Personality",
    "videoFile": "assets/video/video-38.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562737/video-38.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Motivation",
    "category": "Motivation",
    "videoFile": "assets/video/video-39.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562638/video-39.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Earn vs. Learn",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-40.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562760/video-40.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Making Sales",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-41.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562591/video-41.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Earning in Dollars",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-42.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562605/video-42.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Business Flyers",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-43.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562377/video-43.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Pesa Expansion",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-44.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562594/video-44.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Turning Points",
    "category": "Motivation",
    "videoFile": "assets/video/video-45.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562649/video-45.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Fashion & Body Shorts",
    "category": "Fashion",
    "videoFile": "assets/video/video-46.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562806/video-46.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Career Paths",
    "category": "Life & Career",
    "videoFile": "assets/video/video-47.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562607/video-47.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Compelling Narratives",
    "category": "Other",
    "videoFile": "assets/video/video-48.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562635/video-48.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Creative Brand Growth",
    "category": "Other",
    "videoFile": "assets/video/video-49.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562419/video-49.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Real Estate Documents",
    "category": "Real Estate",
    "videoFile": "assets/video/video-50.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562666/video-50.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Consistency & Fitness",
    "category": "Fitness",
    "videoFile": "assets/video/video-51.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562420/video-51.mp4",
    "resolution": "",
    "recent": false
  },
  {
    "title": "Value & Problem Solving",
    "category": "Business & Finance",
    "videoFile": "assets/video/video-52.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562636/video-52.mp4",
    "resolution": "",
    "recent": false
  }
];

  const VLOG_DEFAULT = [
  {
    "title": "Day in the Life",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-01.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562842/vlog-01.mp4",
    "resolution": "1440x1080",
    "aspectRatio": "4/3",
    "recent": false
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-02.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562792/vlog-02.mp4",
    "resolution": "1920x1080",
    "aspectRatio": "16/9",
    "recent": false
  },
  {
    "title": "Spider-Man/ Nigeria",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-03.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562654/vlog-03.mp4",
    "resolution": "1920x1080",
    "aspectRatio": "16/9",
    "recent": false
  },
  {
    "title": "Travel Vlog",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-04.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562655/vlog-04.mp4",
    "resolution": "1920x1080",
    "aspectRatio": "16/9",
    "recent": false
  },
  {
    "title": "Life Lately",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-05.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562666/vlog-05.mp4",
    "resolution": "1440x1080",
    "aspectRatio": "4/3",
    "recent": false
  },
  {
    "title": "Daily Vlog",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-06.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562748/vlog-06.mp4",
    "resolution": "1440x1080",
    "aspectRatio": "4/3",
    "recent": false
  },
  {
    "title": "Content Ideas",
    "category": "Vlog",
    "videoFile": "assets/video/vlog-07.mp4",
    "videoUrl": "https://res.cloudinary.com/ztkrzhqm/video/upload/f_auto,q_auto,w_960,c_limit/v1787562794/vlog-07.mp4",
    "resolution": "1080x1920",
    "aspectRatio": "9/16",
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

  // Mobile browsers often render a <video> as blank until playback starts
  // (preload="metadata" loads info, not a visible frame). Cloudinary can
  // auto-extract a real thumbnail frame just by requesting the same file
  // with an image extension instead of video — this gives every card a
  // proper poster on all devices, including before any load/decode happens.
  function cloudinaryPoster(src) {
    if (!src || !src.includes("res.cloudinary.com") || !src.includes("/video/upload/")) return "";
    return src.replace("/video/upload/", "/video/upload/so_0/").replace(/\.mp4(\?.*)?$/, ".jpg");
  }

  function buildDesignGrid(projects) {
    const grid = document.getElementById("designGrid");
    let html = "";
    projects.forEach((item, idx) => {
      const i = idx + 1;
      const hiddenClass = i > VISIBLE_INITIAL ? " is-hidden" : "";
      html += `
        <article class="project-card${hiddenClass}" data-cursor="pen" data-category="${item.category}" data-recent="${!!item.recent}" style="animation-delay:${(idx % VISIBLE_INITIAL) * 0.03}s">
          <div class="project-media">
            <img src="${item.image}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" onerror="this.style.display='none'">
            <div class="media-placeholder">
              <span class="mp-icon">🖼️</span>
              <span class="mp-file">${item.image}</span>
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
      const src = item.videoUrl || item.videoFile;
      const poster = cloudinaryPoster(src);
      html += `
        <article class="project-card${hiddenClass}" data-cursor="play" data-hover-video data-category="${item.category}" data-recent="${!!item.recent}" style="animation-delay:${(idx % VISIBLE_INITIAL) * 0.03}s">
          <div class="project-media">
            <video src="${src}"${poster ? ` poster="${poster}"` : ""} class="real-media" muted loop playsinline preload="metadata" onerror="this.style.display='none'"></video>
            <div class="media-placeholder">
              <span class="mp-icon">🎬</span>
              <span class="mp-file">${src}</span>
            </div>
            <div class="play-overlay"><span>▶</span></div>
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
      const src = item.videoUrl || item.videoFile;
      const poster = cloudinaryPoster(src);
      html += `
        <article class="project-card vlog-card${orientationClass}${hiddenClass}" data-cursor="play" data-hover-video data-recent="${!!item.recent}" style="animation-delay:${idx * 0.04}s">
          <div class="project-media" style="aspect-ratio:${item.aspectRatio}">
            <video src="${src}"${poster ? ` poster="${poster}"` : ""} class="real-media is-contain" muted loop playsinline preload="metadata" onerror="this.style.display='none'"></video>
            <div class="media-placeholder">
              <span class="mp-icon">🎥</span>
              <span class="mp-file">${src}</span>
            </div>
            <div class="play-overlay"><span>▶</span></div>
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
      ...data.design.map((p) => ({ ...p, type: "design", src: p.image, icon: "🖼️" })),
      ...data.video.map((p) => ({ ...p, type: "video", src: p.videoUrl || p.videoFile, icon: "🎬" })),
      ...data.vlog.map((p) => ({ ...p, type: "vlog", src: p.videoUrl || p.videoFile, icon: "🎥" })),
    ].filter((p) => p.recent).slice(0, 8);
    if (!all.length) { section.style.display = "none"; return; }
    section.style.display = "block";
    track.innerHTML = all.map((item) => `
      <div class="recent-card"${item.type !== "design" ? " data-hover-video" : ""}>
        <div class="project-media">
          ${item.type === "design"
            ? `<img src="${item.src}" alt="${item.title}" class="real-media" loading="lazy" decoding="async" onerror="this.style.display='none'">`
            : `<video src="${item.src}"${cloudinaryPoster(item.src) ? ` poster="${cloudinaryPoster(item.src)}"` : ""} class="real-media" muted loop playsinline preload="metadata" onerror="this.style.display='none'"></video>`}
          <div class="media-placeholder"><span class="mp-icon">${item.icon}</span></div>
          ${item.type !== "design" ? `<div class="play-overlay"><span>▶</span></div>` : ""}
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
      attachHoverVideoListeners();
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
      attachHoverVideoListeners();
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

  /* ---------- Hover-3s play overlay on video cards ---------- */
  function attachHoverVideoListeners() {
    document.querySelectorAll("[data-hover-video]").forEach((card) => {
      if (card.dataset.hoverBound) return;
      card.dataset.hoverBound = "1";
      let timer = null;
      let previewPlaying = false;
      const overlay = card.querySelector(".play-overlay");
      const video = card.querySelector("video.real-media");

      card.addEventListener("mouseenter", () => {
        // Nothing happens until the cursor has stayed for a full 3 seconds.
        timer = setTimeout(() => {
          previewPlaying = true;
          if (overlay) overlay.classList.add("is-visible");
          if (video && video.style.display !== "none") {
            video.currentTime = 0;
            video.play().catch(() => {});
          }
        }, 3000);
      });

      card.addEventListener("mouseleave", () => {
        // Left before the 3s mark: cancel the pending timer, nothing plays.
        clearTimeout(timer);
        if (overlay) overlay.classList.remove("is-visible");
        // Left after preview had started: stop and reset it.
        if (previewPlaying && video) {
          video.pause();
          video.currentTime = 0;
        }
        previewPlaying = false;
      });
    });
  }
  attachHoverVideoListeners();

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

  function closeLightbox() {
    document.body.classList.remove("lightbox-open");
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lightboxContent.innerHTML = "";
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

  ["designGrid", "videoGrid", "vlogGrid"].forEach((gridId) => {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".project-card");
      if (!card) return;
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
    // Need enough items for a smooth endless loop — below ~6, fall back to the built-in placeholder set.
    if (approved.length < 6) return;
    const cardsHtml = approved.map((r) => `
      <div class="testimonial-card">
        <p class="italic">"${r.quote}"</p>
        <span class="testimonial-name">${r.name}${r.role ? " — " + r.role : ""}</span>
      </div>
    `).join("");
    grid.innerHTML = cardsHtml + cardsHtml; // duplicated once for the seamless -50% scroll loop
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
