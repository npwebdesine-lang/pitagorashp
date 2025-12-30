/* script.js — שדרוג UX בלי ספריות חיצוניות
   כולל:
   - Scroll Reveal עדין לסקשנים/כרטיסים
   - Sticky Nav שמקבל "זכוכית" בגלילה
   - סימון סעיף פעיל בתפריט לפי הסקשן במסך
   - כפתור "חזרה למעלה"
   - Smooth scroll עם תיקון offset ל-Header
   - התחשבות ב-prefers-reduced-motion
*/

(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  )?.matches;

  // ===== Inject minimal CSS needed (כדי שלא תצטרך לשנות style.css) =====
  const style = document.createElement("style");
  style.textContent = `
    /* Reveal בסיסי */
    .js-reveal {
      opacity: 0;
      transform: translateY(14px);
      transition: opacity .7s ease, transform .7s ease;
      will-change: opacity, transform;
    }
    .js-reveal.is-visible {
      opacity: 1;
      transform: translateY(0);
    }

    /* Sticky nav */
    header nav.js-sticky {
      position: sticky;
      top: 12px;
      z-index: 1000;
      transition: transform .25s ease, filter .25s ease;
    }
    header nav.js-sticky.is-scrolled ul {
      background: rgba(15, 23, 42, 0.92);
      border-color: rgba(148, 163, 184, 0.85);
      box-shadow: 0 14px 40px rgba(0,0,0,.55);
    }

    /* קישור פעיל בתפריט */
    header nav a.is-active {
      color: #facc15 !important;
    }
    header nav a.is-active::after {
      width: 100% !important;
    }

    /* Back to top */
    .back-to-top {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 1100;
      width: 46px;
      height: 46px;
      border-radius: 999px;
      border: 1px solid rgba(148,163,184,.8);
      background: rgba(15,23,42,.88);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      display: grid;
      place-items: center;
      cursor: pointer;
      opacity: 0;
      transform: translateY(10px);
      pointer-events: none;
      transition: opacity .2s ease, transform .2s ease, box-shadow .2s ease;
      box-shadow: 0 10px 26px rgba(0,0,0,.5);
    }
    .back-to-top.is-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    .back-to-top:hover {
      box-shadow: 0 14px 34px rgba(0,0,0,.6);
    }
    .back-to-top svg { width: 20px; height: 20px; }

    /* נראות focus למקלדת */
    a:focus-visible, button:focus-visible {
      outline: 2px solid #facc15;
      outline-offset: 3px;
      border-radius: 10px;
    }
  `;
  document.head.appendChild(style);

  // ===== Helpers =====
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  // ===== Sticky nav behavior =====
  const nav = $("header nav");
  if (nav) nav.classList.add("js-sticky");

  const header = $("header");
  const headerHeight = () =>
    header ? header.getBoundingClientRect().height : 0;

  // ===== Smooth scroll w/ offset (לטובת sticky header) =====
  const navLinks = $$('header nav a[href^="#"]');
  navLinks.forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id ? document.querySelector(id) : null;
      if (!target) return;

      e.preventDefault();

      const top =
        window.scrollY +
        target.getBoundingClientRect().top -
        Math.min(headerHeight(), 140) -
        14;

      window.scrollTo({
        top: Math.max(top, 0),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  });

  // ===== Scroll Reveal =====
  // בוחרים אלמנטים שמרוויחים reveal: סקשנים, כרטיסים, פוטר, כפתורים
  const revealTargets = [
    ...$$("main section"),
    ...$$(".service-box"),
    ...$$(".info-card"),
    ...$$(".ceo-card"),
    ...$$("footer"),
    ...$$(".cta-btn"),
  ];

  // הימנע מכפילויות
  const uniqueReveal = Array.from(new Set(revealTargets)).filter(Boolean);

  if (!prefersReducedMotion) {
    uniqueReveal.forEach((el) => el.classList.add("js-reveal"));

    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    uniqueReveal.forEach((el) => revealObserver.observe(el));
  } else {
    // אם המשתמש ביקש פחות אנימציות — מציג הכל מיד
    uniqueReveal.forEach((el) => {
      el.classList.remove("js-reveal");
      el.classList.add("is-visible");
    });
  }

  // ===== Active section in nav (spy) =====
  const sectionIds = navLinks
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && h.startsWith("#"))
    .map((h) => h.slice(1));

  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const linkById = new Map(
    navLinks.map((a) => [a.getAttribute("href")?.slice(1), a])
  );

  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.remove("is-active"));
    const link = linkById.get(id);
    if (link) link.classList.add("is-active");
  };

  if (sections.length) {
    const spyObserver = new IntersectionObserver(
      (entries) => {
        // בוחרים את הסקשן "הכי נראה" כרגע
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) setActive(visible.target.id);
      },
      {
        threshold: [0.18, 0.28, 0.4, 0.55],
        rootMargin: "-10% 0px -55% 0px",
      }
    );

    sections.forEach((s) => spyObserver.observe(s));
  }

  // ===== Back to top button =====
  const backToTop = document.createElement("button");
  backToTop.type = "button";
  backToTop.className = "back-to-top";
  backToTop.setAttribute("aria-label", "חזרה למעלה");
  backToTop.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5l7 7-1.4 1.4L13 8.8V20h-2V8.8L6.4 13.4 5 12l7-7z" fill="currentColor"></path>
    </svg>
  `;
  document.body.appendChild(backToTop);

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  });

  // ===== On scroll (light) =====
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY || document.documentElement.scrollTop;

    // כפתור חזרה למעלה
    if (y > 520) backToTop.classList.add("is-visible");
    else backToTop.classList.remove("is-visible");

    // nav מקבל מצב scrolled
    if (nav) {
      if (y > 40) nav.classList.add("is-scrolled");
      else nav.classList.remove("is-scrolled");
    }
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true }
  );

  // init
  onScroll();
})();
