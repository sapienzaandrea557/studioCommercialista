(function () {
  "use strict";

  const init = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const id = this.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        }
      });
    });

    const header = document.querySelector(".site-header");
    if (header) {
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const isScrolled = window.scrollY > 20;
            if (header.classList.contains("is-scrolled") !== isScrolled) {
              header.classList.toggle("is-scrolled", isScrolled);
              header.style.background = isScrolled ? "rgba(255, 255, 255, 0.9)" : "transparent";
            }
            ticking = false;
          });
          ticking = true;
        }
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    /* ——— Mobile Menu Logic ——— */
    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");
    if (menuToggle && mainNav) {
      const toggleMenu = (open) => {
        const isOpen = typeof open === "boolean" ? open : !mainNav.classList.contains("open");
        mainNav.classList.toggle("open", isOpen);
        menuToggle.classList.toggle("open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        document.body.classList.toggle("menu-open", isOpen);
      };

      menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      document.addEventListener("click", (e) => {
        if (mainNav.classList.contains("open") && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
          toggleMenu(false);
        }
      });

      mainNav.querySelectorAll("a, button").forEach(link => {
        link.addEventListener("click", () => toggleMenu(false));
      });
    }

    /* ——— Intersection Observer for reveals ——— */
    if (!reduceMotion) {
      const revealEls = document.querySelectorAll(".reveal");
      if (revealEls.length) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add("is-visible");
                io.unobserve(en.target);
              }
            });
          },
          { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        );
        revealEls.forEach((el) => io.observe(el));
      }
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    }

    /* Nav attiva in base alla sezione */
    const navLinks = document.querySelectorAll(".nav a[data-section]");
    const sections = Array.from(document.querySelectorAll("main section[id]")).filter(s => {
      return Array.from(navLinks).some(a => a.getAttribute("data-section") === s.id);
    });

    if (navLinks.length && sections.length && "IntersectionObserver" in window) {
      const navIo = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const id = en.target.id;
              navLinks.forEach((a) => {
                a.classList.toggle("is-active", a.getAttribute("data-section") === id);
              });
            }
          });
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      sections.forEach((sec) => navIo.observe(sec));
    }
  };

  if (window.requestIdleCallback) {
    window.requestIdleCallback(init);
  } else {
    setTimeout(init, 100);
  }

  // Modals logic (not in init because they need to be available for data-open-modal)
  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m._lastFocusedElement = document.activeElement;
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";
    const focusable = m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) setTimeout(() => focusable[0].focus(), 100);
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    if (m._lastFocusedElement) m._lastFocusedElement.focus();
  }

  document.querySelectorAll("[data-open-modal]").forEach((btn) => {
    btn.addEventListener("click", () => openModal(btn.getAttribute("data-open-modal")));
  });

  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => closeModal(btn.getAttribute("data-close-modal")));
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal:not([hidden])").forEach((m) => closeModal(m.id));
    }
  });

  const calIframe = document.getElementById("calendly-iframe");
  const CALENDLY_URL = "https://calendly.com/sapienzaandrea557/15min";

  function ensureCalendlyIframeSrc() {
    if (!calIframe) return;
    const currentSrc = String(calIframe.getAttribute("src") || "");
    if (!currentSrc || currentSrc === "about:blank" || !currentSrc.includes("calendly.com")) {
      calIframe.setAttribute("src", CALENDLY_URL + (CALENDLY_URL.includes("?") ? "&" : "?") + "embed_domain=" + encodeURIComponent(location.origin) + "&embed_type=Inline&hide_gdpr_banner=1");
    }
  }

  document.querySelectorAll("[data-open-calendly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("modal-booking");
      ensureCalendlyIframeSrc();
    });
  });
})();
