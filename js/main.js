(function () {
  "use strict";

  const init = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll fluido per i link interni
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

    // Header scroll effect
    const header = document.querySelector(".site-header");
    if (header) {
      let ticking = false;
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const isScrolled = window.scrollY > 20;
            if (header.classList.contains("is-scrolled") !== isScrolled) {
              header.classList.toggle("is-scrolled", isScrolled);
              // Forza il colore di sfondo per evitare problemi di rendering
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

    // Mobile Menu
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

    // Reveal animations on scroll
    if (!reduceMotion && "IntersectionObserver" in window) {
      const revealEls = document.querySelectorAll(".reveal");
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("is-visible");
              io.unobserve(en.target);
            }
          });
        },
        { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
    }

    // Active nav link on scroll
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

  // Caricamento differito per non bloccare il thread principale (TBT reduction)
  if (window.requestIdleCallback) {
    window.requestIdleCallback(init);
  } else {
    setTimeout(init, 200);
  }

  // Logica Modali (fuori da init per disponibilità immediata ai pulsanti)
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

  // Logica Calendly
  const CALENDLY_URL = "https://calendly.com/sapienzaandrea557/15min";
  document.querySelectorAll("[data-open-calendly]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openModal("modal-booking");
      const container = document.getElementById("calendly-container");
      if (container && !container.innerHTML) {
        container.innerHTML = `<iframe id="calendly-iframe" src="${CALENDLY_URL}?embed_domain=${encodeURIComponent(location.origin)}&embed_type=Inline&hide_gdpr_banner=1" width="100%" height="100%" frameborder="0"></iframe>`;
      }
    });
  });

  // Gestione Formspree (Contatti)
  const infoForm = document.getElementById("form-info");
  if (infoForm) {
    infoForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = document.getElementById("form-info-message");
      const submitBtn = infoForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Invio...";
        const res = await fetch(infoForm.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(infoForm)))
        });
        if (res.ok) {
          msg.textContent = "Messaggio inviato con successo!";
          msg.hidden = false;
          infoForm.reset();
        } else {
          throw new Error();
        }
      } catch (err) {
        msg.textContent = "Errore nell'invio. Riprova più tardi.";
        msg.hidden = false;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
})();
