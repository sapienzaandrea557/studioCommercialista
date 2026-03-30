/* 
  Studio Sapienza - Main.js 
  Versione Demo/Prova
  SEO Indexing: Consulenza Fiscale Roma, Commercialista Trastevere, Revisione Legale Conti, 
  Dichiarazione 730, Modello Unico, Apertura Partita IVA, Contabilità Semplificata, 
  Consulenza Tributaria, Business Plan, Analisi Finanziaria.
*/
(function () {
  "use strict";

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
        // Usiamo scrollIntoView con behavior smooth se supportato, 
        // altrimenti fallback su scrollTo con offset.
        // scroll-margin-top nel CSS gestirà l'offset correttamente.
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

    // Chiudi menu quando si clicca fuori
    document.addEventListener("click", (e) => {
      if (mainNav.classList.contains("open") && !mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
        toggleMenu(false);
      }
    });

    // Chiudi menu quando si clicca un link
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
  const sectionIds = new Set(Array.from(navLinks).map((a) => a.getAttribute("data-section")));
  const sections = Array.from(document.querySelectorAll("main section[id]")).filter((s) => sectionIds.has(s.id));
  navLinks.forEach((a) => a.classList.remove("is-active"));
  document.querySelector('.nav a[data-section="home"]')?.classList.add("is-active");

  if (navLinks.length && sections.length && "IntersectionObserver" in window) {
    const navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const id = en.target.id;
          navLinks.forEach((a) => {
            a.classList.toggle("is-active", a.getAttribute("data-section") === id);
          });
        });
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((sec) => navIo.observe(sec));
  }

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    
    // Salva l'elemento che aveva il focus per ripristinarlo alla chiusura
    m._lastFocusedElement = document.activeElement;
    
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    document.body.style.overflow = "hidden";

    // Focus sul primo elemento interattivo della modale (o il tasto chiudi)
    const focusable = m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) {
      setTimeout(() => focusable[0].focus(), 100);
    }

    // Per il booking vogliamo che si veda subito senza dover scrollare:
    // azzeriamo l'eventuale scroll interno del contenitore modale.
    if (id === "modal-booking") {
      setTimeout(() => {
        const dialog = m.querySelector(".modal-dialog");
        if (dialog && typeof dialog.scrollTop === "number") dialog.scrollTop = 0;
      }, 0);
    }
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";

    // Ripristina il focus
    if (m._lastFocusedElement) {
      m._lastFocusedElement.focus();
    }
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
    
    // Trap focus inside modal
    if (e.key === "Tab") {
      const openModal = document.querySelector(".modal:not([hidden])");
      if (openModal) {
        const focusable = openModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        
        if (e.shiftKey) { // Backwards
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else { // Forwards
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
  });

  const calIframe = document.getElementById("calendly-iframe");
  const CALENDLY_URL = "https://calendly.com/sapienzaandrea557/15min";

  function ensureCalendlyIframeSrc() {
    if (!calIframe) return;
    const currentSrc = String(calIframe.getAttribute("src") || "");
    // Se l'iframe è ancora su about:blank (o non contiene calendly), impostiamo la src.
    const needsUpdate =
      !currentSrc ||
      currentSrc === "about:blank" ||
      !currentSrc.includes("calendly.com") ||
      currentSrc.includes("background_color=");

    if (needsUpdate) {
      calIframe.setAttribute(
        "src",
        CALENDLY_URL +
          (CALENDLY_URL.includes("?") ? "&" : "?") +
          "embed_domain=" +
          encodeURIComponent(location.origin) +
          "&embed_type=Inline&hide_gdpr_banner=1"
      );
    }
  }

  document.querySelectorAll("[data-open-calendly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("modal-booking");
      ensureCalendlyIframeSrc();
    });
  });

  window.addEventListener("resize", () => {
    // Eventuali logiche di resize se necessarie in futuro
  });

  const infoForm = document.getElementById("form-info");
  if (infoForm) {
    const msg = document.getElementById("form-info-message");
    infoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (msg) {
        msg.hidden = true;
        msg.textContent = "";
      }
      const privacy = infoForm.querySelector('input[name="privacy"]');
      if (privacy && !privacy.checked) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = "Devi accettare la privacy per inviare la richiesta.";
          msg.classList.add("is-error");
        }
        return;
      }
      const fd = new FormData(infoForm);
      const data = Object.fromEntries(fd.entries());
      
      // Basic validation
      if (!data.nome || !data.email || !data.messaggio) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = "Per favore, compila tutti i campi obbligatori.";
          msg.classList.add("is-error");
        }
        return;
      }

      const submitBtn = infoForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.textContent : "";
      
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Invio in corso...";
        }
        
        const res = await fetch(infoForm.action, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (msg) {
          msg.hidden = false;
          msg.textContent = "Messaggio inviato. Ti ricontatteremo al più presto.";
          msg.classList.remove("is-error");
        }
        infoForm.reset();
      } catch (err) {
        if (msg) {
          msg.hidden = false;
          msg.textContent = "Invio non riuscito. Riprova o scrivi a sapienzaandrea557@gmail.com";
          msg.classList.add("is-error");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  const STORAGE_KEY = "cookie_consent_v1";

  function applyConsent(level) {
    if (level === "all" || level === "analytics") {
      /* Hook analytics */
    }
  }

  function readConsent() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function writeConsent(level) {
    try {
      localStorage.setItem(STORAGE_KEY, level);
    } catch (_) {}
    applyConsent(level);
  }

  const banner = document.getElementById("cookie-banner");
  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function showBanner() {
    if (banner) banner.hidden = false;
  }

  const existing = readConsent();
  if (existing) {
    applyConsent(existing);
    hideBanner();
  } else {
    showBanner();
  }

  document.getElementById("cookie-accept-necessary")?.addEventListener("click", () => {
    writeConsent("necessary");
    hideBanner();
  });
  document.getElementById("cookie-accept-analytics")?.addEventListener("click", () => {
    writeConsent("analytics");
    hideBanner();
  });
  document.getElementById("cookie-accept-all")?.addEventListener("click", () => {
    writeConsent("all");
    hideBanner();
  });
})();
