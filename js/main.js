(function () {
  "use strict";

  const init = () => {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* --- SPA Navigation Logic --- */
    const sections = document.querySelectorAll(".section");
    const links = document.querySelectorAll(".nav a, .logo, .btn-hero-scroll");

    function showSection(targetId) {
      const id = targetId.replace("#", "");
      let found = false;
      
      sections.forEach(section => {
        if (section.id === id) {
          section.style.display = "block";
          // Trigger reflow for transition
          section.offsetHeight; 
          section.classList.add("is-active");
          found = true;
        } else {
          section.classList.remove("is-active");
          section.style.display = "none";
        }
      });

      // Update active link
      document.querySelectorAll(".nav a").forEach(l => {
        l.classList.toggle("is-active", l.getAttribute("href") === targetId);
      });

      if (found) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (id !== "home") {
          history.pushState(null, null, targetId);
        } else {
          history.pushState(null, null, window.location.pathname);
        }
      }
    }

    // Initialize: Show Home or hash section
    const initialHash = window.location.hash || "#home";
    showSection(initialHash);

    links.forEach(link => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          showSection(href);
          
          // Mobile menu auto-close
          const nav = document.getElementById("main-nav");
          const menuToggle = document.querySelector(".menu-toggle");
          if (nav && nav.classList.contains("open")) {
            nav.classList.remove("open");
            menuToggle.classList.remove("open");
            document.body.classList.remove("modal-open");
          }
        }
      });
    });

    window.addEventListener("popstate", () => {
      showSection(window.location.hash || "#home");
    });

    const header = document.querySelector(".site-header");
    if (header) {
      let ticking = false;
      let lastScrollY = window.scrollY;

      const onScroll = () => {
        lastScrollY = window.scrollY;
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const isScrolled = lastScrollY > 20;
            header.classList.toggle("is-scrolled", isScrolled);
            ticking = false;
          });
          ticking = true;
        }
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
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

    /* ——— Mobile Menu ——— */
    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.getElementById("main-nav");
    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("open");
        menuToggle.classList.toggle("open", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
      });
    }

    /* ——— Map Loading ——— */
    const loadMapBtn = document.getElementById("load-map");
    const mapEmbed = document.getElementById("map-embed");
    if (loadMapBtn && mapEmbed) {
      const handleMapLoad = (e) => {
        e.preventDefault();
        loadMapBtn.style.display = "none";
        mapEmbed.hidden = false;
        mapEmbed.style.display = "block";
        mapEmbed.innerHTML = `<iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2970.366223847841!2d12.4683!3d41.8841!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132f60473e34a655%3A0x6a0c5c3c0c0c0c0c!2sVia%20Napoleone%20Parboni%2C%2012%2C%2000153%20Roma%20RM!5e0!3m2!1sit!2sit!4v1711720000000!5m2!1sit!2sit" 
          width="100%" height="100%" style="border:0; min-height: 400px;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      };
      loadMapBtn.addEventListener("click", handleMapLoad);
      // Support for touch devices
      loadMapBtn.addEventListener("touchend", (e) => {
        if (!mapEmbed.innerHTML) handleMapLoad(e);
      }, { passive: false });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
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
        container.innerHTML = `<iframe id="calendly-iframe" src="${CALENDLY_URL}?embed_domain=${encodeURIComponent(location.origin)}&embed_type=Inline&hide_gdpr_banner=1" width="100%" height="100%" frameborder="0" loading="lazy"></iframe>`;
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
